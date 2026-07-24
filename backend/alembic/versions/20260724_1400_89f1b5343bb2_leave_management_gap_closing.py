"""leave management gap closing

Revision ID: 89f1b5343bb2
Revises: 43fbcf4e8353
Create Date: 2026-07-24 14:00:00.000000

Adds: HolidayType.BLACKOUT (dates leave can't be requested across, distinct from
an actual day off), ProjectTimeLog.source_leave_request_id (links an
auto-generated timesheet entry back to the approved leave request that created
it, so cancelling the leave can clean the entry up), and three NotificationType
values for leave request submit/approve/reject.
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = '89f1b5343bb2'
down_revision: Union[str, None] = '43fbcf4e8353'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE holidaytype ADD VALUE IF NOT EXISTS 'blackout'")
    op.execute("ALTER TYPE notificationtype ADD VALUE IF NOT EXISTS 'leave_request_submitted'")
    op.execute("ALTER TYPE notificationtype ADD VALUE IF NOT EXISTS 'leave_request_approved'")
    op.execute("ALTER TYPE notificationtype ADD VALUE IF NOT EXISTS 'leave_request_rejected'")

    op.add_column('project_time_logs', sa.Column('source_leave_request_id', sa.Integer(), nullable=True))
    op.create_foreign_key(
        'fk_project_time_logs_source_leave_request_id',
        'project_time_logs', 'hr_leave_requests',
        ['source_leave_request_id'], ['id'], ondelete='CASCADE',
    )
    op.create_index(
        op.f('ix_project_time_logs_source_leave_request_id'),
        'project_time_logs', ['source_leave_request_id'],
    )


def downgrade() -> None:
    op.drop_index(op.f('ix_project_time_logs_source_leave_request_id'), table_name='project_time_logs')
    op.drop_constraint('fk_project_time_logs_source_leave_request_id', 'project_time_logs', type_='foreignkey')
    op.drop_column('project_time_logs', 'source_leave_request_id')
    # Postgres has no DROP VALUE for enum types -- leaving the added enum values in
    # place on downgrade is harmless (unused).
