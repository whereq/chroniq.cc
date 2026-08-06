"""UserProfile model — one row per Keycloak user (the booking host)."""

from datetime import datetime

from sqlalchemy import DateTime, String, Text, func
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from chroniq.database import Base


class UserProfile(Base):
    """A host's public scheduling profile, keyed by Keycloak `sub`."""

    __tablename__ = "user_profiles"

    keycloak_id: Mapped[str] = mapped_column(PG_UUID(as_uuid=True), primary_key=True)
    # Public booking handle used in /{username}/{slug} URLs.
    username: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    display_name: Mapped[str] = mapped_column(String(120), default="")
    timezone: Mapped[str] = mapped_column(String(64), default="UTC")
    # Holds a native-avatar key (cq:<key>), an uploaded image data URL
    # (base64 JPEG, ~16 KB), or an http(s) URL — hence Text, not String(512).
    avatar_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    brand_color: Mapped[str] = mapped_column(String(16), default="#6366f1")
    bio: Mapped[str | None] = mapped_column(String(500), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    def __repr__(self) -> str:
        return f"<UserProfile {self.username}>"
