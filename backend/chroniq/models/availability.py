"""Availability models — weekly recurring rules plus date-specific overrides."""

from datetime import date, datetime, time

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Time,
    func,
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from chroniq.database import Base


class AvailabilitySchedule(Base):
    """A named set of weekly availability rules (e.g. "Working hours")."""

    __tablename__ = "availability_schedules"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    keycloak_id: Mapped[str] = mapped_column(PG_UUID(as_uuid=True), index=True)
    name: Mapped[str] = mapped_column(String(120), default="Working hours")
    timezone: Mapped[str] = mapped_column(String(64), default="UTC")
    is_default: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    rules: Mapped[list["AvailabilityRule"]] = relationship(
        back_populates="schedule", cascade="all, delete-orphan"
    )
    overrides: Mapped[list["AvailabilityOverride"]] = relationship(
        back_populates="schedule", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<AvailabilitySchedule {self.id} {self.name!r}>"


class AvailabilityRule(Base):
    """A recurring weekly window (multiple per weekday allowed)."""

    __tablename__ = "availability_rules"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    schedule_id: Mapped[int] = mapped_column(
        ForeignKey("availability_schedules.id", ondelete="CASCADE"), index=True
    )
    day_of_week: Mapped[int] = mapped_column(Integer)  # 0=Sunday .. 6=Saturday
    start_time: Mapped[time] = mapped_column(Time)
    end_time: Mapped[time] = mapped_column(Time)
    is_enabled: Mapped[bool] = mapped_column(Boolean, default=True)

    schedule: Mapped["AvailabilitySchedule"] = relationship(back_populates="rules")

    def __repr__(self) -> str:
        return f"<AvailabilityRule dow={self.day_of_week} {self.start_time}-{self.end_time}>"


class AvailabilityOverride(Base):
    """A date-specific exception: a day off, or altered hours for one date."""

    __tablename__ = "availability_overrides"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    schedule_id: Mapped[int] = mapped_column(
        ForeignKey("availability_schedules.id", ondelete="CASCADE"), index=True
    )
    date: Mapped[date] = mapped_column(Date, index=True)
    is_unavailable: Mapped[bool] = mapped_column(Boolean, default=True)
    start_time: Mapped[time | None] = mapped_column(Time, nullable=True)
    end_time: Mapped[time | None] = mapped_column(Time, nullable=True)

    schedule: Mapped["AvailabilitySchedule"] = relationship(back_populates="overrides")

    def __repr__(self) -> str:
        return f"<AvailabilityOverride {self.date} unavailable={self.is_unavailable}>"
