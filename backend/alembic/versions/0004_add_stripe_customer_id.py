"""Add stripe_customer_id to user_profiles.

Stored on first successful checkout so the user can self-serve manage/cancel
their subscription via the Stripe Billing Portal.

Revision ID: 0004
Revises: 0003
Create Date: 2026-08-07
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0004"
down_revision: Union[str, None] = "0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "user_profiles",
        sa.Column("stripe_customer_id", sa.String(length=255), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("user_profiles", "stripe_customer_id")
