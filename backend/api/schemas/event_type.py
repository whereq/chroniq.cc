"""EventType schemas."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

Location = Literal["video", "phone", "in-person", "custom"]


class EventTypeBase(BaseModel):
    slug: str = Field(min_length=1, max_length=80, pattern=r"^[a-z0-9][a-z0-9-]*$")
    title: str = Field(min_length=1, max_length=160)
    description: str = ""
    duration_minutes: int = Field(default=30, ge=5, le=1440)
    location: Location = "video"
    location_detail: str | None = None
    color: str = "#6366f1"
    buffer_before: int = Field(default=0, ge=0, le=240)
    buffer_after: int = Field(default=0, ge=0, le=240)
    min_notice_minutes: int = Field(default=0, ge=0)
    booking_window_days: int = Field(default=60, ge=1, le=365)
    schedule_id: int | None = None
    is_active: bool = True


class EventTypeCreate(EventTypeBase):
    pass


class EventTypeUpdate(BaseModel):
    slug: str | None = Field(default=None, min_length=1, max_length=80, pattern=r"^[a-z0-9][a-z0-9-]*$")
    title: str | None = Field(default=None, min_length=1, max_length=160)
    description: str | None = None
    duration_minutes: int | None = Field(default=None, ge=5, le=1440)
    location: Location | None = None
    location_detail: str | None = None
    color: str | None = None
    buffer_before: int | None = Field(default=None, ge=0, le=240)
    buffer_after: int | None = Field(default=None, ge=0, le=240)
    min_notice_minutes: int | None = Field(default=None, ge=0)
    booking_window_days: int | None = Field(default=None, ge=1, le=365)
    schedule_id: int | None = None
    is_active: bool | None = None


class EventTypeOut(EventTypeBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
