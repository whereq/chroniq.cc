"""Unit tests for the slot engine (pure logic, no DB)."""

from datetime import date, datetime, time, timedelta, timezone

from api.services.slot_engine import BusyBlock, generate_slots
from chroniq.models.availability import (
    AvailabilityOverride,
    AvailabilityRule,
    AvailabilitySchedule,
)
from chroniq.models.event_type import EventType


def _schedule(tz="UTC"):
    return AvailabilitySchedule(id=1, keycloak_id="0" * 32, name="wk", timezone=tz, is_default=True)


def _event(duration=30, buffer_before=0, buffer_after=0, min_notice=0):
    return EventType(
        id=1, keycloak_id="0" * 32, slug="s", title="t", description="",
        duration_minutes=duration, location="video", color="#000",
        buffer_before=buffer_before, buffer_after=buffer_after,
        min_notice_minutes=min_notice, booking_window_days=60, is_active=True,
    )


# A near-future day (within booking_window_days) but not today, so neither the
# min-notice window nor the booking window trims the fixture.
DAY = (datetime.now(timezone.utc) + timedelta(days=10)).date()
# Model weekday index: Sun=0..Sat=6 (Python weekday() is Mon=0..Sun=6).
DAY_DOW = (DAY.weekday() + 1) % 7


def _rule(dow=DAY_DOW, start=(9, 0), end=(11, 0)):
    return AvailabilityRule(
        id=1, schedule_id=1, day_of_week=dow,
        start_time=time(*start), end_time=time(*end), is_enabled=True,
    )


def test_generates_back_to_back_slots():
    slots = generate_slots(
        event_type=_event(duration=30),
        schedule=_schedule(),
        rules=[_rule()],
        overrides=[],
        busy=[],
        day=DAY,
        invitee_tz="UTC",
    )
    # 09:00–11:00 window, 30-min slots, 15-min step → starts 9:00..10:30
    starts = [s.start.strftime("%H:%M") for s in slots]
    assert starts[0] == "09:00"
    assert "10:30" in starts
    assert "10:45" not in starts  # 10:45+30 = 11:15 > 11:00


def test_busy_block_removes_overlapping_slots():
    busy = [BusyBlock(
        datetime.combine(DAY, time(9, 30), tzinfo=timezone.utc),
        datetime.combine(DAY, time(10, 0), tzinfo=timezone.utc),
    )]
    slots = generate_slots(
        event_type=_event(duration=30),
        schedule=_schedule(),
        rules=[_rule()],
        overrides=[],
        busy=busy,
        day=DAY,
        invitee_tz="UTC",
    )
    starts = {s.start.strftime("%H:%M") for s in slots}
    assert "09:00" in starts       # ends 9:30, no overlap (half-open)
    assert "09:15" not in starts   # overlaps 9:30 busy start
    assert "09:30" not in starts   # inside busy
    assert "10:00" in starts       # busy ended


def test_override_makes_day_unavailable():
    slots = generate_slots(
        event_type=_event(),
        schedule=_schedule(),
        rules=[_rule()],
        overrides=[AvailabilityOverride(id=1, schedule_id=1, date=DAY, is_unavailable=True)],
        busy=[],
        day=DAY,
        invitee_tz="UTC",
    )
    assert slots == []


def test_buffers_expand_conflict_window():
    busy = [BusyBlock(
        datetime.combine(DAY, time(10, 0), tzinfo=timezone.utc),
        datetime.combine(DAY, time(10, 30), tzinfo=timezone.utc),
    )]
    slots = generate_slots(
        event_type=_event(duration=30, buffer_after=15),
        schedule=_schedule(),
        rules=[_rule()],
        overrides=[],
        busy=busy,
        day=DAY,
        invitee_tz="UTC",
    )
    starts = {s.start.strftime("%H:%M") for s in slots}
    # 9:30 slot ends 10:00, +15 buffer → 10:15, overlaps busy at 10:00 → excluded
    assert "09:30" not in starts
    assert "09:00" in starts
