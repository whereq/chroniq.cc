"""Widen user_profiles.avatar_url to Text for native-avatar keys / data URLs.

The avatar system (ported from flowdesk.top) stores either a native-avatar key
(cq:<key>), an uploaded image data URL (base64 JPEG, ~16 KB), or an http(s) URL
in avatar_url — none of which fit String(512).

Revision ID: 0002
Revises: 0001
Create Date: 2026-08-06
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        "user_profiles",
        "avatar_url",
        type_=sa.Text(),
        existing_type=sa.String(length=512),
        existing_nullable=True,
    )


def downgrade() -> None:
    op.alter_column(
        "user_profiles",
        "avatar_url",
        type_=sa.String(length=512),
        existing_type=sa.Text(),
        existing_nullable=True,
    )
