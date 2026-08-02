"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-08-01

Creates the full chroniq scheduling schema plus a GiST exclusion constraint
that prevents overlapping confirmed bookings for the same host.
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS btree_gist")

    op.create_table(
        "user_profiles",
        sa.Column("keycloak_id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("username", sa.String(64), nullable=False),
        sa.Column("display_name", sa.String(120), nullable=False, server_default=""),
        sa.Column("timezone", sa.String(64), nullable=False, server_default="UTC"),
        sa.Column("avatar_url", sa.String(512)),
        sa.Column("brand_color", sa.String(16), nullable=False, server_default="#6366f1"),
        sa.Column("bio", sa.String(500)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_user_profiles_username", "user_profiles", ["username"], unique=True)

    op.create_table(
        "event_types",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("keycloak_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("slug", sa.String(80), nullable=False),
        sa.Column("title", sa.String(160), nullable=False),
        sa.Column("description", sa.Text, nullable=False, server_default=""),
        sa.Column("duration_minutes", sa.Integer, nullable=False, server_default="30"),
        sa.Column("location", sa.String(20), nullable=False, server_default="video"),
        sa.Column("location_detail", sa.String(512)),
        sa.Column("color", sa.String(16), nullable=False, server_default="#6366f1"),
        sa.Column("buffer_before", sa.Integer, nullable=False, server_default="0"),
        sa.Column("buffer_after", sa.Integer, nullable=False, server_default="0"),
        sa.Column("min_notice_minutes", sa.Integer, nullable=False, server_default="0"),
        sa.Column("booking_window_days", sa.Integer, nullable=False, server_default="60"),
        sa.Column("schedule_id", sa.Integer),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("keycloak_id", "slug", name="uq_event_type_user_slug"),
    )
    op.create_index("ix_event_types_keycloak_id", "event_types", ["keycloak_id"])

    op.create_table(
        "availability_schedules",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("keycloak_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(120), nullable=False, server_default="Working hours"),
        sa.Column("timezone", sa.String(64), nullable=False, server_default="UTC"),
        sa.Column("is_default", sa.Boolean, nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index(
        "ix_availability_schedules_keycloak_id", "availability_schedules", ["keycloak_id"]
    )

    op.create_table(
        "availability_rules",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column(
            "schedule_id",
            sa.Integer,
            sa.ForeignKey("availability_schedules.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("day_of_week", sa.Integer, nullable=False),
        sa.Column("start_time", sa.Time, nullable=False),
        sa.Column("end_time", sa.Time, nullable=False),
        sa.Column("is_enabled", sa.Boolean, nullable=False, server_default=sa.true()),
    )
    op.create_index("ix_availability_rules_schedule_id", "availability_rules", ["schedule_id"])

    op.create_table(
        "availability_overrides",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column(
            "schedule_id",
            sa.Integer,
            sa.ForeignKey("availability_schedules.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("date", sa.Date, nullable=False),
        sa.Column("is_unavailable", sa.Boolean, nullable=False, server_default=sa.true()),
        sa.Column("start_time", sa.Time),
        sa.Column("end_time", sa.Time),
    )
    op.create_index(
        "ix_availability_overrides_schedule_id", "availability_overrides", ["schedule_id"]
    )
    op.create_index("ix_availability_overrides_date", "availability_overrides", ["date"])

    op.create_table(
        "bookings",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("host_keycloak_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "event_type_id",
            sa.Integer,
            sa.ForeignKey("event_types.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("invitee_name", sa.String(160), nullable=False),
        sa.Column("invitee_email", sa.String(254), nullable=False),
        sa.Column("invitee_timezone", sa.String(64), nullable=False, server_default="UTC"),
        sa.Column("notes", sa.Text),
        sa.Column("start_utc", sa.DateTime(timezone=True), nullable=False),
        sa.Column("end_utc", sa.DateTime(timezone=True), nullable=False),
        sa.Column("status", sa.String(16), nullable=False, server_default="confirmed"),
        sa.Column("cancel_token", sa.String(64), nullable=False),
        sa.Column("meeting_url", sa.String(512)),
        sa.Column("external_event_id", sa.String(256)),
        sa.Column("external_provider", sa.String(16)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("cancel_token", name="uq_booking_cancel_token"),
    )
    op.create_index("ix_bookings_host_keycloak_id", "bookings", ["host_keycloak_id"])
    op.create_index("ix_bookings_event_type_id", "bookings", ["event_type_id"])
    op.create_index("ix_bookings_start_utc", "bookings", ["start_utc"])
    op.create_index("ix_bookings_status", "bookings", ["status"])
    op.create_index("ix_bookings_invitee_email", "bookings", ["invitee_email"])

    # Prevent two CONFIRMED bookings for the same host from overlapping in time.
    op.execute(
        """
        ALTER TABLE bookings ADD CONSTRAINT no_overlapping_confirmed_bookings
        EXCLUDE USING gist (
            host_keycloak_id WITH =,
            tstzrange(start_utc, end_utc) WITH &&
        ) WHERE (status = 'confirmed')
        """
    )

    op.create_table(
        "calendar_connections",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("keycloak_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("provider", sa.String(16), nullable=False),
        sa.Column("account_email", sa.String(254)),
        sa.Column("calendar_id", sa.String(256), nullable=False, server_default="primary"),
        sa.Column("access_token", sa.Text, nullable=False),
        sa.Column("refresh_token", sa.Text),
        sa.Column("token_expiry", sa.DateTime(timezone=True)),
        sa.Column("sync_enabled", sa.Boolean, nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("keycloak_id", "provider", name="uq_calconn_user_provider"),
    )
    op.create_index(
        "ix_calendar_connections_keycloak_id", "calendar_connections", ["keycloak_id"]
    )

    op.create_table(
        "notification_log",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column(
            "booking_id",
            sa.Integer,
            sa.ForeignKey("bookings.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("type", sa.String(32), nullable=False),
        sa.Column("sent_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("booking_id", "type", name="uq_notification_booking_type"),
    )
    op.create_index("ix_notification_log_booking_id", "notification_log", ["booking_id"])


def downgrade() -> None:
    op.drop_table("notification_log")
    op.drop_table("calendar_connections")
    op.execute("ALTER TABLE bookings DROP CONSTRAINT IF EXISTS no_overlapping_confirmed_bookings")
    op.drop_table("bookings")
    op.drop_table("availability_overrides")
    op.drop_table("availability_rules")
    op.drop_table("availability_schedules")
    op.drop_table("event_types")
    op.drop_table("user_profiles")
