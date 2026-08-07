"""ProfileOut must coerce the UUID keycloak_id to a string (regression for the
/me/profile 500 caused by Pydantic rejecting a UUID for a str field)."""

from datetime import datetime, timezone
from uuid import UUID

from api.schemas.profile import ProfileOut

_UID = UUID("ec968bb1-844a-48a5-a7c0-5d6abbb38408")
_NOW = datetime.now(timezone.utc)


class _Row:
    keycloak_id = _UID
    username = "alex"
    display_name = "Alex"
    timezone = "UTC"  # note: this shadows the imported `timezone` inside the class
    avatar_url = None
    brand_color = "#6366f1"
    bio = None
    created_at = _NOW
    updated_at = _NOW


def test_profile_out_coerces_uuid_to_str():
    out = ProfileOut.model_validate(_Row())
    assert isinstance(out.keycloak_id, str)
    assert out.keycloak_id == str(_UID)


def test_profile_out_json_roundtrip():
    out = ProfileOut.model_validate(_Row())
    # Must serialize without error (this is what the endpoint does).
    assert str(_UID) in out.model_dump_json()
