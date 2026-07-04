"""add_trial_extension_notification_type

Revision ID: b7c9d1e2f3a4
Revises: 9e82acaf23ad
Create Date: 2026-07-04 15:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b7c9d1e2f3a4'
down_revision: Union[str, None] = '9e82acaf23ad'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE notificationtype ADD VALUE IF NOT EXISTS 'trial_extension_requested'")


def downgrade() -> None:
    # Postgres has no DROP VALUE for enums; removing this would require rebuilding
    # the type and is not worth the risk for one notification type label.
    pass
