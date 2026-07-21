"""add booking scheduler tables

Revision ID: e6940208c189
Revises: effc39e02d76
Create Date: 2026-07-21 11:45:27.350938

Hand-trimmed from autogenerate output: the raw diff also picked up ~120 lines of
unrelated pre-existing schema drift across crm_*, project_time_logs, org_holidays,
timesheet_* tables (server defaults, index naming, unique-constraint naming) that
predates this change and isn't part of it — same drift pattern seen in c22e081cd0ae
and effc39e02d76. Only the four new booking tables are kept here.
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'e6940208c189'
down_revision: Union[str, None] = 'effc39e02d76'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('booking_pages',
    sa.Column('public_id', sa.Uuid(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('slug', sa.String(length=80), nullable=False),
    sa.Column('title', sa.String(length=150), nullable=False),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('duration_minutes', sa.Integer(), nullable=False),
    sa.Column('is_active', sa.Boolean(), nullable=False),
    sa.Column('location_type', sa.Enum('google_meet', 'offline', 'phone', name='bookinglocationtype'), nullable=False),
    sa.Column('offline_address', sa.String(length=500), nullable=True),
    sa.Column('fallback_meeting_note', sa.String(length=500), nullable=True),
    sa.Column('timezone', sa.String(length=64), nullable=False),
    sa.Column('availability', sa.JSON(), nullable=False),
    sa.Column('buffer_before_minutes', sa.Integer(), nullable=False),
    sa.Column('buffer_after_minutes', sa.Integer(), nullable=False),
    sa.Column('min_notice_minutes', sa.Integer(), nullable=False),
    sa.Column('max_advance_days', sa.Integer(), nullable=False),
    sa.Column('max_bookings_per_day', sa.Integer(), nullable=True),
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('is_deleted', sa.Boolean(), nullable=False),
    sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('organization_id', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_booking_pages_id'), 'booking_pages', ['id'], unique=False)
    op.create_index(op.f('ix_booking_pages_is_deleted'), 'booking_pages', ['is_deleted'], unique=False)
    op.create_index(op.f('ix_booking_pages_organization_id'), 'booking_pages', ['organization_id'], unique=False)
    op.create_index(op.f('ix_booking_pages_public_id'), 'booking_pages', ['public_id'], unique=True)
    op.create_index(op.f('ix_booking_pages_slug'), 'booking_pages', ['slug'], unique=True)
    op.create_index(op.f('ix_booking_pages_user_id'), 'booking_pages', ['user_id'], unique=False)
    op.create_table('google_oauth_connections',
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('google_email', sa.String(length=255), nullable=False),
    sa.Column('encrypted_refresh_token', sa.Text(), nullable=False),
    sa.Column('encrypted_access_token', sa.Text(), nullable=True),
    sa.Column('access_token_expires_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('granted_scopes', sa.String(length=500), nullable=False),
    sa.Column('status', sa.Enum('connected', 'disconnected', 'error', name='googleconnectionstatus'), nullable=False),
    sa.Column('last_error', sa.String(length=500), nullable=True),
    sa.Column('connected_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('is_deleted', sa.Boolean(), nullable=False),
    sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_google_oauth_connections_id'), 'google_oauth_connections', ['id'], unique=False)
    op.create_index(op.f('ix_google_oauth_connections_is_deleted'), 'google_oauth_connections', ['is_deleted'], unique=False)
    op.create_index(op.f('ix_google_oauth_connections_user_id'), 'google_oauth_connections', ['user_id'], unique=True)
    op.create_table('booking_availability_exceptions',
    sa.Column('booking_page_id', sa.Integer(), nullable=False),
    sa.Column('date', sa.Date(), nullable=False),
    sa.Column('is_blocked', sa.Boolean(), nullable=False),
    sa.Column('custom_slots', sa.JSON(), nullable=True),
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('is_deleted', sa.Boolean(), nullable=False),
    sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('organization_id', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['booking_page_id'], ['booking_pages.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_booking_availability_exceptions_booking_page_id'), 'booking_availability_exceptions', ['booking_page_id'], unique=False)
    op.create_index(op.f('ix_booking_availability_exceptions_date'), 'booking_availability_exceptions', ['date'], unique=False)
    op.create_index(op.f('ix_booking_availability_exceptions_id'), 'booking_availability_exceptions', ['id'], unique=False)
    op.create_index(op.f('ix_booking_availability_exceptions_is_deleted'), 'booking_availability_exceptions', ['is_deleted'], unique=False)
    op.create_index(op.f('ix_booking_availability_exceptions_organization_id'), 'booking_availability_exceptions', ['organization_id'], unique=False)
    op.create_table('scheduled_meetings',
    sa.Column('public_id', sa.Uuid(), nullable=False),
    sa.Column('booking_page_id', sa.Integer(), nullable=False),
    sa.Column('lead_id', sa.Integer(), nullable=True),
    sa.Column('client_name', sa.String(length=150), nullable=False),
    sa.Column('client_email', sa.String(length=255), nullable=False),
    sa.Column('meeting_notes', sa.Text(), nullable=True),
    sa.Column('start_time', sa.DateTime(timezone=True), nullable=False),
    sa.Column('end_time', sa.DateTime(timezone=True), nullable=False),
    sa.Column('host_timezone', sa.String(length=64), nullable=False),
    sa.Column('attendee_timezone', sa.String(length=64), nullable=False),
    sa.Column('status', sa.Enum('scheduled', 'completed', 'cancelled', name='meetingstatus'), nullable=False),
    sa.Column('idempotency_key', sa.String(length=100), nullable=False),
    sa.Column('manage_token', sa.String(length=64), nullable=False),
    sa.Column('calendar_sync_status', sa.Enum('not_applicable', 'pending', 'synced', 'failed', name='calendarsyncstatus'), nullable=False),
    sa.Column('calendar_sync_attempts', sa.Integer(), nullable=False),
    sa.Column('calendar_sync_last_error', sa.String(length=500), nullable=True),
    sa.Column('google_event_id', sa.String(length=255), nullable=True),
    sa.Column('google_meet_link', sa.String(length=500), nullable=True),
    sa.Column('cancelled_by', sa.Enum('host', 'client', 'system', name='cancelledby'), nullable=True),
    sa.Column('cancellation_reason', sa.String(length=500), nullable=True),
    sa.Column('sequence', sa.Integer(), nullable=False),
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('is_deleted', sa.Boolean(), nullable=False),
    sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('organization_id', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['booking_page_id'], ['booking_pages.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['lead_id'], ['crm_leads.id'], ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('idempotency_key')
    )
    op.create_index(op.f('ix_scheduled_meetings_booking_page_id'), 'scheduled_meetings', ['booking_page_id'], unique=False)
    op.create_index(op.f('ix_scheduled_meetings_calendar_sync_status'), 'scheduled_meetings', ['calendar_sync_status'], unique=False)
    op.create_index(op.f('ix_scheduled_meetings_client_email'), 'scheduled_meetings', ['client_email'], unique=False)
    op.create_index(op.f('ix_scheduled_meetings_id'), 'scheduled_meetings', ['id'], unique=False)
    op.create_index(op.f('ix_scheduled_meetings_is_deleted'), 'scheduled_meetings', ['is_deleted'], unique=False)
    op.create_index(op.f('ix_scheduled_meetings_lead_id'), 'scheduled_meetings', ['lead_id'], unique=False)
    op.create_index(op.f('ix_scheduled_meetings_manage_token'), 'scheduled_meetings', ['manage_token'], unique=True)
    op.create_index(op.f('ix_scheduled_meetings_organization_id'), 'scheduled_meetings', ['organization_id'], unique=False)
    op.create_index(op.f('ix_scheduled_meetings_public_id'), 'scheduled_meetings', ['public_id'], unique=True)
    op.create_index(op.f('ix_scheduled_meetings_start_time'), 'scheduled_meetings', ['start_time'], unique=False)
    op.create_index(op.f('ix_scheduled_meetings_status'), 'scheduled_meetings', ['status'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_scheduled_meetings_status'), table_name='scheduled_meetings')
    op.drop_index(op.f('ix_scheduled_meetings_start_time'), table_name='scheduled_meetings')
    op.drop_index(op.f('ix_scheduled_meetings_public_id'), table_name='scheduled_meetings')
    op.drop_index(op.f('ix_scheduled_meetings_organization_id'), table_name='scheduled_meetings')
    op.drop_index(op.f('ix_scheduled_meetings_manage_token'), table_name='scheduled_meetings')
    op.drop_index(op.f('ix_scheduled_meetings_lead_id'), table_name='scheduled_meetings')
    op.drop_index(op.f('ix_scheduled_meetings_is_deleted'), table_name='scheduled_meetings')
    op.drop_index(op.f('ix_scheduled_meetings_id'), table_name='scheduled_meetings')
    op.drop_index(op.f('ix_scheduled_meetings_client_email'), table_name='scheduled_meetings')
    op.drop_index(op.f('ix_scheduled_meetings_calendar_sync_status'), table_name='scheduled_meetings')
    op.drop_index(op.f('ix_scheduled_meetings_booking_page_id'), table_name='scheduled_meetings')
    op.drop_table('scheduled_meetings')
    op.drop_index(op.f('ix_booking_availability_exceptions_organization_id'), table_name='booking_availability_exceptions')
    op.drop_index(op.f('ix_booking_availability_exceptions_is_deleted'), table_name='booking_availability_exceptions')
    op.drop_index(op.f('ix_booking_availability_exceptions_id'), table_name='booking_availability_exceptions')
    op.drop_index(op.f('ix_booking_availability_exceptions_date'), table_name='booking_availability_exceptions')
    op.drop_index(op.f('ix_booking_availability_exceptions_booking_page_id'), table_name='booking_availability_exceptions')
    op.drop_table('booking_availability_exceptions')
    op.drop_index(op.f('ix_google_oauth_connections_user_id'), table_name='google_oauth_connections')
    op.drop_index(op.f('ix_google_oauth_connections_is_deleted'), table_name='google_oauth_connections')
    op.drop_index(op.f('ix_google_oauth_connections_id'), table_name='google_oauth_connections')
    op.drop_table('google_oauth_connections')
    op.drop_index(op.f('ix_booking_pages_user_id'), table_name='booking_pages')
    op.drop_index(op.f('ix_booking_pages_slug'), table_name='booking_pages')
    op.drop_index(op.f('ix_booking_pages_public_id'), table_name='booking_pages')
    op.drop_index(op.f('ix_booking_pages_organization_id'), table_name='booking_pages')
    op.drop_index(op.f('ix_booking_pages_is_deleted'), table_name='booking_pages')
    op.drop_index(op.f('ix_booking_pages_id'), table_name='booking_pages')
    op.drop_table('booking_pages')
