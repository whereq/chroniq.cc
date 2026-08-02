"""Authenticated host bookings — list, cancel, reschedule."""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.schemas.booking import BookingOut, BookingStatusFilter
from chroniq.auth import CurrentUserId
from chroniq.database import get_db
from chroniq.models.booking import Booking

router = APIRouter(prefix="/me/bookings", tags=["bookings"])


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
