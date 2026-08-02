"""Authenticated event-type CRUD."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from api.schemas.event_type import EventTypeCreate, EventTypeOut, EventTypeUpdate
from chroniq.auth import CurrentUser, CurrentUserId
from chroniq.auth import get_current_user_id
from chroniq.database import get_db
from chroniq.entitlements import entitlements_for
from chroniq.models.event_type import EventType

router = APIRouter(prefix="/me/event-types", tags=["event-types"])


def _roles(user: dict) -> list[str]:
    return (user.get("realm_access") or {}).get("roles", [])


async def _get_owned(db: AsyncSession, uid, event_id: int) -> EventType:
    et = await db.get(EventType, event_id)
    if et is None or str(et.keycloak_id) != str(uid):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Event type not found")
    return et


@router.get("", response_model=list[EventTypeOut])
async def list_event_types(uid: CurrentUserId, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(EventType).where(EventType.keycloak_id == uid).order_by(EventType.id)
    )
    return list(result.scalars().all())


@router.post("", response_model=EventTypeOut, status_code=status.HTTP_201_CREATED)
async def create_event_type(
    payload: EventTypeCreate, user: CurrentUser, db: AsyncSession = Depends(get_db)
):
    uid = await get_current_user_id(user)
    limit = entitlements_for(_roles(user)).max_event_types
    if limit is not None:
        count = (
            await db.execute(
                select(func.count()).select_from(EventType).where(EventType.keycloak_id == uid)
            )
        ).scalar_one()
        if count >= limit:
            raise HTTPException(
                status.HTTP_402_PAYMENT_REQUIRED,
                f"Your plan allows {limit} event type(s). Upgrade to add more.",
            )
    et = EventType(keycloak_id=uid, **payload.model_dump())
    db.add(et)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "Slug already in use")
    await db.refresh(et)
    return et


@router.get("/{event_id}", response_model=EventTypeOut)
async def get_event_type(event_id: int, uid: CurrentUserId, db: AsyncSession = Depends(get_db)):
    return await _get_owned(db, uid, event_id)


@router.put("/{event_id}", response_model=EventTypeOut)
async def update_event_type(
    event_id: int,
    payload: EventTypeUpdate,
    uid: CurrentUserId,
    db: AsyncSession = Depends(get_db),
):
    et = await _get_owned(db, uid, event_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(et, field, value)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "Slug already in use")
    await db.refresh(et)
    return et


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_event_type(event_id: int, uid: CurrentUserId, db: AsyncSession = Depends(get_db)):
    et = await _get_owned(db, uid, event_id)
    await db.delete(et)
    await db.commit()
