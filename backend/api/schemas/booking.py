"""Booking + public scheduling schemas."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class PublicEventType(BaseModel):
    """Event type as shown on a public booking page."""

    slug: str
    title: str
    description: str
    duration_minutes: int
    location: str
    color: str


class PublicHost(BaseModel):
    username: str
    display_name: str
    avatar_url: str | None
    brand_color: str
    bio: str | None
    timezone: str


class PublicHostPage(BaseModel):
    host: PublicHost
    event_types: list[PublicEventType]


class SlotOut(BaseModel):
    """An available slot, rendered in the requested timezone."""

    start: datetime
    end: datetime


class SlotsResponse(BaseModel):
    timezone: str
    date: str
    slots: list[SlotOut]


class BookingCreate(BaseModel):
    start: datetime = Field(description="Slot start in ISO-8601 with offset")
    invitee_name: str = Field(min_length=1, max_length=160)
    invitee_email: EmailStr
    invitee_timezone: str = "UTC"
    notes: str | None = Field(default=None, max_length=2000)


class BookingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    event_type_id: int
    invitee_name: str
    invitee_email: str
    invitee_timezone: str
    notes: str | None
    start_utc: datetime
    end_utc: datetime
    status: str
    meeting_url: str | None


class BookingConfirmation(BaseModel):
    """Returned to the invitee after a successful public booking."""

    booking: BookingOut
    cancel_token: str
    host_display_name: str
    event_title: str


class ManagedBooking(BaseModel):
    """Booking view for the invitee's self-service page (keyed by cancel_token)."""

    id: int
    status: str
    start_utc: datetime
    end_utc: datetime
    invitee_name: str
    invitee_timezone: str
    meeting_url: str | None
    host_username: str
    host_display_name: str
    event_slug: str
    event_title: str
    duration_minutes: int


class RescheduleRequest(BaseModel):
    start: datetime


BookingStatusFilter = Literal["upcoming", "past", "cancelled", "all"]
