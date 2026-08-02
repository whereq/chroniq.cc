"""Availability schemas."""

from datetime import date, time

from pydantic import BaseModel, ConfigDict, Field


class RuleIn(BaseModel):
    day_of_week: int = Field(ge=0, le=6)
    start_time: time
    end_time: time
    is_enabled: bool = True


class RuleOut(RuleIn):
    model_config = ConfigDict(from_attributes=True)
    id: int


class OverrideIn(BaseModel):
    date: date
    is_unavailable: bool = True
    start_time: time | None = None
    end_time: time | None = None


class OverrideOut(OverrideIn):
    model_config = ConfigDict(from_attributes=True)
    id: int


class ScheduleCreate(BaseModel):
    name: str = "Working hours"
    timezone: str = "UTC"
    is_default: bool = True
    rules: list[RuleIn] = []
    overrides: list[OverrideIn] = []


class ScheduleUpdate(BaseModel):
    name: str | None = None
    timezone: str | None = None
    is_default: bool | None = None
    rules: list[RuleIn] | None = None
    overrides: list[OverrideIn] | None = None


class ScheduleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    timezone: str
    is_default: bool
    rules: list[RuleOut]
    overrides: list[OverrideOut]
