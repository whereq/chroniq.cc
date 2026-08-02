"""EventType model — a bookable meeting template owned by a host."""

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from chroniq.database import Base


class EventType(Base):
    """A meeting template (e.g. "30 Minute Meeting") that invitees can book."""

    __tablename__ = "event_types"
    __table_args__ = (
        UniqueConstraint("keycloak_id", "slug", name="uq_event_type_user_slug"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    keycloak_id: Mapped[str] = mapped_column(PG_UUID(as_uuid=True), index=True)

    slug: Mapped[str] = mapped_column(String(80))
    title: Mapped[str] = mapped_column(String(160))
    description: Mapped[str] = mapped_column(Text, default="")
    duration_minutes: Mapped[int] = mapped_column(Integer, default=30)
    # video | phone | in-person | custom
    location: Mapped[str] = mapped_column(String(20), default="video")
    location_detail: Mapped[str | None] = mapped_column(String(512), nullable=True)
    color: Mapped[str] = mapped_column(String(16), default="#6366f1")

    buffer_before: Mapped[int] = mapped_column(Integer, default=0)   # minutes
    buffer_after: Mapped[int] = mapped_column(Integer, default=0)    # minutes
    min_notice_minutes: Mapped[int] = mapped_column(Integer, default=0)
    # How far into the future bookings are allowed (days).
    booking_window_days: Mapped[int] = mapped_column(Integer, default=60)

    # Optional link to a specific availability schedule; null = host default.
    schedule_id: Mapped[int | None] = mapped_column(Integer, nullable=True)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    def __repr__(self) -> str:
        return f"<EventType {self.keycloak_id}/{self.slug}>"
