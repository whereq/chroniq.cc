"""Slot generation — the core scheduling logic.

Given an event type, a host's availability schedule, existing bookings, and any
external busy blocks, compute the list of bookable start times for a date range,
rendered in the invitee's timezone.

    available = (weekly availability ∩ event-duration grid)
                − existing confirmed bookings (with buffers)
                − external busy blocks
                − slots inside the min-notice window
                − slots beyond the booking window
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, time, timedelta, timezone
from zoneinfo import ZoneInfo

from chroniq.models.availability import (
    AvailabilityOverride,
    AvailabilityRule,
    AvailabilitySchedule,
)
from chroniq.models.event_type import EventType


@dataclass(frozen=True)
class BusyBlock:
    """A [start, end) interval (UTC) during which the host is unavailable."""

    start: datetime
    end: datetime


@dataclass(frozen=True)
class Slot:
    start: datetime  # UTC
    end: datetime    # UTC


def _as_utc(dt: datetime) -> datetime:
    """Normalise any datetime to timezone-aware UTC."""
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def _overlaps(a_start: datetime, a_end: datetime, b: BusyBlock) -> bool:
    return a_start < b.end and b.start < a_end


def _windows_for_date(
    schedule: AvailabilitySchedule,
    rules: list[AvailabilityRule],
    overrides: list[AvailabilityOverride],
    d: date,
    tz: ZoneInfo,
) -> list[tuple[datetime, datetime]]:
    """Return concrete [start, end) datetime windows (UTC) available on date `d`."""
    # Date-specific override takes precedence over weekly rules.
    day_overrides = [o for o in overrides if o.date == d]
    if day_overrides:
        ov = day_overrides[0]
        if ov.is_unavailable or ov.start_time is None or ov.end_time is None:
            return []
        return [_window(d, ov.start_time, ov.end_time, tz)]

    # Python date.weekday(): Mon=0..Sun=6. Our model uses Sun=0..Sat=6.
    dow = (d.weekday() + 1) % 7
    windows: list[tuple[datetime, datetime]] = []
    for r in rules:
        if r.is_enabled and r.day_of_week == dow and r.start_time < r.end_time:
            windows.append(_window(d, r.start_time, r.end_time, tz))
    return windows


def _window(d: date, start: time, end: time, tz: ZoneInfo) -> tuple[datetime, datetime]:
    start_local = datetime.combine(d, start, tzinfo=tz)
    end_local = datetime.combine(d, end, tzinfo=tz)
    return _as_utc(start_local), _as_utc(end_local)


def generate_slots(
    *,
    event_type: EventType,
    schedule: AvailabilitySchedule,
    rules: list[AvailabilityRule],
    overrides: list[AvailabilityOverride],
    busy: list[BusyBlock],
    day: date,
    invitee_tz: str,
    now: datetime | None = None,
    step_minutes: int = 15,
) -> list[Slot]:
    """Compute bookable slots for a single calendar day (in the invitee's tz)."""
    now = _as_utc(now or datetime.now(timezone.utc))
    host_tz = ZoneInfo(schedule.timezone or "UTC")

    duration = timedelta(minutes=event_type.duration_minutes)
    buf_before = timedelta(minutes=event_type.buffer_before)
    buf_after = timedelta(minutes=event_type.buffer_after)
    min_notice = now + timedelta(minutes=event_type.min_notice_minutes)
    window_end = now + timedelta(days=event_type.booking_window_days)
    step = timedelta(minutes=step_minutes)

    # A slot on the invitee's `day` can span host-timezone windows on the same
    # date; we evaluate host availability for that date. (Cross-midnight edge
    # cases are intentionally left to a later refinement.)
    windows = _windows_for_date(schedule, rules, overrides, day, host_tz)

    slots: list[Slot] = []
    for win_start, win_end in windows:
        cursor = win_start
        while cursor + duration <= win_end:
            s_start = cursor
            s_end = cursor + duration
            cursor += step

            if s_start < min_notice or s_start > window_end:
                continue

            # Buffer-expanded interval must not hit any busy block.
            guarded = BusyBlock(s_start - buf_before, s_end + buf_after)
            if any(_overlaps(guarded.start, guarded.end, b) for b in busy):
                continue

            slots.append(Slot(start=s_start, end=s_end))

    slots.sort(key=lambda s: s.start)
    return slots


def to_tz(dt: datetime, tz_name: str) -> datetime:
    """Render a UTC datetime in the given timezone (for API responses)."""
    return _as_utc(dt).astimezone(ZoneInfo(tz_name or "UTC"))
