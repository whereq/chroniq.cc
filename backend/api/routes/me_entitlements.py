"""Expose the caller's plan entitlements + current usage to the frontend."""

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from chroniq.auth import CurrentUser, get_current_user_id
from chroniq.database import get_db
from chroniq.entitlements import entitlements_for
from chroniq.models.calendar_connection import CalendarConnection
from chroniq.models.event_type import EventType

router = APIRouter(prefix="/me/entitlements", tags=["entitlements"])


class EntitlementsOut(BaseModel):
    tier: str
    max_event_types: int | None
    max_calendar_connections: int | None
    remove_branding: bool
    event_types_used: int
    calendar_connections_used: int


@router.get("", response_model=EntitlementsOut)
async def get_entitlements(user: CurrentUser, db: AsyncSession = Depends(get_db)):
    uid = await get_current_user_id(user)
    roles = (user.get("realm_access") or {}).get("roles", [])
    ent = entitlements_for(roles)

    et_count = (
        await db.execute(
            select(func.count()).select_from(EventType).where(EventType.keycloak_id == uid)
        )
    ).scalar_one()
    conn_count = (
        await db.execute(
            select(func.count())
            .select_from(CalendarConnection)
            .where(CalendarConnection.keycloak_id == uid)
        )
    ).scalar_one()

    return EntitlementsOut(
        tier=ent.tier,
        max_event_types=ent.max_event_types,
        max_calendar_connections=ent.max_calendar_connections,
        remove_branding=ent.remove_branding,
        event_types_used=et_count,
        calendar_connections_used=conn_count,
    )
