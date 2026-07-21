"""add meeting title

Revision ID: 4cadb7e86eb3
Revises: 94098976f077
Create Date: 2026-07-21 19:30:00.000000

Lets a host give a host-created meeting its own title, instead of always
falling back to "{booking_page.title} with {client_name}" — see
app/services/google_calendar.py's _event_body.
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = '4cadb7e86eb3'
down_revision: Union[str, None] = '94098976f077'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'scheduled_meetings',
        sa.Column('meeting_title', sa.String(length=200), nullable=True),
    )


def downgrade() -> None:
    op.drop_column('scheduled_meetings', 'meeting_title')
