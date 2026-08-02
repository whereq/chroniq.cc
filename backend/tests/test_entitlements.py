"""Unit tests for plan entitlement resolution (pure, no DB)."""

from chroniq.entitlements import FREE, entitlements_for


def test_no_roles_is_free():
    ent = entitlements_for([])
    assert ent.tier == "free"
    assert ent.max_event_types == FREE.max_event_types


def test_tier_1():
    ent = entitlements_for(["ch-tier-1"])
    assert ent.tier == "tier-1"
    assert ent.max_event_types is None  # unlimited
    assert ent.remove_branding is True


def test_highest_role_wins():
    ent = entitlements_for(["ch-tier-1", "ch-tier-2"])
    assert ent.tier == "tier-2"


def test_admin_beats_all():
    ent = entitlements_for(["ch-tier-1", "ch-admin", "ch-tier-2"])
    assert ent.tier == "admin"
    assert ent.max_calendar_connections is None


def test_unknown_roles_ignored():
    assert entitlements_for(["offline_access", "uma_authorization"]).tier == "free"
