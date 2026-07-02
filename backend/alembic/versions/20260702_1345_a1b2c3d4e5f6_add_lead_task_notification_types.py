"""add_lead_task_notification_types

Revision ID: a1b2c3d4e5f6
Revises: c7d8e21a4f93
Create Date: 2026-07-02 13:45:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = 'c7d8e21a4f93'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE notificationtype ADD VALUE IF NOT EXISTS 'lead_task_assigned'")
    op.execute("ALTER TYPE notificationtype ADD VALUE IF NOT EXISTS 'lead_task_completed'")


def downgrade() -> None:
    # Postgres has no DROP VALUE for enums; removing these would require rebuilding
    # the type and is not worth the risk for two notification type labels.
    pass
