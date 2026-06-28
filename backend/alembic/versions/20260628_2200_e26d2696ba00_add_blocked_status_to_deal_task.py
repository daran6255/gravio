"""add_blocked_status_to_deal_task

Revision ID: e26d2696ba00
Revises: a9f3c2e7b814
Create Date: 2026-06-28 22:00:59.507102

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e26d2696ba00'
down_revision: Union[str, None] = 'a9f3c2e7b814'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE dealtaskstatus ADD VALUE IF NOT EXISTS 'blocked'")


def downgrade() -> None:
    # Postgres has no DROP VALUE for enums; removing 'blocked' would require
    # rebuilding the type and is not worth the risk for a status label.
    pass
