"""NotificationLog model — idempotency guard for outbound emails/reminders."""

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from chroniq.database import Base


class NotificationLog(Base):
    """Records that a given notification was sent, so we never send it twice."""

    __tablename__ = "notification_log"
    __table_args__ = (
        UniqueConstraint("booking_id", "type", name="uq_notification_booking_type"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    booking_id: Mapped[int] = mapped_column(
        ForeignKey("bookings.id", ondelete="CASCADE"), index=True
    )
    # confirmation | reminder_24h | reminder_1h | cancellation | reschedule
    type: Mapped[str] = mapped_column(String(32))
    sent_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self) -> str:
        return f"<NotificationLog booking={self.booking_id} {self.type}>"
