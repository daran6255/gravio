"""add_timesheet_week_unlock_requests

Revision ID: a2302e10f17b
Revises: f48689894aaa
Create Date: 2026-07-10 19:28:04.967501

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a2302e10f17b'
down_revision: Union[str, None] = 'f48689894aaa'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)

    if 'timesheet_week_unlock_requests' not in inspector.get_table_names():
        op.create_table(
            'timesheet_week_unlock_requests',
            sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
            sa.Column('public_id', sa.Uuid(), nullable=False),
            sa.Column('organization_id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('week_start_date', sa.Date(), nullable=False),
            sa.Column('week_end_date', sa.Date(), nullable=False),
            sa.Column('status', sa.Enum('pending', 'approved', 'denied', name='weekunlockstatus'), nullable=False),
            sa.Column('reason', sa.Text(), nullable=True),
            sa.Column('resolved_by_id', sa.Integer(), nullable=True),
            sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
            sa.Column('resolution_note', sa.Text(), nullable=True),
            sa.Column('consumed_at', sa.DateTime(timezone=True), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('is_deleted', sa.Boolean(), server_default=sa.text('false'), nullable=False),
            sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
            sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], ),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['resolved_by_id'], ['users.id'], ondelete='SET NULL'),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('public_id')
        )
        op.create_index('ix_timesheet_week_unlock_requests_id', 'timesheet_week_unlock_requests', ['id'], unique=False)
        op.create_index('ix_timesheet_week_unlock_requests_public_id', 'timesheet_week_unlock_requests', ['public_id'], unique=False)
        op.create_index('ix_timesheet_week_unlock_requests_user_id', 'timesheet_week_unlock_requests', ['user_id'], unique=False)
        op.create_index('ix_timesheet_week_unlock_requests_week_start_date', 'timesheet_week_unlock_requests', ['week_start_date'], unique=False)
        op.create_index('ix_timesheet_week_unlock_requests_status', 'timesheet_week_unlock_requests', ['status'], unique=False)


def downgrade() -> None:
    op.drop_table('timesheet_week_unlock_requests')
    op.execute('DROP TYPE IF EXISTS weekunlockstatus')
