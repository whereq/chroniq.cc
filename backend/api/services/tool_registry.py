"""SOL tool registry — exposes chroniq calendar queries as LLM-callable tools.

Phase 1 is read-only: the assistant can inspect event types, availability,
bookings, and compute real bookable slots via the slot engine. Write actions
(create/reschedule/cancel) are added in a later phase behind confirmation cards
(the `_proposal` mechanism, already threaded through the gateway).

Tools are declared in OpenAI function-calling format; LiteLLM translates them to
each provider's native format.
"""
from __future__ import annotations

import json
import logging
from datetime import date, datetime, time, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from api.services.slot_engine import BusyBlock, generate_slots, to_tz
from chroniq.models.availability import AvailabilitySchedule
from chroniq.models.booking import Booking
from chroniq.models.event_type import EventType
from chroniq.models.user_profile import UserProfile

logger = logging.getLogger(__name__)

_DOW = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]


class ToolRegistry:
    """Declares and executes SOL's calendar tools against the DB."""

    # -- Definitions --------------------------------------------------------

    def _all_definitions(self) -> list[dict]:
        return [
            {
                "type": "function",
                "function": {
                    "name": "list_event_types",
                    "description": "List the host's meeting types (event types): title, slug, duration, location, buffers, and whether active.",
                    "parameters": {"type": "object", "properties": {}, "required": []},
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "get_availability",
                    "description": "Get the host's default availability schedule: timezone, weekly working hours per weekday, and any date-specific overrides (days off / altered hours).",
                    "parameters": {"type": "object", "properties": {}, "required": []},
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "list_bookings",
                    "description": "List the host's bookings. Use filter to choose which set.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "filter": {
                                "type": "string",
                                "enum": ["upcoming", "past", "cancelled", "all"],
                                "description": "Which bookings to return (default upcoming).",
                            },
                            "limit": {"type": "integer", "description": "Max rows (default 20, max 50)."},
                        },
                        "required": [],
                    },
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "get_slots",
                    "description": "Compute the host's real bookable time slots for a meeting type on a given date (or across a small date range), honoring availability, buffers, notice window, and existing bookings.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "event_type": {"type": "string", "description": "Event type title or slug. Defaults to the host's first active type."},
                            "date": {"type": "string", "description": "Start date, YYYY-MM-DD. Defaults to today (host timezone)."},
                            "days": {"type": "integer", "description": "Number of days to scan from date (default 1, max 14)."},
                        },
                        "required": [],
                    },
                },
            },
        ]

    def get_definitions(self, names: list[str] | None = None) -> list[dict]:
        defs = self._all_definitions()
        if names:
            allowed = set(names)
            return [d for d in defs if d["function"]["name"] in allowed]
        return defs

    # -- Execution ----------------------------------------------------------

    async def execute(self, tool_calls, db: AsyncSession, user_id: str) -> list[dict]:
        """Run each requested tool; return [{tool_call_id, content, proposal?}]."""
        results: list[dict] = []
        for call in tool_calls:
            name = call.function.name
            try:
                args = json.loads(call.function.arguments or "{}")
            except Exception:
                args = {}
            try:
                result = await self._dispatch(name, args, db, user_id)
            except Exception as exc:  # never crash the chat on a tool error
                logger.warning("SOL tool %s failed: %s", name, exc)
                result = {"error": f"{name} failed: {exc}"}
            proposal = result.pop("_proposal", None) if isinstance(result, dict) else None
            entry = {"tool_call_id": call.id, "content": json.dumps(result, default=str)}
            if proposal:
                entry["proposal"] = proposal
            results.append(entry)
        return results

    async def _dispatch(self, name: str, args: dict, db: AsyncSession, user_id: str) -> dict:
        if name == "list_event_types":
            return await self._list_event_types(db, user_id)
        if name == "get_availability":
            return await self._get_availability(db, user_id)
        if name == "list_bookings":
            return await self._list_bookings(db, user_id, args)
        if name == "get_slots":
            return await self._get_slots(db, user_id, args)
        return {"error": f"unknown tool {name}"}

    # -- Tools --------------------------------------------------------------

    async def _list_event_types(self, db: AsyncSession, uid: str) -> dict:
        rows = (
            await db.execute(select(EventType).where(EventType.keycloak_id == uid).order_by(EventType.id))
        ).scalars().all()
        return {
            "count": len(rows),
            "event_types": [
                {
                    "title": e.title,
                    "slug": e.slug,
                    "duration_minutes": e.duration_minutes,
                    "location": e.location,
                    "buffer_before": e.buffer_before,
                    "buffer_after": e.buffer_after,
                    "min_notice_minutes": e.min_notice_minutes,
                    "booking_window_days": e.booking_window_days,
                    "active": e.is_active,
                }
                for e in rows
            ],
        }

    async def _default_schedule(self, db: AsyncSession, uid: str, schedule_id: int | None = None):
        stmt = (
            select(AvailabilitySchedule)
            .where(AvailabilitySchedule.keycloak_id == uid)
            .options(
                selectinload(AvailabilitySchedule.rules),
                selectinload(AvailabilitySchedule.overrides),
            )
        )
        if schedule_id:
            stmt = stmt.where(AvailabilitySchedule.id == schedule_id)
        else:
            stmt = stmt.where(AvailabilitySchedule.is_default.is_(True))
        return (await db.execute(stmt)).scalars().first()

    async def _get_availability(self, db: AsyncSession, uid: str) -> dict:
        sched = await self._default_schedule(db, uid)
        if sched is None:
            return {"message": "No availability schedule set up yet."}
        rules = sorted(sched.rules, key=lambda r: (r.day_of_week, r.start_time))
        return {
            "schedule": sched.name,
            "timezone": sched.timezone,
            "weekly_hours": [
                {
                    "day": _DOW[r.day_of_week],
                    "start": r.start_time.strftime("%H:%M"),
                    "end": r.end_time.strftime("%H:%M"),
                    "enabled": r.is_enabled,
                }
                for r in rules
            ],
            "overrides": [
                {
                    "date": o.date.isoformat(),
                    "unavailable": o.is_unavailable,
                    "start": o.start_time.strftime("%H:%M") if o.start_time else None,
                    "end": o.end_time.strftime("%H:%M") if o.end_time else None,
                }
                for o in sorted(sched.overrides, key=lambda o: o.date)
            ],
        }

    async def _list_bookings(self, db: AsyncSession, uid: str, args: dict) -> dict:
        filt = (args.get("filter") or "upcoming").lower()
        limit = max(1, min(int(args.get("limit") or 20), 50))
        now = datetime.now(timezone.utc)
        stmt = select(Booking).where(Booking.host_keycloak_id == uid)
        if filt == "upcoming":
            stmt = stmt.where(Booking.start_utc >= now, Booking.status == "confirmed").order_by(Booking.start_utc)
        elif filt == "past":
            stmt = stmt.where(Booking.start_utc < now).order_by(Booking.start_utc.desc())
        elif filt == "cancelled":
            stmt = stmt.where(Booking.status == "cancelled").order_by(Booking.start_utc.desc())
        else:
            stmt = stmt.order_by(Booking.start_utc.desc())
        rows = (await db.execute(stmt.limit(limit))).scalars().all()
        return {
            "filter": filt,
            "count": len(rows),
            "bookings": [
                {
                    "id": b.id,
                    "invitee_name": b.invitee_name,
                    "invitee_email": b.invitee_email,
                    "start_utc": b.start_utc.isoformat(),
                    "end_utc": b.end_utc.isoformat(),
                    "status": b.status,
                    "notes": b.notes,
                }
                for b in rows
            ],
        }

    async def _get_slots(self, db: AsyncSession, uid: str, args: dict) -> dict:
        # Resolve the event type (by slug/title, else first active).
        wanted = (args.get("event_type") or "").strip().lower()
        types = (
            await db.execute(select(EventType).where(EventType.keycloak_id == uid).order_by(EventType.id))
        ).scalars().all()
        if not types:
            return {"message": "No event types exist yet — create one first."}
        et = None
        if wanted:
            et = next((e for e in types if e.slug.lower() == wanted or e.title.lower() == wanted), None)
        if et is None:
            et = next((e for e in types if e.is_active), types[0])

        sched = await self._default_schedule(db, uid, et.schedule_id)
        if sched is None:
            return {"message": "No availability schedule set up — SOL can't compute slots yet."}
        tz = sched.timezone or "UTC"

        # Start date (host tz) + range.
        try:
            start = date.fromisoformat(args["date"]) if args.get("date") else datetime.now(timezone.utc).astimezone(__import__("zoneinfo").ZoneInfo(tz)).date()
        except Exception:
            return {"error": "date must be YYYY-MM-DD"}
        days = max(1, min(int(args.get("days") or 1), 14))

        # Busy = confirmed bookings across the scanned range.
        range_start = datetime.combine(start, time.min, tzinfo=timezone.utc)
        range_end = datetime.combine(start + timedelta(days=days), time.min, tzinfo=timezone.utc)
        busy_rows = (
            await db.execute(
                select(Booking).where(
                    Booking.host_keycloak_id == uid,
                    Booking.status == "confirmed",
                    Booking.end_utc >= range_start,
                    Booking.start_utc <= range_end,
                )
            )
        ).scalars().all()
        busy = [BusyBlock(start=b.start_utc, end=b.end_utc) for b in busy_rows]

        out_days = []
        total = 0
        for i in range(days):
            d = start + timedelta(days=i)
            slots = generate_slots(
                event_type=et, schedule=sched, rules=list(sched.rules),
                overrides=list(sched.overrides), busy=busy, day=d, invitee_tz=tz,
            )
            times = [to_tz(s.start, tz).strftime("%H:%M") for s in slots]
            total += len(times)
            out_days.append({"date": d.isoformat(), "weekday": _DOW[(d.weekday() + 1) % 7], "open_slots": times})

        return {
            "event_type": et.title,
            "duration_minutes": et.duration_minutes,
            "timezone": tz,
            "total_open_slots": total,
            "days": out_days,
        }
