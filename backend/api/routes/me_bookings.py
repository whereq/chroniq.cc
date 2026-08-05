"""Authenticated host bookings — list, cancel, reschedule."""

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from api.schemas.booking import BookingOut, BookingStatusFilter, RescheduleRequest
from api.services import notifications
from api.services.slot_engine import BusyBlock, generate_slots
from chroniq.auth import CurrentUserId
from chroniq.database import get_db
from chroniq.models.availability import AvailabilitySchedule
from chroniq.models.booking import Booking
from chroniq.models.event_type import EventType
from chroniq.models.user_profile import UserProfile

router = APIRouter(prefix="/me/bookings", tags=["bookings"])


async def _schedule_for(db: AsyncSession, uid, event_type: EventType) -> AvailabilitySchedule | None:
    stmt = (
        select(AvailabilitySchedule)
        .where(AvailabilitySchedule.keycloak_id == uid)
        .options(
            selectinload(AvailabilitySchedule.rules),
            selectinload(AvailabilitySchedule.overrides),
        )
    )
    if event_type.schedule_id:
        stmt = stmt.where(AvailabilitySchedule.id == event_type.schedule_id)
    else:
        stmt = stmt.where(AvailabilitySchedule.is_default.is_(True))
    return (await db.execute(stmt)).scalars().first()


@router.get("", response_model=list[BookingOut])
async def list_bookings(
    uid: CurrentUserId,
    filter: BookingStatusFilter = "upcoming",
    db: AsyncSession = Depends(get_db),
):
    now = datetime.now(timezone.utc)
    stmt = select(Booking).where(Booking.host_keycloak_id == uid)

    if filter == "upcoming":
        stmt = stmt.where(Booking.start_utc >= now, Booking.status == "confirmed").order_by(
            Booking.start_utc
        )
    elif filter == "past":
        stmt = stmt.where(Booking.start_utc < now).order_by(Booking.start_utc.desc())
    elif filter == "cancelled":
        stmt = stmt.where(Booking.status == "cancelled").order_by(Booking.start_utc.desc())
    else:  # all
        stmt = stmt.order_by(Booking.start_utc.desc())

    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.post("/{booking_id}/cancel", response_model=BookingOut)
async def cancel_booking(booking_id: int, uid: CurrentUserId, db: AsyncSession = Depends(get_db)):
    booking = await db.get(Booking, booking_id)
    if booking is None or str(booking.host_keycloak_id) != str(uid):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Booking not found")
    booking.status = "cancelled"
    await db.commit()
    await db.refresh(booking)
    # NOTE: external calendar event deletion + cancellation email handled in
    # Phases 3/4 (see calendar_providers.delete_event / notifications).
    return booking


@router.post("/{booking_id}/reschedule", response_model=BookingOut)
async def reschedule_booking(
    booking_id: int,
    payload: RescheduleRequest,
    uid: CurrentUserId,
    db: AsyncSession = Depends(get_db),
):
    """Host-side reschedule: move a confirmed booking to a new available slot."""
    booking = await db.get(Booking, booking_id)
    if booking is None or str(booking.host_keycloak_id) != str(uid):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Booking not found")
    if booking.status != "confirmed":
        raise HTTPException(status.HTTP_409_CONFLICT, "Only confirmed bookings can be rescheduled")

    profile = await db.get(UserProfile, booking.host_keycloak_id)
    event_type = await db.get(EventType, booking.event_type_id)
    if profile is None or event_type is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Booking not found")

    new_start = payload.start.astimezone(timezone.utc)
    if new_start <= datetime.now(timezone.utc):
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Cannot reschedule to the past")
    new_end = new_start + timedelta(minutes=event_type.duration_minutes)

    schedule = await _schedule_for(db, profile.keycloak_id, event_type)
    if schedule is None:
        raise HTTPException(status.HTTP_409_CONFLICT, "Host has no availability")

    # Offered slots for the new day, treating THIS booking's current slot as free.
    day_start = datetime.combine(new_start.date(), datetime.min.time(), tzinfo=timezone.utc)
    day_end = datetime.combine(new_start.date(), datetime.max.time(), tzinfo=timezone.utc)
    existing = (
        await db.execute(
            select(Booking).where(
                Booking.host_keycloak_id == profile.keycloak_id,
                Booking.status == "confirmed",
                Booking.id != booking.id,
                Booking.start_utc < day_end,
                Booking.end_utc > day_start,
            )
        )
    ).scalars().all()
    busy = [BusyBlock(b.start_utc, b.end_utc) for b in existing]
    offered = {
        s.start for s in generate_slots(
            event_type=event_type, schedule=schedule, rules=schedule.rules,
            overrides=schedule.overrides, busy=busy, day=new_start.date(),
            invitee_tz=booking.invitee_timezone,
        )
    }
    if new_start not in offered:
        raise HTTPException(status.HTTP_409_CONFLICT, "That slot is not available")

    booking.start_utc = new_start
    booking.end_utc = new_end
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "That slot was just taken")
    await db.refresh(booking)

    notifications.send_reschedule(booking, profile.display_name or profile.username, "", event_type.title)
    return booking
