"""add_hr_leave_management_tables

Revision ID: 1ff850054cd0
Revises: 2bd16fb328df
Create Date: 2026-07-11 17:34:31.667004

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '1ff850054cd0'
down_revision: Union[str, None] = '2bd16fb328df'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- HR Leave Types ---
    op.create_table('hr_leave_types',
        sa.Column('public_id', sa.Uuid(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('code', sa.String(length=20), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('default_allocation', sa.Float(), nullable=False),
        sa.Column('is_carry_forward', sa.Boolean(), nullable=False),
        sa.Column('max_carry_forward', sa.Float(), nullable=False),
        sa.Column('is_lop', sa.Boolean(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('others', sa.JSON(), nullable=True),
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('organization_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_hr_leave_types_code'), 'hr_leave_types', ['code'], unique=False)
    op.create_index(op.f('ix_hr_leave_types_id'), 'hr_leave_types', ['id'], unique=False)
    op.create_index(op.f('ix_hr_leave_types_is_deleted'), 'hr_leave_types', ['is_deleted'], unique=False)
    op.create_index(op.f('ix_hr_leave_types_organization_id'), 'hr_leave_types', ['organization_id'], unique=False)
    op.create_index(op.f('ix_hr_leave_types_public_id'), 'hr_leave_types', ['public_id'], unique=True)

    # --- HR Leave Balances ---
    op.create_table('hr_leave_balances',
        sa.Column('public_id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('leave_type_id', sa.Integer(), nullable=False),
        sa.Column('year', sa.Integer(), nullable=False),
        sa.Column('allocated', sa.Float(), nullable=False),
        sa.Column('used', sa.Float(), nullable=False),
        sa.Column('pending', sa.Float(), nullable=False),
        sa.Column('others', sa.JSON(), nullable=True),
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('organization_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['leave_type_id'], ['hr_leave_types.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id']),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_hr_leave_balances_id'), 'hr_leave_balances', ['id'], unique=False)
    op.create_index(op.f('ix_hr_leave_balances_is_deleted'), 'hr_leave_balances', ['is_deleted'], unique=False)
    op.create_index(op.f('ix_hr_leave_balances_leave_type_id'), 'hr_leave_balances', ['leave_type_id'], unique=False)
    op.create_index(op.f('ix_hr_leave_balances_organization_id'), 'hr_leave_balances', ['organization_id'], unique=False)
    op.create_index(op.f('ix_hr_leave_balances_public_id'), 'hr_leave_balances', ['public_id'], unique=True)
    op.create_index(op.f('ix_hr_leave_balances_user_id'), 'hr_leave_balances', ['user_id'], unique=False)
    op.create_index(op.f('ix_hr_leave_balances_year'), 'hr_leave_balances', ['year'], unique=False)

    # --- HR Leave Requests ---
    op.create_table('hr_leave_requests',
        sa.Column('public_id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('leave_type_id', sa.Integer(), nullable=False),
        sa.Column('from_date', sa.Date(), nullable=False),
        sa.Column('to_date', sa.Date(), nullable=False),
        sa.Column('is_half_day', sa.Boolean(), nullable=False),
        sa.Column('half_day_session', sa.String(length=10), nullable=True),
        sa.Column('total_days', sa.Float(), nullable=False),
        sa.Column('status', sa.Enum('pending', 'approved', 'rejected', 'cancelled', name='leavestatus'), nullable=False),
        sa.Column('reason', sa.Text(), nullable=True),
        sa.Column('approved_by_id', sa.Integer(), nullable=True),
        sa.Column('approved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('manager_notes', sa.Text(), nullable=True),
        sa.Column('others', sa.JSON(), nullable=True),
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('organization_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['approved_by_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['leave_type_id'], ['hr_leave_types.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id']),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_hr_leave_requests_approved_by_id'), 'hr_leave_requests', ['approved_by_id'], unique=False)
    op.create_index(op.f('ix_hr_leave_requests_from_date'), 'hr_leave_requests', ['from_date'], unique=False)
    op.create_index(op.f('ix_hr_leave_requests_id'), 'hr_leave_requests', ['id'], unique=False)
    op.create_index(op.f('ix_hr_leave_requests_is_deleted'), 'hr_leave_requests', ['is_deleted'], unique=False)
    op.create_index(op.f('ix_hr_leave_requests_leave_type_id'), 'hr_leave_requests', ['leave_type_id'], unique=False)
    op.create_index(op.f('ix_hr_leave_requests_organization_id'), 'hr_leave_requests', ['organization_id'], unique=False)
    op.create_index(op.f('ix_hr_leave_requests_public_id'), 'hr_leave_requests', ['public_id'], unique=True)
    op.create_index(op.f('ix_hr_leave_requests_status'), 'hr_leave_requests', ['status'], unique=False)
    op.create_index(op.f('ix_hr_leave_requests_to_date'), 'hr_leave_requests', ['to_date'], unique=False)
    op.create_index(op.f('ix_hr_leave_requests_user_id'), 'hr_leave_requests', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_hr_leave_requests_user_id'), table_name='hr_leave_requests')
    op.drop_index(op.f('ix_hr_leave_requests_to_date'), table_name='hr_leave_requests')
    op.drop_index(op.f('ix_hr_leave_requests_status'), table_name='hr_leave_requests')
    op.drop_index(op.f('ix_hr_leave_requests_public_id'), table_name='hr_leave_requests')
    op.drop_index(op.f('ix_hr_leave_requests_organization_id'), table_name='hr_leave_requests')
    op.drop_index(op.f('ix_hr_leave_requests_leave_type_id'), table_name='hr_leave_requests')
    op.drop_index(op.f('ix_hr_leave_requests_is_deleted'), table_name='hr_leave_requests')
    op.drop_index(op.f('ix_hr_leave_requests_id'), table_name='hr_leave_requests')
    op.drop_index(op.f('ix_hr_leave_requests_from_date'), table_name='hr_leave_requests')
    op.drop_index(op.f('ix_hr_leave_requests_approved_by_id'), table_name='hr_leave_requests')
    op.drop_table('hr_leave_requests')

    op.drop_index(op.f('ix_hr_leave_balances_year'), table_name='hr_leave_balances')
    op.drop_index(op.f('ix_hr_leave_balances_user_id'), table_name='hr_leave_balances')
    op.drop_index(op.f('ix_hr_leave_balances_public_id'), table_name='hr_leave_balances')
    op.drop_index(op.f('ix_hr_leave_balances_organization_id'), table_name='hr_leave_balances')
    op.drop_index(op.f('ix_hr_leave_balances_leave_type_id'), table_name='hr_leave_balances')
    op.drop_index(op.f('ix_hr_leave_balances_is_deleted'), table_name='hr_leave_balances')
    op.drop_index(op.f('ix_hr_leave_balances_id'), table_name='hr_leave_balances')
    op.drop_table('hr_leave_balances')

    op.drop_index(op.f('ix_hr_leave_types_public_id'), table_name='hr_leave_types')
    op.drop_index(op.f('ix_hr_leave_types_organization_id'), table_name='hr_leave_types')
    op.drop_index(op.f('ix_hr_leave_types_is_deleted'), table_name='hr_leave_types')
    op.drop_index(op.f('ix_hr_leave_types_id'), table_name='hr_leave_types')
    op.drop_index(op.f('ix_hr_leave_types_code'), table_name='hr_leave_types')
    op.drop_table('hr_leave_types')

    # Drop enum type
    sa.Enum(name='leavestatus').drop(op.get_bind(), checkfirst=True)
