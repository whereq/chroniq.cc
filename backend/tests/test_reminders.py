"""Unit tests for reminder due-logic (pure, no DB)."""

from datetime import datetime, timedelta, timezone

from api.services.reminders import due_reminder_types

NOW = datetime(2026, 8, 1, 12, 0, tzinfo=timezone.utc)


def test_no_reminders_far_out():
    start = NOW + timedelta(days=3)
    assert due_reminder_types(start, NOW, set()) == []


def test_24h_reminder_due_inside_window():
    start = NOW + timedelta(hours=20)  # inside 24h window, outside 1h
    assert due_reminder_types(start, NOW, set()) == ["reminder_24h"]


def test_both_due_when_close():
    start = NOW + timedelta(minutes=30)  # inside both windows
    due = due_reminder_types(start, NOW, set())
    assert "reminder_24h" in due and "reminder_1h" in due


def test_already_sent_excluded():
    start = NOW + timedelta(minutes=30)
    assert due_reminder_types(start, NOW, {"reminder_24h", "reminder_1h"}) == []


def test_not_due_after_start():
    start = NOW - timedelta(minutes=5)  # already started
    assert due_reminder_types(start, NOW, set()) == []
