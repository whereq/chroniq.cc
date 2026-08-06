"""Authenticated host profile routes."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.schemas.profile import ProfileOut, ProfileUpdate
from chroniq.auth import CurrentUser, CurrentUserId
from chroniq.database import get_db
from chroniq.models.user_profile import UserProfile

router = APIRouter(prefix="/me", tags=["profile"])

# Handles that would collide with frontend/app routes and must not be claimed.
RESERVED_USERNAMES = {
    "app", "api", "public", "bookings", "booking", "dashboard", "event-types",
    "availability", "team", "integrations", "settings", "pricing", "login",
    "logout", "signup", "admin", "about", "help", "docs", "resources", "www",
}


async def get_or_create_profile(db: AsyncSession, user: dict) -> UserProfile:
    """Fetch the caller's profile, creating a default one on first login."""
    uid = user["sub"]
    profile = await db.get(UserProfile, uid)
    if profile is None:
        # Seed a username from the token; ensure uniqueness with a suffix.
        base = (user.get("preferred_username") or f"user{uid[:8]}").lower()
        base = "".join(c for c in base if c.isalnum() or c == "-") or f"user{uid[:8]}"
        username = base
        n = 1
        while (await db.execute(select(UserProfile).where(UserProfile.username == username))).scalar_one_or_none():
            n += 1
            username = f"{base}-{n}"
        profile = UserProfile(
            keycloak_id=uid,
            username=username,
            display_name=user.get("name") or user.get("preferred_username") or "",
        )
        db.add(profile)
        await db.commit()
        await db.refresh(profile)
    return profile


@router.get("/profile", response_model=ProfileOut)
async def get_profile(user: CurrentUser, db: AsyncSession = Depends(get_db)) -> UserProfile:
    return await get_or_create_profile(db, user)


@router.put("/profile", response_model=ProfileOut)
async def update_profile(
    payload: ProfileUpdate,
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> UserProfile:
    profile = await get_or_create_profile(db, user)

    if payload.username and payload.username != profile.username:
        if payload.username in RESERVED_USERNAMES:
            raise HTTPException(status.HTTP_409_CONFLICT, "Username is reserved")
        clash = (
            await db.execute(select(UserProfile).where(UserProfile.username == payload.username))
        ).scalar_one_or_none()
        if clash is not None:
            raise HTTPException(status.HTTP_409_CONFLICT, "Username already taken")

    for field, value in payload.model_dump(exclude_unset=True).items():
        if field == "avatar_url":
            profile.avatar_url = value or None  # "" (remove) or None → clear
        elif value is not None:
            setattr(profile, field, value)

    await db.commit()
    await db.refresh(profile)
    return profile
