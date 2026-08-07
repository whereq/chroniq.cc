"""Unit tests for plan entitlement resolution (pure, no DB)."""

from chroniq.entitlements import FREE, entitlements_for


def test_no_roles_is_free():
    ent = entitlements_for([])
    assert ent.tier == "free"
    assert ent.max_event_types == FREE.max_event_types


def test_launch_matrix_free_vs_pro():
    """Lock the launch numbers: Free is capped + branded; Pro is unlimited + unbranded."""
    free = entitlements_for([])
    assert (free.max_event_types, free.max_calendar_connections, free.remove_branding) == (1, 1, False)
    pro = entitlements_for(["ch-tier-1"])
    assert (pro.max_event_types, pro.max_calendar_connections, pro.remove_branding) == (None, None, True)


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
