"""add_timesheet_tables

Revision ID: e53a258a1c9b
Revises: b2f8295a0c6a
Create Date: 2026-07-06 14:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'e53a258a1c9b'
down_revision: Union[str, None] = 'b2f8295a0c6a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create Enums if they do not exist
    # PostgreSQL ENUMs are created globally.
    conn = op.get_bind()
    
    # 2. Add reporting_manager_id to users
    inspector = sa.inspect(conn)
    columns_users = [col['name'] for col in inspector.get_columns('users')]
    if 'reporting_manager_id' not in columns_users:
        op.add_column('users', sa.Column('reporting_manager_id', sa.Integer(), nullable=True))
        op.create_foreign_key(
            'fk_users_reporting_manager',
            'users', 'users',
            ['reporting_manager_id'], ['id'],
            ondelete='SET NULL'
        )

    # 3. Create user_timesheet_categories
    if 'user_timesheet_categories' not in inspector.get_table_names():
        op.create_table('user_timesheet_categories',
            sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
            sa.Column('organization_id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=True),
            sa.Column('name', sa.String(length=100), nullable=False),
            sa.Column('color', sa.String(length=20), nullable=True),
            sa.Column('is_org_default', sa.Boolean(), server_default=sa.text('false'), nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('is_deleted', sa.Boolean(), server_default=sa.text('false'), nullable=False),
            sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
            sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], ),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index('ix_user_timesheet_categories_id', 'user_timesheet_categories', ['id'], unique=False)

    # 4. Create org_holidays
    if 'org_holidays' not in inspector.get_table_names():
        op.create_table('org_holidays',
            sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
            sa.Column('public_id', sa.Uuid(), nullable=False),
            sa.Column('organization_id', sa.Integer(), nullable=False),
            sa.Column('name', sa.String(length=100), nullable=False),
            sa.Column('holiday_date', sa.Date(), nullable=False),
            sa.Column('type', sa.Enum('public', 'org', 'custom', name='holidaytype'), nullable=False),
            sa.Column('country_code', sa.String(length=5), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('is_deleted', sa.Boolean(), server_default=sa.text('false'), nullable=False),
            sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
            sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], ),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('public_id')
        )
        op.create_index('ix_org_holidays_id', 'org_holidays', ['id'], unique=False)

    # 5. Create timesheet_user_settings
    if 'timesheet_user_settings' not in inspector.get_table_names():
        op.create_table('timesheet_user_settings',
            sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
            sa.Column('organization_id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('can_log_on_holidays', sa.Boolean(), server_default=sa.text('false'), nullable=False),
            sa.Column('max_retroactive_days', sa.Integer(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('is_deleted', sa.Boolean(), server_default=sa.text('false'), nullable=False),
            sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
            sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], ),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('user_id')
        )
        op.create_index('ix_timesheet_user_settings_id', 'timesheet_user_settings', ['id'], unique=False)

    # 6. Create project_time_logs
    if 'project_time_logs' not in inspector.get_table_names():
        op.create_table('project_time_logs',
            sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
            sa.Column('public_id', sa.Uuid(), nullable=False),
            sa.Column('organization_id', sa.Integer(), nullable=False),
            sa.Column('project_id', sa.Integer(), nullable=True),
            sa.Column('task_id', sa.Integer(), nullable=True),
            sa.Column('category_id', sa.Integer(), nullable=True),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('log_date', sa.Date(), nullable=False),
            sa.Column('hours', sa.Numeric(precision=5, scale=2), nullable=False),
            sa.Column('notes', sa.Text(), nullable=True),
            sa.Column('billing_type', sa.Enum('billable', 'non_billable', name='timesheetbillingtype'), nullable=False),
            sa.Column('status', sa.Enum('draft', 'submitted', 'approved', 'rejected', name='timesheetstatus'), nullable=False),
            sa.Column('rejection_note', sa.Text(), nullable=True),
            sa.Column('approved_by_id', sa.Integer(), nullable=True),
            sa.Column('approved_at', sa.DateTime(timezone=True), nullable=True),
            sa.Column('is_holiday_override', sa.Boolean(), server_default=sa.text('false'), nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('is_deleted', sa.Boolean(), server_default=sa.text('false'), nullable=False),
            sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
            sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], ),
            sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='SET NULL'),
            sa.ForeignKeyConstraint(['task_id'], ['project_tasks.id'], ondelete='SET NULL'),
            sa.ForeignKeyConstraint(['category_id'], ['user_timesheet_categories.id'], ondelete='SET NULL'),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['approved_by_id'], ['users.id'], ondelete='SET NULL'),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('public_id')
        )
        op.create_index('ix_project_time_logs_id', 'project_time_logs', ['id'], unique=False)


def downgrade() -> None:
    # Drops in reverse order
    op.drop_table('project_time_logs')
    op.drop_table('timesheet_user_settings')
    op.drop_table('org_holidays')
    op.drop_table('user_timesheet_categories')
    op.drop_constraint('fk_users_reporting_manager', 'users', type_='foreignkey')
    op.drop_column('users', 'reporting_manager_id')
    
    # Optional: drop enums
    op.execute('DROP TYPE IF EXISTS holidaytype')
    op.execute('DROP TYPE IF EXISTS timesheetbillingtype')
    op.execute('DROP TYPE IF EXISTS timesheetstatus')
