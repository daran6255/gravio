"""add_user_timezone_currency_preferences

Revision ID: c640fcfb8350
Revises: a1b2c3d4e5f6
Create Date: 2026-07-02 16:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c640fcfb8350'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('timezone', sa.String(length=64), nullable=True))
    op.add_column('users', sa.Column('currency', sa.String(length=10), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'currency')
    op.drop_column('users', 'timezone')
