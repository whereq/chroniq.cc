"""Plan entitlements — maps Keycloak tier roles to feature limits.

⚠️ The numeric limits below are PLACEHOLDERS. Adjust them once the pricing matrix
is finalized — this is the single source of truth for enforcement, so changing a
number here changes the whole app's behaviour. `None` means unlimited.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class Entitlements:
    tier: str
    max_event_types: int | None
    max_calendar_connections: int | None
    remove_branding: bool


# Ordered from most to least privileged; first matching role wins.
_BY_ROLE: list[tuple[str, Entitlements]] = [
    ("ch-admin", Entitlements("admin", None, None, True)),
    ("ch-tier-unlimited", Entitlements("unlimited", None, None, True)),
    ("ch-tier-2", Entitlements("tier-2", None, None, True)),
    ("ch-tier-1", Entitlements("tier-1", None, 2, True)),
]

# No paid role = free tier.
FREE = Entitlements("free", max_event_types=1, max_calendar_connections=1, remove_branding=False)


def entitlements_for(roles: list[str] | set[str]) -> Entitlements:
    """Return the entitlements for the highest tier role the user holds."""
    role_set = set(roles or [])
    for role, ent in _BY_ROLE:
        if role in role_set:
            return ent
    return FREE
