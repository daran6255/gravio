"""host availability booking (public self-service scheduling)

Revision ID: 25e1467a9c87
Revises: 89f1b5343bb2
Create Date: 2026-07-25 09:00:00.000000

Adds the public "book a slot with me" self-service booking flow: a host
publishes a weekly availability schedule (host_availability_rules) behind a
revocable share link (host_availability_settings.share_token), and a client
picks an open slot themselves without an account.

Deliberately leaner than the BookingPage/Google-Calendar-sync concept an
earlier migration (4c0b01681feb) removed: just weekly recurring rules and a
share link, reusing the existing create_meeting flow for the actual booking --
no calendar-provider sync, no per-date exceptions table.
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '25e1467a9c87'
down_revision: Union[str, None] = '89f1b5343bb2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# create_type=False -- this Postgres enum type already exists (created by
# 4c0b01681feb for scheduled_meetings.location_type); reusing it here must not
# try to CREATE TYPE a second time.
meeting_location_type = postgresql.ENUM('google_meet', 'offline', 'phone', name='meetinglocationtype', create_type=False)


def upgrade() -> None:
    op.create_table(
        'host_availability_settings',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('organization_id', sa.Integer(), sa.ForeignKey('organizations.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, unique=True),
        sa.Column('is_enabled', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('share_token', sa.Uuid(), nullable=True),
        sa.Column('meeting_type_name', sa.String(length=150), nullable=False, server_default='Meeting'),
        sa.Column('duration_minutes', sa.Integer(), nullable=False, server_default='30'),
        sa.Column('buffer_minutes', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('min_notice_hours', sa.Integer(), nullable=False, server_default='4'),
        sa.Column('booking_window_days', sa.Integer(), nullable=False, server_default='30'),
        sa.Column('timezone', sa.String(length=64), nullable=False),
        sa.Column('location_type', meeting_location_type, nullable=False, server_default='google_meet'),
        sa.Column('location_detail', sa.String(length=500), nullable=True),
    )
    op.create_index(op.f('ix_host_availability_settings_organization_id'), 'host_availability_settings', ['organization_id'])
    op.create_index(op.f('ix_host_availability_settings_user_id'), 'host_availability_settings', ['user_id'], unique=True)
    op.create_index(op.f('ix_host_availability_settings_share_token'), 'host_availability_settings', ['share_token'], unique=True)

    op.create_table(
        'host_availability_rules',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('organization_id', sa.Integer(), sa.ForeignKey('organizations.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('settings_id', sa.Integer(), sa.ForeignKey('host_availability_settings.id', ondelete='CASCADE'), nullable=False),
        sa.Column('weekday', sa.Integer(), nullable=False),
        sa.Column('start_time', sa.Time(), nullable=False),
        sa.Column('end_time', sa.Time(), nullable=False),
    )
    op.create_index(op.f('ix_host_availability_rules_organization_id'), 'host_availability_rules', ['organization_id'])
    op.create_index(op.f('ix_host_availability_rules_user_id'), 'host_availability_rules', ['user_id'])
    op.create_index(op.f('ix_host_availability_rules_settings_id'), 'host_availability_rules', ['settings_id'])


def downgrade() -> None:
    op.drop_index(op.f('ix_host_availability_rules_settings_id'), table_name='host_availability_rules')
    op.drop_index(op.f('ix_host_availability_rules_user_id'), table_name='host_availability_rules')
    op.drop_index(op.f('ix_host_availability_rules_organization_id'), table_name='host_availability_rules')
    op.drop_table('host_availability_rules')

    op.drop_index(op.f('ix_host_availability_settings_share_token'), table_name='host_availability_settings')
    op.drop_index(op.f('ix_host_availability_settings_user_id'), table_name='host_availability_settings')
    op.drop_index(op.f('ix_host_availability_settings_organization_id'), table_name='host_availability_settings')
    op.drop_table('host_availability_settings')
