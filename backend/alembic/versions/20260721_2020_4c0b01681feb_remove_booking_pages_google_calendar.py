"""remove booking pages, availability exceptions, and Google Calendar integration

Revision ID: 4c0b01681feb
Revises: 4cadb7e86eb3
Create Date: 2026-07-21 20:20:00.000000

Removes the BookingPage/public-self-serve-booking/Google-Calendar-OAuth-sync
concept entirely — the Meetings feature now works as a simple internal scheduler:
a host picks any date/time and types in their own location (link/address/phone)
directly on the meeting, with no availability rules or calendar-provider sync.

scheduled_meetings gains a direct host_user_id (backfilled from the meeting's old
booking_pages.user_id) plus location_type/location_detail (backfilled from the old
booking page's location settings, so existing meetings keep their location info),
and loses booking_page_id, manage_token, and every Google-sync bookkeeping column.
booking_pages, booking_availability_exceptions, and google_oauth_connections are
dropped outright, along with their now-unused Postgres enum types.
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = '4c0b01681feb'
down_revision: Union[str, None] = '4cadb7e86eb3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

meeting_location_type = sa.Enum('google_meet', 'offline', 'phone', name='meetinglocationtype')


def upgrade() -> None:
    bind = op.get_bind()
    meeting_location_type.create(bind, checkfirst=True)

    op.add_column('scheduled_meetings', sa.Column('host_user_id', sa.Integer(), nullable=True))
    op.add_column('scheduled_meetings', sa.Column('location_type', meeting_location_type, nullable=True))
    op.add_column('scheduled_meetings', sa.Column('location_detail', sa.String(length=500), nullable=True))

    # Backfill from the meeting's old booking page before that table goes away.
    op.execute("""
        UPDATE scheduled_meetings sm
        SET host_user_id = bp.user_id,
            location_type = bp.location_type::text::meetinglocationtype,
            location_detail = CASE
                WHEN bp.location_type = 'offline' THEN bp.offline_address
                ELSE COALESCE(sm.google_meet_link, bp.fallback_meeting_note)
            END
        FROM booking_pages bp
        WHERE sm.booking_page_id = bp.id
    """)

    op.alter_column('scheduled_meetings', 'host_user_id', nullable=False)
    op.alter_column('scheduled_meetings', 'location_type', nullable=False, server_default='google_meet')

    op.create_index(op.f('ix_scheduled_meetings_host_user_id'), 'scheduled_meetings', ['host_user_id'])
    op.create_foreign_key(
        'fk_scheduled_meetings_host_user_id_users', 'scheduled_meetings', 'users',
        ['host_user_id'], ['id'], ondelete='CASCADE',
    )

    op.drop_column('scheduled_meetings', 'booking_page_id')
    op.drop_column('scheduled_meetings', 'manage_token')
    op.drop_column('scheduled_meetings', 'calendar_sync_status')
    op.drop_column('scheduled_meetings', 'calendar_sync_attempts')
    op.drop_column('scheduled_meetings', 'calendar_sync_last_error')
    op.drop_column('scheduled_meetings', 'google_event_id')
    op.drop_column('scheduled_meetings', 'google_meet_link')

    op.drop_table('booking_availability_exceptions')
    op.drop_table('booking_pages')
    op.drop_table('google_oauth_connections')

    op.execute("DROP TYPE IF EXISTS googleconnectionstatus")
    op.execute("DROP TYPE IF EXISTS calendarsyncstatus")
    op.execute("DROP TYPE IF EXISTS bookinglocationtype")


def downgrade() -> None:
    raise NotImplementedError(
        "This migration removes booking_pages/booking_availability_exceptions/"
        "google_oauth_connections data outright — restoring them would need a "
        "backup taken before upgrade(), not a mechanical column/table re-add."
    )
