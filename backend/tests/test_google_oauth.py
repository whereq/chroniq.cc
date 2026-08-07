"""Google OAuth helpers: least-privilege scopes + id_token email extraction."""

import base64
import json

from api.services.calendar_providers import GOOGLE_SCOPES, _email_from_id_token


def _make_id_token(payload: dict) -> str:
    def seg(d: dict) -> str:
        return base64.urlsafe_b64encode(json.dumps(d).encode()).rstrip(b"=").decode()
    return f"{seg({'alg': 'RS256'})}.{seg(payload)}.signature"


def test_scopes_are_least_privilege():
    # Never request the broad "see/edit/delete all calendars" scope.
    assert "https://www.googleapis.com/auth/calendar" not in GOOGLE_SCOPES
    # Free/busy (non-sensitive) + identity are what we need.
    assert "https://www.googleapis.com/auth/calendar.freebusy" in GOOGLE_SCOPES
    assert "openid" in GOOGLE_SCOPES
    assert "email" in GOOGLE_SCOPES


def test_email_from_id_token_extracts_email():
    tok = _make_id_token({"email": "user@example.com", "sub": "123"})
    assert _email_from_id_token(tok) == "user@example.com"


def test_email_from_id_token_handles_bad_input():
    assert _email_from_id_token(None) is None
    assert _email_from_id_token("not-a-jwt") is None
    # Valid JWT shape but no email claim.
    assert _email_from_id_token(_make_id_token({"sub": "123"})) is None
