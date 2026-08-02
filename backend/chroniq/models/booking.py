"""Booking model — a confirmed (or cancelled) meeting between host and invitee.

Double-booking prevention: a PostgreSQL exclusion constraint rejects any two
CONFIRMED bookings for the same host whose [start, end) ranges overlap. It is
added in the Alembic migration (needs the btree_gist extension) rather than
declared here, since SQLAlchemy cannot express a partial GiST ExcludeConstraint
with a tsrange over two columns cleanly across autogenerate.
"""

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from chroniq.database import Base


class Booking(Base):
    """A single scheduled meeting."""

    __tablename__ = "bookings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    host_keycloak_id: Mapped[str] = mapped_column(PG_UUID(as_uuid=True), index=True)
    event_type_id: Mapped[int] = mapped_column(
        ForeignKey("event_types.id", ondelete="CASCADE"), index=True
    )

    invitee_name: Mapped[str] = mapped_column(String(160))
    invitee_email: Mapped[str] = mapped_column(String(254), index=True)
    invitee_timezone: Mapped[str] = mapped_column(String(64), default="UTC")
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    start_utc: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    end_utc: Mapped[datetime] = mapped_column(DateTime(timezone=True))

    # confirmed | cancelled | rescheduled
    status: Mapped[str] = mapped_column(String(16), default="confirmed", index=True)

    # Opaque token letting the invitee manage the booking without an account.
    cancel_token: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    # Meeting URL (static host link in v1; auto-generated later).
    meeting_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    # Id of the event created on the host's external calendar, if synced.
    external_event_id: Mapped[str | None] = mapped_column(String(256), nullable=True)
    external_provider: Mapped[str | None] = mapped_column(String(16), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    def __repr__(self) -> str:
        return f"<Booking {self.id} {self.status} {self.start_utc}>"
