"""add_crm_deal_tasks_table

Revision ID: a9f3c2e7b814
Revises: 3669d0c1c543
Create Date: 2026-06-28 20:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a9f3c2e7b814'
down_revision: Union[str, None] = '791044fd392c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add new notification types to the enum
    op.execute("ALTER TYPE notificationtype ADD VALUE IF NOT EXISTS 'deal_task_assigned'")
    op.execute("ALTER TYPE notificationtype ADD VALUE IF NOT EXISTS 'deal_task_due_soon'")
    op.execute("ALTER TYPE notificationtype ADD VALUE IF NOT EXISTS 'deal_task_overdue'")
    op.execute("ALTER TYPE notificationtype ADD VALUE IF NOT EXISTS 'deal_task_completed'")

    op.create_table(
        'crm_deal_tasks',
        sa.Column('public_id', sa.Uuid(), nullable=False),
        sa.Column('deal_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('task_type', sa.Enum(
            'document', 'meeting', 'call', 'action', 'review', 'other',
            name='dealtasktype'
        ), nullable=False),
        sa.Column('status', sa.Enum(
            'pending', 'in_progress', 'completed',
            name='dealtaskstatus'
        ), nullable=False, server_default='pending'),
        sa.Column('due_date', sa.Date(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('assignee_id', sa.Integer(), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('organization_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['assignee_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['deal_id'], ['crm_deals.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_crm_deal_tasks_assignee_id'), 'crm_deal_tasks', ['assignee_id'], unique=False)
    op.create_index(op.f('ix_crm_deal_tasks_deal_id'), 'crm_deal_tasks', ['deal_id'], unique=False)
    op.create_index(op.f('ix_crm_deal_tasks_id'), 'crm_deal_tasks', ['id'], unique=False)
    op.create_index(op.f('ix_crm_deal_tasks_is_deleted'), 'crm_deal_tasks', ['is_deleted'], unique=False)
    op.create_index(op.f('ix_crm_deal_tasks_organization_id'), 'crm_deal_tasks', ['organization_id'], unique=False)
    op.create_index(op.f('ix_crm_deal_tasks_public_id'), 'crm_deal_tasks', ['public_id'], unique=True)


def downgrade() -> None:
    op.drop_index(op.f('ix_crm_deal_tasks_public_id'), table_name='crm_deal_tasks')
    op.drop_index(op.f('ix_crm_deal_tasks_organization_id'), table_name='crm_deal_tasks')
    op.drop_index(op.f('ix_crm_deal_tasks_is_deleted'), table_name='crm_deal_tasks')
    op.drop_index(op.f('ix_crm_deal_tasks_id'), table_name='crm_deal_tasks')
    op.drop_index(op.f('ix_crm_deal_tasks_deal_id'), table_name='crm_deal_tasks')
    op.drop_index(op.f('ix_crm_deal_tasks_assignee_id'), table_name='crm_deal_tasks')
    op.drop_table('crm_deal_tasks')
    op.execute("DROP TYPE IF EXISTS dealtasktype")
    op.execute("DROP TYPE IF EXISTS dealtaskstatus")

