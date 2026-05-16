"""add_marketing_role

Revision ID: 5aa14ff6f88d
Revises: 70aaf3e98b31
Create Date: 2026-04-04 09:58:11.187263

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5aa14ff6f88d'
down_revision: Union[str, None] = '70aaf3e98b31'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add new values to userrole enum
    # Note: ADD VALUE IF NOT EXISTS is supported in PostgreSQL 13+
    op.execute("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'marketing'")


def downgrade() -> None:
    # Reverting enum changes in PostgreSQL is difficult and usually avoided
    pass
