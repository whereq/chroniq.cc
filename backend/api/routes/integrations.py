"""Calendar integration routes — connect/list/disconnect Google & Microsoft.

The OAuth *code exchange* and token persistence land in Phase 3; this wires the
authorize-URL start, listing, and disconnect so the frontend flow exists now.
"""

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.services import calendar_providers, token_crypto
from chroniq.auth import CurrentUser, CurrentUserId
from chroniq.config import get_settings
from chroniq.database import get_db
from chroniq.entitlements import entitlements_for
from chroniq.models.calendar_connection import CalendarConnection

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/me/integrations", tags=["integrations"])

_SUPPORTED = {"google", "microsoft"}


class ConnectionOut(BaseModel):
    id: int
    provider: str
    account_email: str | None
    sync_enabled: bool


class AuthorizeUrl(BaseModel):
    authorize_url: str


@router.get("", response_model=list[ConnectionOut])
async def list_connections(uid: CurrentUserId, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(CalendarConnection).where(CalendarConnection.keycloak_id == uid)
    )
    return [
        ConnectionOut(
            id=c.id, provider=c.provider, account_email=c.account_email,
            sync_enabled=c.sync_enabled,
        )
        for c in result.scalars().all()
    ]


@router.post("/{provider}/connect", response_model=AuthorizeUrl)
async def connect(provider: str, user: CurrentUser, db: AsyncSession = Depends(get_db)):
    if provider not in _SUPPORTED:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Unknown provider")

    uid = user["sub"]
    existing = (
        await db.execute(
            select(CalendarConnection).where(CalendarConnection.keycloak_id == uid)
        )
    ).scalars().all()

    # Enforce the plan's calendar-connection limit — but always allow reconnecting
    # a provider the user already has (that just refreshes the existing row).
    already = any(c.provider == provider for c in existing)
    limit = entitlements_for((user.get("realm_access") or {}).get("roles", [])).max_calendar_connections
    if not already and limit is not None and len(existing) >= limit:
        raise HTTPException(
            status.HTTP_402_PAYMENT_REQUIRED,
            f"Your plan allows {limit} calendar connection(s). Upgrade to connect more.",
        )

    # `state` carries the user id so the callback can attribute the tokens.
    # In Phase 3 this should be a signed/one-time value, not the raw id.
    url = calendar_providers.get_provider(provider).build_authorize_url(state=str(uid))
    return AuthorizeUrl(authorize_url=url)


@router.get("/{provider}/callback")
async def oauth_callback(
    provider: str,
    code: str,
    state: str,
    db: AsyncSession = Depends(get_db),
):
    """OAuth redirect target. Unauthenticated (the browser redirect carries no
    Bearer token); the user is identified via `state`, which currently holds the
    Keycloak id set in /connect. TODO: replace with a signed one-time state.
    """
    if provider not in _SUPPORTED:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Unknown provider")

    uid = state
    try:
        tokens = await calendar_providers.get_provider(provider).exchange_code(code)
    except Exception as exc:
        logger.warning("OAuth code exchange failed for %s: %s", provider, exc)
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "OAuth exchange failed")

    existing = (
        await db.execute(
            select(CalendarConnection).where(
                CalendarConnection.keycloak_id == uid,
                CalendarConnection.provider == provider,
            )
        )
    ).scalar_one_or_none()

    if existing is None:
        existing = CalendarConnection(keycloak_id=uid, provider=provider)
        db.add(existing)

    existing.access_token = token_crypto.encrypt(tokens.access_token)
    existing.refresh_token = token_crypto.encrypt(tokens.refresh_token)
    existing.token_expiry = tokens.expiry
    existing.account_email = tokens.account_email
    existing.sync_enabled = True
    await db.commit()

    base = get_settings().public_base_url.rstrip("/")
    return RedirectResponse(url=f"{base}/dashboard?integration={provider}")


@router.delete("/{connection_id}", status_code=status.HTTP_204_NO_CONTENT)
async def disconnect(connection_id: int, uid: CurrentUserId, db: AsyncSession = Depends(get_db)):
    conn = await db.get(CalendarConnection, connection_id)
    if conn is None or str(conn.keycloak_id) != str(uid):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Connection not found")
    await db.delete(conn)
    await db.commit()
