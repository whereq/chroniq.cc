"""Reminder scanning — decide which reminder emails are due and send them.

The decision logic (`due_reminder_types`) is a pure function, unit tested without
a DB. `run_reminder_scan` does the DB I/O and is driven by the scheduler process
(``python -m scheduler.main``).
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.services import notifications
from chroniq.models.booking import Booking
from chroniq.models.event_type import EventType
from chroniq.models.notification_log import NotificationLog
from chroniq.models.user_profile import UserProfile

logger = logging.getLogger(__name__)

# reminder type -> (lead time before start, human label)
REMINDER_OFFSETS: dict[str, tuple[timedelta, str]] = {
    "reminder_24h": (timedelta(hours=24), "24 hours"),
    "reminder_1h": (timedelta(hours=1), "1 hour"),
}
MAX_LEAD = max(off for off, _ in REMINDER_OFFSETS.values())


def due_reminder_types(
    start_utc: datetime, now: datetime, already_sent: set[str]
) -> list[str]:
    """Reminder types that should be sent for a booking, given what's already sent.

    A reminder is due once we're inside its lead window (now >= start - offset)
    and the meeting hasn't started yet, and it hasn't already been sent.
    """
    due: list[str] = []
    for rtype, (offset, _label) in REMINDER_OFFSETS.items():
        if rtype in already_sent:
            continue
        if start_utc - offset <= now < start_utc:
            due.append(rtype)
    return due


async def run_reminder_scan(db: AsyncSession, now: datetime | None = None) -> int:
    """Send any due reminders. Returns the number of emails sent."""
    now = now or datetime.now(timezone.utc)
    horizon = now + MAX_LEAD

    rows = (
        await db.execute(
            select(Booking, EventType, UserProfile)
            .join(EventType, EventType.id == Booking.event_type_id)
            .join(UserProfile, UserProfile.keycloak_id == Booking.host_keycloak_id)
            .where(
                Booking.status == "confirmed",
                Booking.start_utc > now,
                Booking.start_utc <= horizon,
            )
        )
    ).all()

    sent = 0
    for booking, event_type, profile in rows:
        already = {
            r[0]
            for r in (
                await db.execute(
                    select(NotificationLog.type).where(NotificationLog.booking_id == booking.id)
                )
            ).all()
        }
        for rtype in due_reminder_types(booking.start_utc, now, already):
            _, label = REMINDER_OFFSETS[rtype]
            host_name = profile.display_name or profile.username
            try:
                notifications.send_reminder(booking, host_name, event_type.title, label)
                db.add(NotificationLog(booking_id=booking.id, type=rtype))
                await db.commit()
                sent += 1
            except Exception as exc:  # pragma: no cover - defensive
                await db.rollback()
                logger.warning("reminder %s failed for booking %s: %s", rtype, booking.id, exc)

    if sent:
        logger.info("Reminder scan sent %d email(s)", sent)
    return sent
