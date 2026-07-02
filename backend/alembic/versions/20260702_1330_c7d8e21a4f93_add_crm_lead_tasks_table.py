"""add_crm_lead_tasks_table

Revision ID: c7d8e21a4f93
Revises: f47c1e9a2b06
Create Date: 2026-07-02 13:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'c7d8e21a4f93'
down_revision: Union[str, None] = 'f47c1e9a2b06'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'crm_lead_tasks',
        sa.Column('public_id', sa.Uuid(), nullable=False),
        sa.Column('lead_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        # Reuses the existing dealtasktype/dealtaskstatus/leadpriority enum types (already
        # created by earlier migrations) — Postgres enum types aren't tied to one table.
        # Uses postgresql.ENUM (not sa.Enum) with create_type=False, since sa.Enum does
        # not reliably suppress the implicit CREATE TYPE inside op.create_table().
        sa.Column('task_type', postgresql.ENUM(
            'document', 'meeting', 'call', 'action', 'review', 'other',
            name='dealtasktype', create_type=False
        ), nullable=False),
        sa.Column('status', postgresql.ENUM(
            'pending', 'in_progress', 'blocked', 'completed',
            name='dealtaskstatus', create_type=False
        ), nullable=False, server_default='pending'),
        sa.Column('due_date', sa.Date(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('assignee_id', sa.Integer(), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('priority', postgresql.ENUM(
            'low', 'medium', 'high', 'urgent',
            name='leadpriority', create_type=False
        ), nullable=False, server_default='medium'),
        sa.Column('order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('organization_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['assignee_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['lead_id'], ['crm_leads.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_crm_lead_tasks_assignee_id'), 'crm_lead_tasks', ['assignee_id'], unique=False)
    op.create_index(op.f('ix_crm_lead_tasks_lead_id'), 'crm_lead_tasks', ['lead_id'], unique=False)
    op.create_index(op.f('ix_crm_lead_tasks_id'), 'crm_lead_tasks', ['id'], unique=False)
    op.create_index(op.f('ix_crm_lead_tasks_is_deleted'), 'crm_lead_tasks', ['is_deleted'], unique=False)
    op.create_index(op.f('ix_crm_lead_tasks_organization_id'), 'crm_lead_tasks', ['organization_id'], unique=False)
    op.create_index(op.f('ix_crm_lead_tasks_public_id'), 'crm_lead_tasks', ['public_id'], unique=True)


def downgrade() -> None:
    op.drop_index(op.f('ix_crm_lead_tasks_public_id'), table_name='crm_lead_tasks')
    op.drop_index(op.f('ix_crm_lead_tasks_organization_id'), table_name='crm_lead_tasks')
    op.drop_index(op.f('ix_crm_lead_tasks_is_deleted'), table_name='crm_lead_tasks')
    op.drop_index(op.f('ix_crm_lead_tasks_id'), table_name='crm_lead_tasks')
    op.drop_index(op.f('ix_crm_lead_tasks_lead_id'), table_name='crm_lead_tasks')
    op.drop_index(op.f('ix_crm_lead_tasks_assignee_id'), table_name='crm_lead_tasks')
    op.drop_table('crm_lead_tasks')
    # Not dropping dealtasktype/dealtaskstatus/leadpriority enum types here — they're
    # shared with crm_deal_tasks and other tables, so downgrading this migration must
    # not remove types other tables still depend on.
