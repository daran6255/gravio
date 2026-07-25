"""add_ai_provider_exhausted_notification_type

Revision ID: de484f85a4f1
Revises: 25e1467a9c87
Create Date: 2026-07-25 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'de484f85a4f1'
down_revision: Union[str, None] = '25e1467a9c87'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE notificationtype ADD VALUE IF NOT EXISTS 'ai_provider_exhausted'")


def downgrade() -> None:
    # Postgres has no DROP VALUE for enums; removing this would require rebuilding
    # the type and is not worth the risk for one notification type label.
    pass
