"""add_crm_reminders_table

Revision ID: f47c1e9a2b06
Revises: e26d2696ba00
Create Date: 2026-07-02 08:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f47c1e9a2b06'
down_revision: Union[str, None] = 'e26d2696ba00'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE notificationtype ADD VALUE IF NOT EXISTS 'reminder_due'")

    op.create_table(
        'crm_reminders',
        sa.Column('public_id', sa.Uuid(), nullable=False),
        sa.Column('entity_type', sa.String(length=50), nullable=False),
        sa.Column('entity_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('created_by_id', sa.Integer(), nullable=True),
        sa.Column('remind_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('message', sa.String(length=500), nullable=True),
        sa.Column('status', sa.Enum(
            'pending', 'sent', 'cancelled',
            name='reminderstatus'
        ), nullable=False, server_default='pending'),
        sa.Column('sent_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('organization_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['created_by_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_crm_reminders_entity_id'), 'crm_reminders', ['entity_id'], unique=False)
    op.create_index(op.f('ix_crm_reminders_id'), 'crm_reminders', ['id'], unique=False)
    op.create_index(op.f('ix_crm_reminders_is_deleted'), 'crm_reminders', ['is_deleted'], unique=False)
    op.create_index(op.f('ix_crm_reminders_organization_id'), 'crm_reminders', ['organization_id'], unique=False)
    op.create_index(op.f('ix_crm_reminders_public_id'), 'crm_reminders', ['public_id'], unique=True)
    op.create_index(op.f('ix_crm_reminders_remind_at'), 'crm_reminders', ['remind_at'], unique=False)
    op.create_index(op.f('ix_crm_reminders_status'), 'crm_reminders', ['status'], unique=False)
    op.create_index(op.f('ix_crm_reminders_user_id'), 'crm_reminders', ['user_id'], unique=False)
    op.create_index('ix_crm_reminders_status_remind_at', 'crm_reminders', ['status', 'remind_at'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_crm_reminders_status_remind_at', table_name='crm_reminders')
    op.drop_index(op.f('ix_crm_reminders_user_id'), table_name='crm_reminders')
    op.drop_index(op.f('ix_crm_reminders_status'), table_name='crm_reminders')
    op.drop_index(op.f('ix_crm_reminders_remind_at'), table_name='crm_reminders')
    op.drop_index(op.f('ix_crm_reminders_public_id'), table_name='crm_reminders')
    op.drop_index(op.f('ix_crm_reminders_organization_id'), table_name='crm_reminders')
    op.drop_index(op.f('ix_crm_reminders_is_deleted'), table_name='crm_reminders')
    op.drop_index(op.f('ix_crm_reminders_id'), table_name='crm_reminders')
    op.drop_index(op.f('ix_crm_reminders_entity_id'), table_name='crm_reminders')
    op.drop_table('crm_reminders')
    op.execute("DROP TYPE IF EXISTS reminderstatus")
    # Postgres has no DROP VALUE for enums; removing 'reminder_due' from
    # notificationtype would require rebuilding the type — not worth the risk.
