"""Booking notifications — compose + send confirmation/cancel/reschedule emails.

Idempotency is enforced by the caller via the notification_log table; this
module just builds the content and calls the mailer.
"""

from __future__ import annotations

import logging

from chroniq.config import get_settings
from chroniq.models.booking import Booking
from api.services import mailer

logger = logging.getLogger(__name__)


def _fmt(dt, tz: str) -> str:
    from api.services.slot_engine import to_tz

    local = to_tz(dt, tz)
    return local.strftime("%A, %B %d, %Y at %I:%M %p %Z")


def _build_ics(booking: Booking, host_name: str, title: str) -> str:
    from ics import Calendar, Event

    cal = Calendar()
    ev = Event()
    ev.name = f"{title} with {host_name}"
    ev.begin = booking.start_utc
    ev.end = booking.end_utc
    if booking.meeting_url:
        ev.url = booking.meeting_url
        ev.location = booking.meeting_url
    ev.attendees = [booking.invitee_email]
    cal.events.add(ev)
    return cal.serialize()


def send_confirmation(booking: Booking, host_name: str, host_email: str, title: str) -> None:
    settings = get_settings()
    cancel_link = f"{settings.public_base_url}/bookings/{booking.cancel_token}"
    ics = _build_ics(booking, host_name, title)

    # Invitee
    mailer.send_email(
        to=booking.invitee_email,
        subject=f"Confirmed: {title} with {host_name}",
        body=(
            f"Hi {booking.invitee_name},\n\n"
            f"Your {title} with {host_name} is confirmed for\n"
            f"{_fmt(booking.start_utc, booking.invitee_timezone)}.\n\n"
            f"{('Join: ' + booking.meeting_url) if booking.meeting_url else ''}\n\n"
            f"Need to change it? {cancel_link}\n\n— chroniq.cc"
        ),
        ics=ics,
    )
    # Host
    if host_email:
        mailer.send_email(
            to=host_email,
            subject=f"New booking: {title} with {booking.invitee_name}",
            body=(
                f"{booking.invitee_name} ({booking.invitee_email}) booked {title} for\n"
                f"{_fmt(booking.start_utc, 'UTC')} (UTC).\n\n"
                f"{('Notes: ' + booking.notes) if booking.notes else ''}"
            ),
            ics=ics,
        )


def send_cancellation(booking: Booking, host_name: str, host_email: str, title: str) -> None:
    for to in filter(None, [booking.invitee_email, host_email]):
        mailer.send_email(
            to=to,
            subject=f"Cancelled: {title} with {host_name}",
            body=(
                f"The {title} scheduled for "
                f"{_fmt(booking.start_utc, booking.invitee_timezone)} has been cancelled."
            ),
        )


def send_reschedule(booking: Booking, host_name: str, host_email: str, title: str) -> None:
    settings = get_settings()
    cancel_link = f"{settings.public_base_url}/bookings/{booking.cancel_token}"
    ics = _build_ics(booking, host_name, title)
    mailer.send_email(
        to=booking.invitee_email,
        subject=f"Rescheduled: {title} with {host_name}",
        body=(
            f"Hi {booking.invitee_name},\n\n"
            f"Your {title} with {host_name} has been moved to\n"
            f"{_fmt(booking.start_utc, booking.invitee_timezone)}.\n\n"
            f"Manage it here: {cancel_link}\n\n— chroniq.cc"
        ),
        ics=ics,
    )
    if host_email:
        mailer.send_email(
            to=host_email,
            subject=f"Rescheduled: {title} with {booking.invitee_name}",
            body=f"{booking.invitee_name} moved {title} to {_fmt(booking.start_utc, 'UTC')} (UTC).",
        )


def send_reminder(booking: Booking, host_name: str, title: str, lead_label: str) -> None:
    """Reminder to the invitee ahead of the meeting (e.g. lead_label='24 hours')."""
    mailer.send_email(
        to=booking.invitee_email,
        subject=f"Reminder: {title} with {host_name} in {lead_label}",
        body=(
            f"Hi {booking.invitee_name},\n\n"
            f"This is a reminder that your {title} with {host_name} is in {lead_label}, at\n"
            f"{_fmt(booking.start_utc, booking.invitee_timezone)}.\n\n"
            f"{('Join: ' + booking.meeting_url) if booking.meeting_url else ''}\n\n— chroniq.cc"
        ),
    )
