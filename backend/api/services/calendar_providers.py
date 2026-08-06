"""External calendar integration — Google Calendar + Microsoft Graph.

Implemented directly against the providers' REST APIs with httpx (no heavy
SDKs). Both providers implement the same interface used by the slot engine and
the booking flow:

    build_authorize_url(state)          -> str
    exchange_code(code)                 -> TokenBundle
    free_busy(conn, start, end)         -> list[BusyBlock]
    create_event(conn, booking, ...)    -> external_event_id
    delete_event(conn, external_id)     -> None

Response parsing is split into pure functions (``_parse_*``) that are unit
tested without network access. A failing provider degrades gracefully (empty
busy list) so bookings never hard-fail on an integration hiccup.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import datetime, timezone
from urllib.parse import urlencode

import httpx

from chroniq.config import get_settings
from chroniq.models.booking import Booking
from chroniq.models.calendar_connection import CalendarConnection
from api.services import token_crypto
from api.services.slot_engine import BusyBlock

logger = logging.getLogger(__name__)

GOOGLE_SCOPES = ["https://www.googleapis.com/auth/calendar"]
MS_SCOPES = ["Calendars.ReadWrite", "offline_access"]

GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_API = "https://www.googleapis.com/calendar/v3"


@dataclass
class TokenBundle:
    access_token: str
    refresh_token: str | None
    expiry: datetime | None
    account_email: str | None


def _iso(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def _parse_dt(value: str) -> datetime:
    dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


# ---------------------------------------------------------------------------
# Pure parsers (unit tested)
# ---------------------------------------------------------------------------
def _parse_google_freebusy(payload: dict, calendar_id: str = "primary") -> list[BusyBlock]:
    cal = (payload.get("calendars") or {}).get(calendar_id) or {}
    return [
        BusyBlock(_parse_dt(b["start"]), _parse_dt(b["end"]))
        for b in cal.get("busy", [])
        if b.get("start") and b.get("end")
    ]


def _parse_ms_schedule(payload: dict) -> list[BusyBlock]:
    blocks: list[BusyBlock] = []
    for entry in payload.get("value", []):
        for item in entry.get("scheduleItems", []):
            start = (item.get("start") or {}).get("dateTime")
            end = (item.get("end") or {}).get("dateTime")
            if start and end:
                blocks.append(BusyBlock(_parse_dt(start), _parse_dt(end)))
    return blocks


class CalendarProvider:
    name = "base"

    def build_authorize_url(self, state: str) -> str:  # pragma: no cover - abstract
        raise NotImplementedError

    async def exchange_code(self, code: str) -> TokenBundle:  # pragma: no cover - abstract
        raise NotImplementedError

    async def _valid_access_token(self, conn: CalendarConnection) -> str:  # pragma: no cover
        raise NotImplementedError

    async def free_busy(
        self, conn: CalendarConnection, start: datetime, end: datetime
    ) -> list[BusyBlock]:  # pragma: no cover - network
        raise NotImplementedError

    async def create_event(
        self, conn: CalendarConnection, booking: Booking, host_name: str, title: str
    ) -> str | None:  # pragma: no cover - network
        raise NotImplementedError

    async def delete_event(self, conn: CalendarConnection, external_id: str) -> None:  # pragma: no cover
        raise NotImplementedError


class GoogleCalendarProvider(CalendarProvider):
    name = "google"

    def build_authorize_url(self, state: str) -> str:
        s = get_settings()
        params = {
            "client_id": s.google_client_id,
            "redirect_uri": s.google_redirect_uri,
            "response_type": "code",
            "scope": " ".join(GOOGLE_SCOPES),
            "access_type": "offline",
            "prompt": "consent",
            "state": state,
        }
        return "https://accounts.google.com/o/oauth2/v2/auth?" + urlencode(params)

    async def exchange_code(self, code: str) -> TokenBundle:
        s = get_settings()
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                GOOGLE_TOKEN_URL,
                data={
                    "code": code,
                    "client_id": s.google_client_id,
                    "client_secret": s.google_client_secret,
                    "redirect_uri": s.google_redirect_uri,
                    "grant_type": "authorization_code",
                },
            )
            resp.raise_for_status()
            tok = resp.json()
        expiry = datetime.now(timezone.utc) + _timedelta(tok.get("expires_in", 3600))
        access_token = tok["access_token"]

        # Best-effort: the primary calendar's id is the account's email address
        # (works with the calendar scope; no extra identity scope needed).
        account_email: str | None = None
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                r = await client.get(
                    f"{GOOGLE_API}/calendars/primary",
                    headers={"Authorization": f"Bearer {access_token}"},
                )
                if r.status_code == 200:
                    account_email = r.json().get("id")
        except Exception:  # pragma: no cover - email is a nicety, never fatal
            pass

        return TokenBundle(access_token, tok.get("refresh_token"), expiry, account_email)

    async def _valid_access_token(self, conn: CalendarConnection) -> str:
        expiry = conn.token_expiry
        if expiry and expiry > datetime.now(timezone.utc):
            return token_crypto.decrypt(conn.access_token)  # type: ignore[return-value]
        # Refresh.
        s = get_settings()
        refresh = token_crypto.decrypt(conn.refresh_token)
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                GOOGLE_TOKEN_URL,
                data={
                    "refresh_token": refresh,
                    "client_id": s.google_client_id,
                    "client_secret": s.google_client_secret,
                    "grant_type": "refresh_token",
                },
            )
            resp.raise_for_status()
            tok = resp.json()
        conn.access_token = token_crypto.encrypt(tok["access_token"])
        conn.token_expiry = datetime.now(timezone.utc) + _timedelta(tok.get("expires_in", 3600))
        return tok["access_token"]

    async def free_busy(self, conn, start, end):
        token = await self._valid_access_token(conn)
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                f"{GOOGLE_API}/freeBusy",
                headers={"Authorization": f"Bearer {token}"},
                json={"timeMin": _iso(start), "timeMax": _iso(end), "items": [{"id": conn.calendar_id}]},
            )
            resp.raise_for_status()
            return _parse_google_freebusy(resp.json(), conn.calendar_id)

    async def create_event(self, conn, booking, host_name, title):
        token = await self._valid_access_token(conn)
        body = {
            "summary": f"{title} with {booking.invitee_name}",
            "description": booking.notes or "",
            "start": {"dateTime": _iso(booking.start_utc)},
            "end": {"dateTime": _iso(booking.end_utc)},
            "attendees": [{"email": booking.invitee_email}],
        }
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                f"{GOOGLE_API}/calendars/{conn.calendar_id}/events",
                headers={"Authorization": f"Bearer {token}"},
                json=body,
            )
            resp.raise_for_status()
            return resp.json().get("id")

    async def delete_event(self, conn, external_id):
        token = await self._valid_access_token(conn)
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.delete(
                f"{GOOGLE_API}/calendars/{conn.calendar_id}/events/{external_id}",
                headers={"Authorization": f"Bearer {token}"},
            )
            if resp.status_code not in (200, 204, 404, 410):
                resp.raise_for_status()


class MicrosoftGraphProvider(CalendarProvider):
    name = "microsoft"

    def _token_url(self) -> str:
        return f"https://login.microsoftonline.com/{get_settings().ms_tenant}/oauth2/v2.0/token"

    def build_authorize_url(self, state: str) -> str:
        s = get_settings()
        params = {
            "client_id": s.ms_client_id,
            "redirect_uri": s.ms_redirect_uri,
            "response_type": "code",
            "scope": " ".join(MS_SCOPES),
            "state": state,
        }
        return (
            f"https://login.microsoftonline.com/{s.ms_tenant}/oauth2/v2.0/authorize?"
            + urlencode(params)
        )

    async def exchange_code(self, code: str) -> TokenBundle:
        s = get_settings()
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                self._token_url(),
                data={
                    "code": code,
                    "client_id": s.ms_client_id,
                    "client_secret": s.ms_client_secret,
                    "redirect_uri": s.ms_redirect_uri,
                    "grant_type": "authorization_code",
                    "scope": " ".join(MS_SCOPES),
                },
            )
            resp.raise_for_status()
            tok = resp.json()
        expiry = datetime.now(timezone.utc) + _timedelta(tok.get("expires_in", 3600))
        return TokenBundle(tok["access_token"], tok.get("refresh_token"), expiry, None)

    async def _valid_access_token(self, conn: CalendarConnection) -> str:
        expiry = conn.token_expiry
        if expiry and expiry > datetime.now(timezone.utc):
            return token_crypto.decrypt(conn.access_token)  # type: ignore[return-value]
        s = get_settings()
        refresh = token_crypto.decrypt(conn.refresh_token)
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                self._token_url(),
                data={
                    "refresh_token": refresh,
                    "client_id": s.ms_client_id,
                    "client_secret": s.ms_client_secret,
                    "grant_type": "refresh_token",
                    "scope": " ".join(MS_SCOPES),
                },
            )
            resp.raise_for_status()
            tok = resp.json()
        conn.access_token = token_crypto.encrypt(tok["access_token"])
        if tok.get("refresh_token"):
            conn.refresh_token = token_crypto.encrypt(tok["refresh_token"])
        conn.token_expiry = datetime.now(timezone.utc) + _timedelta(tok.get("expires_in", 3600))
        return tok["access_token"]

    async def free_busy(self, conn, start, end):
        token = await self._valid_access_token(conn)
        body = {
            "schedules": [conn.account_email or "me"],
            "startTime": {"dateTime": _iso(start), "timeZone": "UTC"},
            "endTime": {"dateTime": _iso(end), "timeZone": "UTC"},
            "availabilityViewInterval": 15,
        }
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                "https://graph.microsoft.com/v1.0/me/calendar/getSchedule",
                headers={"Authorization": f"Bearer {token}"},
                json=body,
            )
            resp.raise_for_status()
            return _parse_ms_schedule(resp.json())

    async def create_event(self, conn, booking, host_name, title):
        token = await self._valid_access_token(conn)
        body = {
            "subject": f"{title} with {booking.invitee_name}",
            "body": {"contentType": "text", "content": booking.notes or ""},
            "start": {"dateTime": _iso(booking.start_utc), "timeZone": "UTC"},
            "end": {"dateTime": _iso(booking.end_utc), "timeZone": "UTC"},
            "attendees": [
                {"emailAddress": {"address": booking.invitee_email, "name": booking.invitee_name}, "type": "required"}
            ],
        }
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                "https://graph.microsoft.com/v1.0/me/events",
                headers={"Authorization": f"Bearer {token}"},
                json=body,
            )
            resp.raise_for_status()
            return resp.json().get("id")

    async def delete_event(self, conn, external_id):
        token = await self._valid_access_token(conn)
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.delete(
                f"https://graph.microsoft.com/v1.0/me/events/{external_id}",
                headers={"Authorization": f"Bearer {token}"},
            )
            if resp.status_code not in (200, 204, 404):
                resp.raise_for_status()


def _timedelta(seconds: int):
    from datetime import timedelta

    return timedelta(seconds=int(seconds))


_PROVIDERS: dict[str, CalendarProvider] = {
    "google": GoogleCalendarProvider(),
    "microsoft": MicrosoftGraphProvider(),
}


def get_provider(name: str) -> CalendarProvider:
    provider = _PROVIDERS.get(name)
    if provider is None:
        raise ValueError(f"Unknown calendar provider: {name}")
    return provider


async def merged_busy(
    connections: list[CalendarConnection], start: datetime, end: datetime
) -> list[BusyBlock]:
    """Aggregate busy blocks across all of a host's synced calendars."""
    busy: list[BusyBlock] = []
    for conn in connections:
        if not conn.sync_enabled:
            continue
        try:
            busy.extend(await get_provider(conn.provider).free_busy(conn, start, end))
        except Exception as exc:  # pragma: no cover - defensive
            logger.warning("free_busy failed for %s: %s", conn.provider, exc)
    return busy
