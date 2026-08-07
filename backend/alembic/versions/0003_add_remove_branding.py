"""Add remove_branding to user_profiles.

Synced from the host's tier entitlement so the anonymous public booking page can
decide whether to show the "Powered by chroniq.cc" badge.

Revision ID: 0003
Revises: 0002
Create Date: 2026-08-06
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0003"
down_revision: Union[str, None] = "0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "user_profiles",
        sa.Column("remove_branding", sa.Boolean(), nullable=False, server_default="false"),
    )


def downgrade() -> None:
    op.drop_column("user_profiles", "remove_branding")
