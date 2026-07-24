"""timesheet hour target and reminder notification types

Revision ID: 43fbcf4e8353
Revises: 8dee714ad7b6
Create Date: 2026-07-24 09:00:00.000000

Adds weekly_hours_target to TimesheetUserSettings (null = use the 40h default,
see TimesheetService.DEFAULT_WEEKLY_HOURS_TARGET) and two NotificationType
values used by the new timesheet reminder background task.
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = '43fbcf4e8353'
down_revision: Union[str, None] = '8dee714ad7b6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'timesheet_user_settings',
        sa.Column('weekly_hours_target', sa.Numeric(precision=5, scale=2), nullable=True),
    )
    op.execute("ALTER TYPE notificationtype ADD VALUE IF NOT EXISTS 'timesheet_week_unsubmitted'")
    op.execute("ALTER TYPE notificationtype ADD VALUE IF NOT EXISTS 'timesheet_pending_approvals'")


def downgrade() -> None:
    # Postgres has no DROP VALUE for enum types -- leaving the two added
    # NotificationType values in place on downgrade is harmless (unused).
    op.drop_column('timesheet_user_settings', 'weekly_hours_target')
