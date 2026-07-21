"""meetings: outcome notes, recurrence, client reminder markers

Revision ID: c83bbb08d091
Revises: 4c0b01681feb
Create Date: 2026-07-21 21:45:00.000000

Adds the columns needed to close several SME-facing gaps in the Meetings
module without introducing new tables: outcome_notes (post-meeting notes),
recurrence_rule/recurrence_end_date/recurrence_group_id (materialized
recurring-meeting instances), and client_reminder_24h_sent_at /
client_reminder_1h_sent_at (dedup markers for the new client-facing
reminder-email poller in app/services/meeting_scheduler.py). Also adds two
NotificationType values used when a client self-serves a reschedule/cancel
via the new public manage-meeting link.
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'c83bbb08d091'
down_revision: Union[str, None] = '4c0b01681feb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

recurrence_rule = sa.Enum('daily', 'weekly', 'biweekly', 'monthly', name='recurrencerule')


def upgrade() -> None:
    bind = op.get_bind()
    recurrence_rule.create(bind, checkfirst=True)

    op.add_column('scheduled_meetings', sa.Column('outcome_notes', sa.Text(), nullable=True))
    op.add_column('scheduled_meetings', sa.Column('recurrence_rule', recurrence_rule, nullable=True))
    op.add_column('scheduled_meetings', sa.Column('recurrence_end_date', sa.Date(), nullable=True))
    op.add_column('scheduled_meetings', sa.Column('recurrence_group_id', sa.Uuid(), nullable=True))
    op.add_column('scheduled_meetings', sa.Column('client_reminder_24h_sent_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('scheduled_meetings', sa.Column('client_reminder_1h_sent_at', sa.DateTime(timezone=True), nullable=True))

    op.create_index(
        op.f('ix_scheduled_meetings_recurrence_group_id'), 'scheduled_meetings', ['recurrence_group_id']
    )

    op.execute("ALTER TYPE notificationtype ADD VALUE IF NOT EXISTS 'meeting_rescheduled_by_client'")
    op.execute("ALTER TYPE notificationtype ADD VALUE IF NOT EXISTS 'meeting_cancelled_by_client'")


def downgrade() -> None:
    # Postgres has no DROP VALUE for enum types — leaving the two added
    # NotificationType values in place on downgrade is harmless (unused).
    op.drop_index(op.f('ix_scheduled_meetings_recurrence_group_id'), table_name='scheduled_meetings')
    op.drop_column('scheduled_meetings', 'client_reminder_1h_sent_at')
    op.drop_column('scheduled_meetings', 'client_reminder_24h_sent_at')
    op.drop_column('scheduled_meetings', 'recurrence_group_id')
    op.drop_column('scheduled_meetings', 'recurrence_end_date')
    op.drop_column('scheduled_meetings', 'recurrence_rule')

    bind = op.get_bind()
    recurrence_rule.drop(bind, checkfirst=True)
