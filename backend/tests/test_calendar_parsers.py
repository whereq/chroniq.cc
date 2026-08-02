"""Unit tests for calendar provider response parsers (pure, no network)."""

from datetime import datetime, timezone

from api.services.calendar_providers import _parse_google_freebusy, _parse_ms_schedule


def test_parse_google_freebusy():
    payload = {
        "calendars": {
            "primary": {
                "busy": [
                    {"start": "2026-08-01T09:00:00Z", "end": "2026-08-01T09:30:00Z"},
                    {"start": "2026-08-01T14:00:00Z", "end": "2026-08-01T15:00:00Z"},
                ]
            }
        }
    }
    blocks = _parse_google_freebusy(payload, "primary")
    assert len(blocks) == 2
    assert blocks[0].start == datetime(2026, 8, 1, 9, 0, tzinfo=timezone.utc)
    assert blocks[0].end == datetime(2026, 8, 1, 9, 30, tzinfo=timezone.utc)


def test_parse_google_freebusy_empty():
    assert _parse_google_freebusy({"calendars": {}}, "primary") == []


def test_parse_ms_schedule():
    payload = {
        "value": [
            {
                "scheduleItems": [
                    {
                        "start": {"dateTime": "2026-08-01T10:00:00", "timeZone": "UTC"},
                        "end": {"dateTime": "2026-08-01T10:45:00", "timeZone": "UTC"},
                    }
                ]
            }
        ]
    }
    blocks = _parse_ms_schedule(payload)
    assert len(blocks) == 1
    assert blocks[0].start == datetime(2026, 8, 1, 10, 0, tzinfo=timezone.utc)
    assert blocks[0].end == datetime(2026, 8, 1, 10, 45, tzinfo=timezone.utc)


def test_parse_ms_schedule_empty():
    assert _parse_ms_schedule({"value": []}) == []
