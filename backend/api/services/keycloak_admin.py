"""Keycloak Admin REST client — assigns tier roles after payment.

Uses the confidential `chroniq-backend` service account (client credentials
grant) with the `manage-users` realm role. Ported from the flowdesk pattern.
"""

from __future__ import annotations

import logging

import httpx

from chroniq.config import get_settings

logger = logging.getLogger(__name__)


async def _admin_token() -> str:
    s = get_settings()
    url = f"{s.keycloak_url}/realms/{s.keycloak_realm}/protocol/openid-connect/token"
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.post(
            url,
            data={
                "grant_type": "client_credentials",
                "client_id": s.keycloak_admin_client_id,
                "client_secret": s.keycloak_admin_client_secret,
            },
        )
        resp.raise_for_status()
        return resp.json()["access_token"]


async def assign_realm_role(user_id: str, role_name: str) -> None:
    """Assign a realm role (e.g. ch-tier-1) to a user by Keycloak id."""
    s = get_settings()
    token = await _admin_token()
    base = f"{s.keycloak_url}/admin/realms/{s.keycloak_realm}"
    headers = {"Authorization": f"Bearer {token}"}

    async with httpx.AsyncClient(timeout=10.0, headers=headers) as client:
        role_resp = await client.get(f"{base}/roles/{role_name}")
        role_resp.raise_for_status()
        role = role_resp.json()

        assign = await client.post(
            f"{base}/users/{user_id}/role-mappings/realm",
            json=[{"id": role["id"], "name": role["name"]}],
        )
        assign.raise_for_status()
    logger.info("Assigned role %s to user %s", role_name, user_id)


async def remove_realm_role(user_id: str, role_name: str) -> None:
    """Remove a realm role (e.g. ch-tier-1) from a user by Keycloak id.

    Called when a subscription is canceled so the user is downgraded to Free.
    """
    s = get_settings()
    token = await _admin_token()
    base = f"{s.keycloak_url}/admin/realms/{s.keycloak_realm}"
    headers = {"Authorization": f"Bearer {token}"}

    async with httpx.AsyncClient(timeout=10.0, headers=headers) as client:
        role_resp = await client.get(f"{base}/roles/{role_name}")
        role_resp.raise_for_status()
        role = role_resp.json()

        # Keycloak deletes realm role mappings via DELETE with the role list body.
        remove = await client.request(
            "DELETE",
            f"{base}/users/{user_id}/role-mappings/realm",
            json=[{"id": role["id"], "name": role["name"]}],
        )
        remove.raise_for_status()
    logger.info("Removed role %s from user %s", role_name, user_id)
