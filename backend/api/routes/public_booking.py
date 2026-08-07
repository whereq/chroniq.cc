"""Public (unauthenticated) booking flow.

    GET  /public/{username}                       -> host + active event types
    GET  /public/{username}/{slug}                -> single event type
    GET  /public/{username}/{slug}/slots?date=... -> available slots
    POST /public/{username}/{slug}/book           -> create booking
    GET  /public/bookings/{cancel_token}          -> invitee view
    POST /public/bookings/{cancel_token}/cancel   -> invitee self-cancel
"""

import secrets
from datetime import date, datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from api.schemas.booking import (
    BookingConfirmation,
    BookingCreate,
    BookingOut,
    ManagedBooking,
    PublicEventType,
    PublicHost,
    PublicHostPage,
    RescheduleRequest,
    SlotOut,
    SlotsResponse,
)
from api.services import calendar_providers, notifications
from api.services.slot_engine import BusyBlock, generate_slots, to_tz
from chroniq.database import get_db
from chroniq.models.availability import AvailabilitySchedule
from chroniq.models.booking import Booking
from chroniq.models.calendar_connection import CalendarConnection
from chroniq.models.event_type import EventType
from chroniq.models.user_profile import UserProfile

router = APIRouter(prefix="/public", tags=["public"])


async def _host(db: AsyncSession, username: str) -> UserProfile:
    profile = (
        await db.execute(select(UserProfile).where(UserProfile.username == username))
    ).scalar_one_or_none()
    if profile is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Host not found")
    return profile


async def _event(db: AsyncSession, uid, slug: str) -> EventType:
    et = (
        await db.execute(
            select(EventType).where(
                EventType.keycloak_id == uid,
                EventType.slug == slug,
                EventType.is_active.is_(True),
            )
        )
    ).scalar_one_or_none()
    if et is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Event type not found")
    return et


async def _schedule_for(db: AsyncSession, uid, event_type: EventType) -> AvailabilitySchedule | None:
    stmt = (
        select(AvailabilitySchedule)
        .where(AvailabilitySchedule.keycloak_id == uid)
        .options(
            selectinload(AvailabilitySchedule.rules),
            selectinload(AvailabilitySchedule.overrides),
        )
    )
    if event_type.schedule_id:
        stmt = stmt.where(AvailabilitySchedule.id == event_type.schedule_id)
    else:
        stmt = stmt.where(AvailabilitySchedule.is_default.is_(True))
    return (await db.execute(stmt)).scalars().first()


@router.get("/{username}", response_model=PublicHostPage)
async def host_page(username: str, db: AsyncSession = Depends(get_db)):
    profile = await _host(db, username)
    events = (
        await db.execute(
            select(EventType).where(
                EventType.keycloak_id == profile.keycloak_id,
                EventType.is_active.is_(True),
            ).order_by(EventType.id)
        )
    ).scalars().all()
    return PublicHostPage(
        host=PublicHost(
            username=profile.username,
            display_name=profile.display_name,
            avatar_url=profile.avatar_url,
            brand_color=profile.brand_color,
            bio=profile.bio,
            timezone=profile.timezone,
            remove_branding=profile.remove_branding,
        ),
        event_types=[
            PublicEventType(
                slug=e.slug, title=e.title, description=e.description,
                duration_minutes=e.duration_minutes, location=e.location, color=e.color,
            )
            for e in events
        ],
    )


@router.get("/{username}/{slug}", response_model=PublicEventType)
async def event_details(username: str, slug: str, db: AsyncSession = Depends(get_db)):
    profile = await _host(db, username)
    e = await _event(db, profile.keycloak_id, slug)
    return PublicEventType(
        slug=e.slug, title=e.title, description=e.description,
        duration_minutes=e.duration_minutes, location=e.location, color=e.color,
    )


@router.get("/{username}/{slug}/slots", response_model=SlotsResponse)
async def available_slots(
    username: str,
    slug: str,
    date_str: str = Query(alias="date", description="YYYY-MM-DD"),
    tz: str = Query(default="UTC"),
    db: AsyncSession = Depends(get_db),
):
    profile = await _host(db, username)
    event_type = await _event(db, profile.keycloak_id, slug)
    schedule = await _schedule_for(db, profile.keycloak_id, event_type)
    if schedule is None:
        return SlotsResponse(timezone=tz, date=date_str, slots=[])

    try:
        day = date.fromisoformat(date_str)
    except ValueError:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Invalid date")

    day_start = datetime.combine(day, datetime.min.time(), tzinfo=timezone.utc)
    day_end = datetime.combine(day, datetime.max.time(), tzinfo=timezone.utc)

    # Existing confirmed bookings become busy blocks.
    existing = (
        await db.execute(
            select(Booking).where(
                Booking.host_keycloak_id == profile.keycloak_id,
                Booking.status == "confirmed",
                Booking.start_utc < day_end,
                Booking.end_utc > day_start,
            )
        )
    ).scalars().all()
    busy = [BusyBlock(b.start_utc, b.end_utc) for b in existing]

    # External calendar busy blocks (Google/Microsoft) — no-op until Phase 3.
    connections = (
        await db.execute(
            select(CalendarConnection).where(
                CalendarConnection.keycloak_id == profile.keycloak_id
            )
        )
    ).scalars().all()
    busy.extend(await calendar_providers.merged_busy(list(connections), day_start, day_end))

    slots = generate_slots(
        event_type=event_type,
        schedule=schedule,
        rules=schedule.rules,
        overrides=schedule.overrides,
        busy=busy,
        day=day,
        invitee_tz=tz,
    )
    return SlotsResponse(
        timezone=tz,
        date=date_str,
        slots=[SlotOut(start=to_tz(s.start, tz), end=to_tz(s.end, tz)) for s in slots],
    )


@router.post("/{username}/{slug}/book", response_model=BookingConfirmation, status_code=201)
async def create_booking(
    username: str,
    slug: str,
    payload: BookingCreate,
    db: AsyncSession = Depends(get_db),
):
    profile = await _host(db, username)
    event_type = await _event(db, profile.keycloak_id, slug)

    start_utc = payload.start.astimezone(timezone.utc)
    if start_utc <= datetime.now(timezone.utc):
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Cannot book a past time")
    end_utc = start_utc + timedelta(minutes=event_type.duration_minutes)

    # Guard: the requested start must still be an offered slot for that day.
    schedule = await _schedule_for(db, profile.keycloak_id, event_type)
    if schedule is None:
        raise HTTPException(status.HTTP_409_CONFLICT, "Host has no availability")
    day_start = datetime.combine(start_utc.date(), datetime.min.time(), tzinfo=timezone.utc)
    day_end = datetime.combine(start_utc.date(), datetime.max.time(), tzinfo=timezone.utc)
    existing = (
        await db.execute(
            select(Booking).where(
                Booking.host_keycloak_id == profile.keycloak_id,
                Booking.status == "confirmed",
                Booking.start_utc < day_end,
                Booking.end_utc > day_start,
            )
        )
    ).scalars().all()
    busy = [BusyBlock(b.start_utc, b.end_utc) for b in existing]
    offered = {
        s.start for s in generate_slots(
            event_type=event_type, schedule=schedule, rules=schedule.rules,
            overrides=schedule.overrides, busy=busy, day=start_utc.date(),
            invitee_tz=payload.invitee_timezone,
        )
    }
    if start_utc not in offered:
        raise HTTPException(status.HTTP_409_CONFLICT, "That slot is no longer available")

    booking = Booking(
        host_keycloak_id=profile.keycloak_id,
        event_type_id=event_type.id,
        invitee_name=payload.invitee_name,
        invitee_email=payload.invitee_email,
        invitee_timezone=payload.invitee_timezone,
        notes=payload.notes,
        start_utc=start_utc,
        end_utc=end_utc,
        status="confirmed",
        cancel_token=secrets.token_urlsafe(24),
        meeting_url=event_type.location_detail if event_type.location == "video" else None,
    )
    db.add(booking)
    try:
        await db.commit()
    except IntegrityError:
        # Raised by the overlap exclusion constraint on a race.
        await db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "That slot was just taken")
    await db.refresh(booking)

    # Write the event to the host's first synced external calendar (best-effort).
    synced = (
        await db.execute(
            select(CalendarConnection).where(
                CalendarConnection.keycloak_id == profile.keycloak_id,
                CalendarConnection.sync_enabled.is_(True),
            )
        )
    ).scalars().all()
    for conn in synced:
        try:
            ext_id = await calendar_providers.get_provider(conn.provider).create_event(
                conn, booking, profile.display_name, event_type.title
            )
            if ext_id:
                booking.external_event_id = ext_id
                booking.external_provider = conn.provider
                await db.commit()
                await db.refresh(booking)
                break
        except Exception:  # pragma: no cover - never fail the booking on sync issues
            await db.rollback()

    # Fire-and-forget-ish: confirmation email (log-only until SMTP configured).
    try:
        notifications.send_confirmation(booking, profile.display_name, "", event_type.title)
    except Exception:  # pragma: no cover - never fail the booking on email issues
        pass

    return BookingConfirmation(
        booking=booking,
        cancel_token=booking.cancel_token,
        host_display_name=profile.display_name,
        event_title=event_type.title,
    )


@router.get("/bookings/{cancel_token}", response_model=ManagedBooking)
async def invitee_view(cancel_token: str, db: AsyncSession = Depends(get_db)):
    booking = (
        await db.execute(select(Booking).where(Booking.cancel_token == cancel_token))
    ).scalar_one_or_none()
    if booking is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Booking not found")
    profile = await db.get(UserProfile, booking.host_keycloak_id)
    event_type = await db.get(EventType, booking.event_type_id)
    if profile is None or event_type is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Booking not found")
    return ManagedBooking(
        id=booking.id,
        status=booking.status,
        start_utc=booking.start_utc,
        end_utc=booking.end_utc,
        invitee_name=booking.invitee_name,
        invitee_timezone=booking.invitee_timezone,
        meeting_url=booking.meeting_url,
        host_username=profile.username,
        host_display_name=profile.display_name or profile.username,
        event_slug=event_type.slug,
        event_title=event_type.title,
        duration_minutes=event_type.duration_minutes,
    )


@router.post("/bookings/{cancel_token}/cancel", response_model=BookingOut)
async def invitee_cancel(cancel_token: str, db: AsyncSession = Depends(get_db)):
    booking = (
        await db.execute(select(Booking).where(Booking.cancel_token == cancel_token))
    ).scalar_one_or_none()
    if booking is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Booking not found")
    booking.status = "cancelled"
    await db.commit()

    # Remove the event from the host's external calendar (best-effort).
    if booking.external_event_id and booking.external_provider:
        conn = (
            await db.execute(
                select(CalendarConnection).where(
                    CalendarConnection.keycloak_id == booking.host_keycloak_id,
                    CalendarConnection.provider == booking.external_provider,
                )
            )
        ).scalar_one_or_none()
        if conn:
            try:
                await calendar_providers.get_provider(conn.provider).delete_event(
                    conn, booking.external_event_id
                )
            except Exception:  # pragma: no cover - best effort
                pass

    await db.refresh(booking)
    return booking


@router.post("/bookings/{cancel_token}/reschedule", response_model=BookingOut)
async def invitee_reschedule(
    cancel_token: str,
    payload: RescheduleRequest,
    db: AsyncSession = Depends(get_db),
):
    booking = (
        await db.execute(select(Booking).where(Booking.cancel_token == cancel_token))
    ).scalar_one_or_none()
    if booking is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Booking not found")
    if booking.status != "confirmed":
        raise HTTPException(status.HTTP_409_CONFLICT, "Only confirmed bookings can be rescheduled")

    profile = await db.get(UserProfile, booking.host_keycloak_id)
    event_type = await db.get(EventType, booking.event_type_id)
    if profile is None or event_type is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Booking not found")

    new_start = payload.start.astimezone(timezone.utc)
    if new_start <= datetime.now(timezone.utc):
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Cannot reschedule to the past")
    new_end = new_start + timedelta(minutes=event_type.duration_minutes)

    schedule = await _schedule_for(db, profile.keycloak_id, event_type)
    if schedule is None:
        raise HTTPException(status.HTTP_409_CONFLICT, "Host has no availability")

    # Offered slots for the new day, treating THIS booking's current slot as free.
    day_start = datetime.combine(new_start.date(), datetime.min.time(), tzinfo=timezone.utc)
    day_end = datetime.combine(new_start.date(), datetime.max.time(), tzinfo=timezone.utc)
    existing = (
        await db.execute(
            select(Booking).where(
                Booking.host_keycloak_id == profile.keycloak_id,
                Booking.status == "confirmed",
                Booking.id != booking.id,
                Booking.start_utc < day_end,
                Booking.end_utc > day_start,
            )
        )
    ).scalars().all()
    busy = [BusyBlock(b.start_utc, b.end_utc) for b in existing]
    offered = {
        s.start for s in generate_slots(
            event_type=event_type, schedule=schedule, rules=schedule.rules,
            overrides=schedule.overrides, busy=busy, day=new_start.date(),
            invitee_tz=booking.invitee_timezone,
        )
    }
    if new_start not in offered:
        raise HTTPException(status.HTTP_409_CONFLICT, "That slot is not available")

    booking.start_utc = new_start
    booking.end_utc = new_end
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "That slot was just taken")
    await db.refresh(booking)

    # Move the external calendar event (delete old + recreate) — best-effort.
    if booking.external_provider:
        conn = (
            await db.execute(
                select(CalendarConnection).where(
                    CalendarConnection.keycloak_id == profile.keycloak_id,
                    CalendarConnection.provider == booking.external_provider,
                )
            )
        ).scalar_one_or_none()
        if conn:
            provider = calendar_providers.get_provider(conn.provider)
            try:
                if booking.external_event_id:
                    await provider.delete_event(conn, booking.external_event_id)
                new_id = await provider.create_event(conn, booking, profile.display_name, event_type.title)
                booking.external_event_id = new_id
                await db.commit()
                await db.refresh(booking)
            except Exception:  # pragma: no cover - best effort
                await db.rollback()

    try:
        notifications.send_reschedule(booking, profile.display_name, "", event_type.title)
    except Exception:  # pragma: no cover
        pass

    return booking
