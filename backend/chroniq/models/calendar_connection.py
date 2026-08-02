"""CalendarConnection model — a host's linked external calendar (OAuth tokens).

Tokens are encrypted at rest by the integration service before being written
here (see api/services/token_crypto.py). This model stores only ciphertext.
"""

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from chroniq.database import Base


class CalendarConnection(Base):
    """An OAuth link to Google Calendar or Microsoft Graph."""

    __tablename__ = "calendar_connections"
    __table_args__ = (
        UniqueConstraint("keycloak_id", "provider", name="uq_calconn_user_provider"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    keycloak_id: Mapped[str] = mapped_column(PG_UUID(as_uuid=True), index=True)

    provider: Mapped[str] = mapped_column(String(16))  # google | microsoft
    account_email: Mapped[str | None] = mapped_column(String(254), nullable=True)
    calendar_id: Mapped[str] = mapped_column(String(256), default="primary")

    access_token: Mapped[str] = mapped_column(Text)          # encrypted
    refresh_token: Mapped[str | None] = mapped_column(Text, nullable=True)  # encrypted
    token_expiry: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    sync_enabled: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    def __repr__(self) -> str:
        return f"<CalendarConnection {self.keycloak_id} {self.provider}>"
