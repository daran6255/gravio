"""add_missing_user_roles

Revision ID: fd64097c25ff
Revises: 0a81ff50a796
Create Date: 2026-03-16 11:24:24.802189

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fd64097c25ff'
down_revision: Union[str, None] = '0a81ff50a796'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add new values to userrole enum
    # Note: ADD VALUE IF NOT EXISTS is supported in PostgreSQL 13+
    op.execute("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'counselor'")
    op.execute("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'project_coordinator'")
    op.execute("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'developer'")


def downgrade() -> None:
    # Reverting enum changes in PostgreSQL is difficult and usually avoided
    pass
