"""Authenticated availability schedule CRUD (with nested rules + overrides)."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from api.schemas.availability import ScheduleCreate, ScheduleOut, ScheduleUpdate
from chroniq.auth import CurrentUserId
from chroniq.database import get_db
from chroniq.models.availability import (
    AvailabilityOverride,
    AvailabilityRule,
    AvailabilitySchedule,
)

router = APIRouter(prefix="/me/availability", tags=["availability"])


async def _load(db: AsyncSession, uid, schedule_id: int) -> AvailabilitySchedule:
    result = await db.execute(
        select(AvailabilitySchedule)
        .where(AvailabilitySchedule.id == schedule_id)
        .options(
            selectinload(AvailabilitySchedule.rules),
            selectinload(AvailabilitySchedule.overrides),
        )
    )
    sched = result.scalar_one_or_none()
    if sched is None or str(sched.keycloak_id) != str(uid):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Schedule not found")
    return sched


@router.get("", response_model=list[ScheduleOut])
async def list_schedules(uid: CurrentUserId, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(AvailabilitySchedule)
        .where(AvailabilitySchedule.keycloak_id == uid)
        .options(
            selectinload(AvailabilitySchedule.rules),
            selectinload(AvailabilitySchedule.overrides),
        )
        .order_by(AvailabilitySchedule.id)
    )
    return list(result.scalars().all())


@router.post("", response_model=ScheduleOut, status_code=status.HTTP_201_CREATED)
async def create_schedule(
    payload: ScheduleCreate, uid: CurrentUserId, db: AsyncSession = Depends(get_db)
):
    sched = AvailabilitySchedule(
        keycloak_id=uid,
        name=payload.name,
        timezone=payload.timezone,
        is_default=payload.is_default,
    )
    sched.rules = [AvailabilityRule(**r.model_dump()) for r in payload.rules]
    sched.overrides = [AvailabilityOverride(**o.model_dump()) for o in payload.overrides]
    db.add(sched)
    await db.commit()
    return await _load(db, uid, sched.id)


@router.put("/{schedule_id}", response_model=ScheduleOut)
async def update_schedule(
    schedule_id: int,
    payload: ScheduleUpdate,
    uid: CurrentUserId,
    db: AsyncSession = Depends(get_db),
):
    sched = await _load(db, uid, schedule_id)
    if payload.name is not None:
        sched.name = payload.name
    if payload.timezone is not None:
        sched.timezone = payload.timezone
    if payload.is_default is not None:
        sched.is_default = payload.is_default
    # Replace-in-full semantics for nested collections when provided.
    if payload.rules is not None:
        sched.rules = [AvailabilityRule(**r.model_dump()) for r in payload.rules]
    if payload.overrides is not None:
        sched.overrides = [AvailabilityOverride(**o.model_dump()) for o in payload.overrides]
    await db.commit()
    return await _load(db, uid, schedule_id)


@router.delete("/{schedule_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_schedule(schedule_id: int, uid: CurrentUserId, db: AsyncSession = Depends(get_db)):
    sched = await _load(db, uid, schedule_id)
    await db.delete(sched)
    await db.commit()
