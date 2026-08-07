"""Plan entitlements — maps Keycloak tier roles to feature limits.

This is the single source of truth for enforcement. `None` means unlimited.

Launch matrix (Free + Pro; Team/Unlimited defined ahead of the team features):

    Feature                | Free | Pro (ch-tier-1) | Team (ch-tier-2) | Admin
    -----------------------|------|-----------------|------------------|------
    max_event_types        |  1   |   ∞ (None)      |    ∞ (None)      |  ∞
    max_calendar_conns     |  1   |   ∞ (None)      |    ∞ (None)      |  ∞
    remove_branding        | no   |   yes           |    yes           | yes

Enforcement points:
  - max_event_types      → api/routes/event_types.py (402 on exceed)
  - max_calendar_conns   → api/routes/integrations.py connect (402 on exceed)
  - remove_branding      → persisted on user_profiles (synced in me_profile) and
                           read by the public booking page to show/hide the
                           "Powered by chroniq.cc" badge.

NOTE: Team's real differentiator is *features* (round-robin / collective events,
shared team availability, admin roles), not numeric limits — those gate in code
once the team features exist. Reminders / video links are currently available to
all tiers; gate them here (add flags) if/when they should become Pro-only.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class Entitlements:
    tier: str
    max_event_types: int | None
    max_calendar_connections: int | None
    remove_branding: bool


# Free tier — the default when the user holds no paid role. Deliberately usable
# (unlimited bookings, real calendar free/busy) but capped to create a clear
# reason to upgrade, and it always shows the "Powered by chroniq.cc" badge
# (the growth loop).
FREE = Entitlements(
    tier="free",
    max_event_types=1,
    max_calendar_connections=1,
    remove_branding=False,
)

# Pro — the individual paid tier: everything a single power user needs.
PRO = Entitlements(
    tier="tier-1",
    max_event_types=None,
    max_calendar_connections=None,
    remove_branding=True,
)

# Team — reserved for when team features ship; numerically unlimited like Pro,
# differentiated by team-only features gated elsewhere.
TEAM = Entitlements(
    tier="tier-2",
    max_event_types=None,
    max_calendar_connections=None,
    remove_branding=True,
)

# Ordered from most to least privileged; first matching role wins.
_BY_ROLE: list[tuple[str, Entitlements]] = [
    ("ch-admin", Entitlements("admin", None, None, True)),
    ("ch-tier-unlimited", Entitlements("unlimited", None, None, True)),
    ("ch-tier-2", TEAM),
    ("ch-tier-1", PRO),
]


def entitlements_for(roles: list[str] | set[str]) -> Entitlements:
    """Return the entitlements for the highest tier role the user holds."""
    role_set = set(roles or [])
    for role, ent in _BY_ROLE:
        if role in role_set:
            return ent
    return FREE
