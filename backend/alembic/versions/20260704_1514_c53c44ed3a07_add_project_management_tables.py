"""add_project_management_tables

Revision ID: c53c44ed3a07
Revises: b7c9d1e2f3a4
Create Date: 2026-07-04 15:14:42.395081

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'c53c44ed3a07'
down_revision: Union[str, None] = 'b7c9d1e2f3a4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # project_task_statuses first: project_tasks.status_id references it.
    op.create_table('project_task_statuses',
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('order', sa.Integer(), nullable=False),
        sa.Column('color', sa.String(length=20), nullable=False),
        sa.Column('is_initial_status', sa.Boolean(), nullable=False),
        sa.Column('is_done_status', sa.Boolean(), nullable=False),
        sa.Column('custom_fields', sa.JSON(), nullable=True),
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('organization_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_project_task_statuses_id'), 'project_task_statuses', ['id'], unique=False)
    op.create_index(op.f('ix_project_task_statuses_is_deleted'), 'project_task_statuses', ['is_deleted'], unique=False)
    op.create_index(op.f('ix_project_task_statuses_organization_id'), 'project_task_statuses', ['organization_id'], unique=False)

    # projects: deal_id references the already-existing crm_deals table.
    op.create_table('projects',
        sa.Column('public_id', sa.Uuid(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('status', sa.Enum('planning', 'active', 'on_hold', 'completed', 'archived', name='projectstatus'), nullable=False),
        sa.Column('owner_id', sa.Integer(), nullable=True),
        sa.Column('company_id', sa.Integer(), nullable=True),
        sa.Column('deal_id', sa.Integer(), nullable=True),
        sa.Column('start_date', sa.Date(), nullable=True),
        sa.Column('end_date', sa.Date(), nullable=True),
        sa.Column('budget', sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column('currency', sa.String(length=10), nullable=False),
        sa.Column('tags', sa.JSON(), nullable=True),
        sa.Column('custom_fields', sa.JSON(), nullable=True),
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('organization_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['company_id'], ['crm_companies.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['deal_id'], ['crm_deals.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], ),
        sa.ForeignKeyConstraint(['owner_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_projects_company_id'), 'projects', ['company_id'], unique=False)
    op.create_index(op.f('ix_projects_deal_id'), 'projects', ['deal_id'], unique=False)
    op.create_index(op.f('ix_projects_id'), 'projects', ['id'], unique=False)
    op.create_index(op.f('ix_projects_is_deleted'), 'projects', ['is_deleted'], unique=False)
    op.create_index(op.f('ix_projects_organization_id'), 'projects', ['organization_id'], unique=False)
    op.create_index(op.f('ix_projects_owner_id'), 'projects', ['owner_id'], unique=False)
    op.create_index(op.f('ix_projects_public_id'), 'projects', ['public_id'], unique=True)

    # project_tasks: self-referential parent_task_id (sub-tasks), references projects + project_task_statuses.
    op.create_table('project_tasks',
        sa.Column('public_id', sa.Uuid(), nullable=False),
        sa.Column('project_id', sa.Integer(), nullable=False),
        sa.Column('parent_task_id', sa.Integer(), nullable=True),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('status_id', sa.Integer(), nullable=False),
        # Reuses the existing leadpriority enum type (already created by earlier
        # migrations) — Postgres enum types aren't tied to one table. Uses
        # postgresql.ENUM (not sa.Enum) with create_type=False, since sa.Enum does
        # not reliably suppress the implicit CREATE TYPE inside op.create_table().
        sa.Column('priority', postgresql.ENUM(
            'low', 'medium', 'high', 'urgent',
            name='leadpriority', create_type=False
        ), nullable=False, server_default='medium'),
        sa.Column('assignee_id', sa.Integer(), nullable=True),
        sa.Column('due_date', sa.Date(), nullable=True),
        sa.Column('start_date', sa.Date(), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('order', sa.Integer(), nullable=False),
        sa.Column('estimated_hours', sa.Numeric(precision=6, scale=2), nullable=True),
        sa.Column('actual_hours', sa.Numeric(precision=6, scale=2), nullable=True),
        sa.Column('billing_type', sa.Enum('billable', 'non_billable', name='billingtype'), nullable=False),
        sa.Column('tags', sa.JSON(), nullable=True),
        sa.Column('custom_fields', sa.JSON(), nullable=True),
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('organization_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['assignee_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], ),
        sa.ForeignKeyConstraint(['parent_task_id'], ['project_tasks.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['status_id'], ['project_task_statuses.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_project_tasks_assignee_id'), 'project_tasks', ['assignee_id'], unique=False)
    op.create_index(op.f('ix_project_tasks_id'), 'project_tasks', ['id'], unique=False)
    op.create_index(op.f('ix_project_tasks_is_deleted'), 'project_tasks', ['is_deleted'], unique=False)
    op.create_index(op.f('ix_project_tasks_organization_id'), 'project_tasks', ['organization_id'], unique=False)
    op.create_index(op.f('ix_project_tasks_parent_task_id'), 'project_tasks', ['parent_task_id'], unique=False)
    op.create_index(op.f('ix_project_tasks_project_id'), 'project_tasks', ['project_id'], unique=False)
    op.create_index(op.f('ix_project_tasks_public_id'), 'project_tasks', ['public_id'], unique=True)
    op.create_index(op.f('ix_project_tasks_status_id'), 'project_tasks', ['status_id'], unique=False)

    # Reverse-reference: the Project this Won deal was converted into.
    op.add_column('crm_deals', sa.Column('project_id', sa.Integer(), nullable=True))
    op.create_index(op.f('ix_crm_deals_project_id'), 'crm_deals', ['project_id'], unique=False)
    op.create_foreign_key('fk_crm_deals_project_id', 'crm_deals', 'projects', ['project_id'], ['id'], ondelete='SET NULL')


def downgrade() -> None:
    op.drop_constraint('fk_crm_deals_project_id', 'crm_deals', type_='foreignkey')
    op.drop_index(op.f('ix_crm_deals_project_id'), table_name='crm_deals')
    op.drop_column('crm_deals', 'project_id')

    op.drop_index(op.f('ix_project_tasks_status_id'), table_name='project_tasks')
    op.drop_index(op.f('ix_project_tasks_public_id'), table_name='project_tasks')
    op.drop_index(op.f('ix_project_tasks_project_id'), table_name='project_tasks')
    op.drop_index(op.f('ix_project_tasks_parent_task_id'), table_name='project_tasks')
    op.drop_index(op.f('ix_project_tasks_organization_id'), table_name='project_tasks')
    op.drop_index(op.f('ix_project_tasks_is_deleted'), table_name='project_tasks')
    op.drop_index(op.f('ix_project_tasks_id'), table_name='project_tasks')
    op.drop_index(op.f('ix_project_tasks_assignee_id'), table_name='project_tasks')
    op.drop_table('project_tasks')

    op.drop_index(op.f('ix_projects_public_id'), table_name='projects')
    op.drop_index(op.f('ix_projects_owner_id'), table_name='projects')
    op.drop_index(op.f('ix_projects_organization_id'), table_name='projects')
    op.drop_index(op.f('ix_projects_is_deleted'), table_name='projects')
    op.drop_index(op.f('ix_projects_id'), table_name='projects')
    op.drop_index(op.f('ix_projects_deal_id'), table_name='projects')
    op.drop_index(op.f('ix_projects_company_id'), table_name='projects')
    op.drop_table('projects')

    op.drop_index(op.f('ix_project_task_statuses_organization_id'), table_name='project_task_statuses')
    op.drop_index(op.f('ix_project_task_statuses_is_deleted'), table_name='project_task_statuses')
    op.drop_index(op.f('ix_project_task_statuses_id'), table_name='project_task_statuses')
    op.drop_table('project_task_statuses')

    # billingtype/projectstatus are wholly new enum types introduced by this
    # migration (no other table uses them), so drop them on downgrade. Not
    # dropping leadpriority here — it's shared with crm_deal_tasks/crm_lead_tasks,
    # so downgrading this migration must not remove a type other tables depend on.
    op.execute("DROP TYPE IF EXISTS billingtype")
    op.execute("DROP TYPE IF EXISTS projectstatus")
