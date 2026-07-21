"""add meeting participants and guests

Revision ID: 94098976f077
Revises: 4285890c42a3
Create Date: 2026-07-21 18:51:00.000000

Adds two JSON columns to scheduled_meetings so a host can invite internal
teammates (participant_user_ids) and extra external guests (guest_emails)
alongside the primary client when creating a meeting — see
app/services/booking.py's _resolve_extra_attendees and
app/services/google_calendar.py's _event_body for how these feed into the
Google Calendar attendees list.
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = '94098976f077'
down_revision: Union[str, None] = '4285890c42a3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'scheduled_meetings',
        sa.Column('participant_user_ids', sa.JSON(), nullable=False, server_default='[]'),
    )
    op.add_column(
        'scheduled_meetings',
        sa.Column('guest_emails', sa.JSON(), nullable=False, server_default='[]'),
    )


def downgrade() -> None:
    op.drop_column('scheduled_meetings', 'guest_emails')
    op.drop_column('scheduled_meetings', 'participant_user_ids')
