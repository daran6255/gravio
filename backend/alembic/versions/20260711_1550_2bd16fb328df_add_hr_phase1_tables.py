"""add_hr_phase1_tables

Revision ID: 2bd16fb328df
Revises: a2302e10f17b
Create Date: 2026-07-11 15:50:39.198232

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '2bd16fb328df'
down_revision: Union[str, None] = 'a2302e10f17b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- HR Phase 1: Departments ---
    op.create_table('hr_departments',
        sa.Column('public_id', sa.Uuid(), nullable=False),
        sa.Column('name', sa.String(length=150), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('parent_id', sa.Integer(), nullable=True),
        sa.Column('head_user_id', sa.Integer(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('others', sa.JSON(), nullable=True),
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('organization_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['head_user_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id']),
        sa.ForeignKeyConstraint(['parent_id'], ['hr_departments.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_hr_departments_head_user_id'), 'hr_departments', ['head_user_id'], unique=False)
    op.create_index(op.f('ix_hr_departments_id'), 'hr_departments', ['id'], unique=False)
    op.create_index(op.f('ix_hr_departments_is_deleted'), 'hr_departments', ['is_deleted'], unique=False)
    op.create_index(op.f('ix_hr_departments_name'), 'hr_departments', ['name'], unique=False)
    op.create_index(op.f('ix_hr_departments_organization_id'), 'hr_departments', ['organization_id'], unique=False)
    op.create_index(op.f('ix_hr_departments_parent_id'), 'hr_departments', ['parent_id'], unique=False)
    op.create_index(op.f('ix_hr_departments_public_id'), 'hr_departments', ['public_id'], unique=True)

    # --- HR Phase 1: Designations ---
    op.create_table('hr_designations',
        sa.Column('public_id', sa.Uuid(), nullable=False),
        sa.Column('name', sa.String(length=150), nullable=False),
        sa.Column('department_id', sa.Integer(), nullable=True),
        sa.Column('grade', sa.String(length=30), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('others', sa.JSON(), nullable=True),
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('organization_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['department_id'], ['hr_departments.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_hr_designations_department_id'), 'hr_designations', ['department_id'], unique=False)
    op.create_index(op.f('ix_hr_designations_id'), 'hr_designations', ['id'], unique=False)
    op.create_index(op.f('ix_hr_designations_is_deleted'), 'hr_designations', ['is_deleted'], unique=False)
    op.create_index(op.f('ix_hr_designations_name'), 'hr_designations', ['name'], unique=False)
    op.create_index(op.f('ix_hr_designations_organization_id'), 'hr_designations', ['organization_id'], unique=False)
    op.create_index(op.f('ix_hr_designations_public_id'), 'hr_designations', ['public_id'], unique=True)

    # --- HR Phase 1: Employee Profiles ---
    op.create_table('hr_employee_profiles',
        sa.Column('public_id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('employee_id', sa.String(length=50), nullable=True),
        sa.Column('department_id', sa.Integer(), nullable=True),
        sa.Column('designation_id', sa.Integer(), nullable=True),
        sa.Column('employment_type', sa.Enum('full_time', 'part_time', 'contract', 'intern', 'consultant', name='employmenttype'), nullable=False),
        sa.Column('work_location', sa.Enum('onsite', 'remote', 'hybrid', name='worklocation'), nullable=False),
        sa.Column('employee_status', sa.Enum('active', 'on_notice', 'probation', 'resigned', 'terminated', 'on_leave', name='employeestatus'), nullable=False),
        sa.Column('date_of_joining', sa.Date(), nullable=True),
        sa.Column('date_of_leaving', sa.Date(), nullable=True),
        sa.Column('probation_end_date', sa.Date(), nullable=True),
        sa.Column('pan_number', sa.String(length=20), nullable=True),
        sa.Column('aadhaar_number', sa.String(length=20), nullable=True),
        sa.Column('bank_account_number', sa.String(length=40), nullable=True),
        sa.Column('bank_ifsc', sa.String(length=20), nullable=True),
        sa.Column('bank_name', sa.String(length=100), nullable=True),
        sa.Column('emergency_contact', sa.JSON(), nullable=True),
        sa.Column('others', sa.JSON(), nullable=True),
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('organization_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['department_id'], ['hr_departments.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['designation_id'], ['hr_designations.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id']),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_hr_employee_profiles_department_id'), 'hr_employee_profiles', ['department_id'], unique=False)
    op.create_index(op.f('ix_hr_employee_profiles_designation_id'), 'hr_employee_profiles', ['designation_id'], unique=False)
    op.create_index(op.f('ix_hr_employee_profiles_employee_id'), 'hr_employee_profiles', ['employee_id'], unique=False)
    op.create_index(op.f('ix_hr_employee_profiles_employee_status'), 'hr_employee_profiles', ['employee_status'], unique=False)
    op.create_index(op.f('ix_hr_employee_profiles_id'), 'hr_employee_profiles', ['id'], unique=False)
    op.create_index(op.f('ix_hr_employee_profiles_is_deleted'), 'hr_employee_profiles', ['is_deleted'], unique=False)
    op.create_index(op.f('ix_hr_employee_profiles_organization_id'), 'hr_employee_profiles', ['organization_id'], unique=False)
    op.create_index(op.f('ix_hr_employee_profiles_public_id'), 'hr_employee_profiles', ['public_id'], unique=True)
    op.create_index(op.f('ix_hr_employee_profiles_user_id'), 'hr_employee_profiles', ['user_id'], unique=True)

    # --- Add missing index on users.reporting_manager_id ---
    op.create_index(op.f('ix_users_reporting_manager_id'), 'users', ['reporting_manager_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_users_reporting_manager_id'), table_name='users')

    op.drop_index(op.f('ix_hr_employee_profiles_user_id'), table_name='hr_employee_profiles')
    op.drop_index(op.f('ix_hr_employee_profiles_public_id'), table_name='hr_employee_profiles')
    op.drop_index(op.f('ix_hr_employee_profiles_organization_id'), table_name='hr_employee_profiles')
    op.drop_index(op.f('ix_hr_employee_profiles_is_deleted'), table_name='hr_employee_profiles')
    op.drop_index(op.f('ix_hr_employee_profiles_id'), table_name='hr_employee_profiles')
    op.drop_index(op.f('ix_hr_employee_profiles_employee_status'), table_name='hr_employee_profiles')
    op.drop_index(op.f('ix_hr_employee_profiles_employee_id'), table_name='hr_employee_profiles')
    op.drop_index(op.f('ix_hr_employee_profiles_designation_id'), table_name='hr_employee_profiles')
    op.drop_index(op.f('ix_hr_employee_profiles_department_id'), table_name='hr_employee_profiles')
    op.drop_table('hr_employee_profiles')

    op.drop_index(op.f('ix_hr_designations_public_id'), table_name='hr_designations')
    op.drop_index(op.f('ix_hr_designations_organization_id'), table_name='hr_designations')
    op.drop_index(op.f('ix_hr_designations_name'), table_name='hr_designations')
    op.drop_index(op.f('ix_hr_designations_is_deleted'), table_name='hr_designations')
    op.drop_index(op.f('ix_hr_designations_id'), table_name='hr_designations')
    op.drop_index(op.f('ix_hr_designations_department_id'), table_name='hr_designations')
    op.drop_table('hr_designations')

    op.drop_index(op.f('ix_hr_departments_public_id'), table_name='hr_departments')
    op.drop_index(op.f('ix_hr_departments_parent_id'), table_name='hr_departments')
    op.drop_index(op.f('ix_hr_departments_organization_id'), table_name='hr_departments')
    op.drop_index(op.f('ix_hr_departments_name'), table_name='hr_departments')
    op.drop_index(op.f('ix_hr_departments_is_deleted'), table_name='hr_departments')
    op.drop_index(op.f('ix_hr_departments_id'), table_name='hr_departments')
    op.drop_index(op.f('ix_hr_departments_head_user_id'), table_name='hr_departments')
    op.drop_table('hr_departments')

    # Drop enum types
    sa.Enum(name='employeestatus').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='worklocation').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='employmenttype').drop(op.get_bind(), checkfirst=True)
