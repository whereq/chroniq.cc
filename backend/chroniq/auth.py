"""JWT authentication via Keycloak.

FastAPI dependency hierarchy:
  get_current_user  →  verifies Bearer token, returns decoded claims dict
  CurrentUser       →  Annotated type alias — use in route signatures
  current_user_id   →  convenience: returns the Keycloak `sub` as a UUID

Usage in a route:
    @router.get("/example")
    async def example(user: CurrentUser):
        return {"user": user["preferred_username"]}

Public routes (no auth): GET /api/v1/health, and everything under /public/*.
"""

import logging
import time
from typing import Annotated
from uuid import UUID

import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import ExpiredSignatureError, JWTError, jwt

from chroniq.config import get_settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# JWKS cache — refreshed at most once per hour
# ---------------------------------------------------------------------------
_jwks_cache: dict | None = None
_jwks_fetched_at: float = 0.0
_JWKS_TTL = 3600.0  # seconds


async def _get_jwks() -> dict:
    """Return cached Keycloak public keys, refreshing when stale."""
    global _jwks_cache, _jwks_fetched_at

    now = time.monotonic()
    if _jwks_cache and (now - _jwks_fetched_at) < _JWKS_TTL:
        return _jwks_cache

    settings = get_settings()
    url = (
        f"{settings.keycloak_url}/realms/{settings.keycloak_realm}"
        "/protocol/openid-connect/certs"
    )

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            _jwks_cache = resp.json()
            _jwks_fetched_at = now
            logger.info("Keycloak JWKS refreshed from %s", url)
    except Exception as exc:
        if _jwks_cache:
            logger.warning("JWKS refresh failed (using cached keys): %s", exc)
        else:
            logger.error("JWKS fetch failed and no cache available: %s", exc)
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Authentication service temporarily unavailable",
            )

    return _jwks_cache  # type: ignore[return-value]


_bearer = HTTPBearer(auto_error=True)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
) -> dict:
    """Verify the Bearer JWT and return its decoded claims.

    Raises 401 for missing/invalid/expired tokens.
    Raises 503 if Keycloak is unreachable and no cached keys exist.
    """
    settings = get_settings()
    token = credentials.credentials
    expected_issuer = f"{settings.keycloak_url}/realms/{settings.keycloak_realm}"

    try:
        jwks = await _get_jwks()
        payload: dict = jwt.decode(
            token,
            jwks,
            algorithms=["RS256"],
            issuer=expected_issuer,
            options={
                # Keycloak public-client tokens don't reliably carry the client
                # id in `aud`; we validate `azp` below instead.
                "verify_aud": False,
                "verify_exp": True,
                "verify_iss": True,
            },
        )
    except ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except JWTError as exc:
        logger.debug("JWT verification failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    azp = payload.get("azp")
    if azp != settings.keycloak_client_id:
        logger.warning(
            "JWT azp mismatch: expected %r, got %r", settings.keycloak_client_id, azp
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload["_raw_token"] = token
    return payload


CurrentUser = Annotated[dict, Depends(get_current_user)]


async def get_current_user_id(user: CurrentUser) -> UUID:
    """Return the authenticated user's Keycloak `sub` as a UUID."""
    sub = user.get("sub")
    if not sub:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    return UUID(sub)


CurrentUserId = Annotated[UUID, Depends(get_current_user_id)]


def has_role(user: dict, role: str) -> bool:
    """Check whether a decoded token carries a given realm role."""
    realm_access = user.get("realm_access") or {}
    return role in (realm_access.get("roles") or [])
