"""ai_credits_wallet_and_ledger

Revision ID: c22e081cd0ae
Revises: a3f1c9d82e75
Create Date: 2026-07-20 20:24:42.164436

Replaces the flat-count ai_usage_counters/plans.ai_monthly_limit scaffold with token-weighted
AI credit accounting: a per-org wallet balance plus an append-only transaction ledger.

Note: autogenerate also picked up a large amount of pre-existing, unrelated schema drift
(server defaults, indexes, and constraints on crm_deal_tasks, crm_lead_tasks, crm_leads,
crm_reminders, currency_rates, org_holidays, project_tasks, project_time_logs,
timesheet_user_settings, timesheet_week_unlock_requests, user_timesheet_categories, and
crm_contacts) that has nothing to do with AI credits. That drift was deliberately excluded
from this migration and should be addressed separately.
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'c22e081cd0ae'
down_revision: Union[str, None] = 'a3f1c9d82e75'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── plans.ai_monthly_limit -> ai_credits_monthly ────────────────────────────
    op.add_column('plans', sa.Column('ai_credits_monthly', sa.Integer(), nullable=True))
    op.execute("UPDATE plans SET ai_credits_monthly = ai_monthly_limit")
    op.alter_column('plans', 'ai_credits_monthly', nullable=False)
    op.drop_column('plans', 'ai_monthly_limit')

    # ── ai_credit_wallets ────────────────────────────────────────────────────────
    op.create_table(
        'ai_credit_wallets',
        sa.Column('organization_id', sa.Integer(), nullable=False),
        sa.Column('period_start', sa.DateTime(timezone=True), nullable=False),
        sa.Column('balance', sa.Integer(), nullable=False),
        sa.Column('granted', sa.Integer(), nullable=False),
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('organization_id', name='uq_ai_credit_wallet_org'),
    )
    op.create_index(op.f('ix_ai_credit_wallets_id'), 'ai_credit_wallets', ['id'], unique=False)
    op.create_index(op.f('ix_ai_credit_wallets_is_deleted'), 'ai_credit_wallets', ['is_deleted'], unique=False)
    op.create_index(op.f('ix_ai_credit_wallets_organization_id'), 'ai_credit_wallets', ['organization_id'], unique=False)

    # ── ai_credit_transactions ───────────────────────────────────────────────────
    op.create_table(
        'ai_credit_transactions',
        sa.Column('organization_id', sa.Integer(), nullable=False),
        sa.Column('wallet_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True, comment='Who triggered this call (null for system-generated grants)'),
        sa.Column('amount', sa.Integer(), nullable=False, comment='Negative for consumption, positive for grants/admin credits'),
        sa.Column('balance_after', sa.Integer(), nullable=False),
        sa.Column('reason', sa.Enum('monthly_grant', 'ai_call', 'admin_adjustment', name='aicredittransactionreason'), nullable=False),
        sa.Column('provider', sa.String(length=50), nullable=True),
        sa.Column('model', sa.String(length=100), nullable=True),
        sa.Column('action_type', sa.String(length=50), nullable=True, comment="e.g. 'chat_message', 'jd_extraction', 'candidate_extraction'"),
        sa.Column('tokens_used', sa.Integer(), nullable=True),
        sa.Column('is_estimated', sa.Boolean(), nullable=False, comment='True when tokens_used is a character-count estimate (streaming calls without provider usage data)'),
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['wallet_id'], ['ai_credit_wallets.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_ai_credit_transactions_action_type'), 'ai_credit_transactions', ['action_type'], unique=False)
    op.create_index(op.f('ix_ai_credit_transactions_id'), 'ai_credit_transactions', ['id'], unique=False)
    op.create_index(op.f('ix_ai_credit_transactions_is_deleted'), 'ai_credit_transactions', ['is_deleted'], unique=False)
    op.create_index(op.f('ix_ai_credit_transactions_organization_id'), 'ai_credit_transactions', ['organization_id'], unique=False)
    op.create_index(op.f('ix_ai_credit_transactions_reason'), 'ai_credit_transactions', ['reason'], unique=False)
    op.create_index(op.f('ix_ai_credit_transactions_wallet_id'), 'ai_credit_transactions', ['wallet_id'], unique=False)

    # ── drop the superseded flat-count scaffold ─────────────────────────────────
    op.drop_index('ix_ai_usage_counters_id', table_name='ai_usage_counters')
    op.drop_index('ix_ai_usage_counters_is_deleted', table_name='ai_usage_counters')
    op.drop_index('ix_ai_usage_counters_organization_id', table_name='ai_usage_counters')
    op.drop_table('ai_usage_counters')


def downgrade() -> None:
    op.create_table(
        'ai_usage_counters',
        sa.Column('organization_id', sa.INTEGER(), autoincrement=False, nullable=False),
        sa.Column('period_start', sa.DateTime(timezone=True), autoincrement=False, nullable=False),
        sa.Column('count', sa.INTEGER(), autoincrement=False, nullable=False),
        sa.Column('id', sa.INTEGER(), autoincrement=True, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), autoincrement=False, nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), autoincrement=False, nullable=False),
        sa.Column('is_deleted', sa.BOOLEAN(), autoincrement=False, nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), autoincrement=False, nullable=True),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], name='ai_usage_counters_organization_id_fkey', ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name='ai_usage_counters_pkey'),
        sa.UniqueConstraint('organization_id', 'period_start', name='uq_ai_usage_org_period'),
    )
    op.create_index('ix_ai_usage_counters_organization_id', 'ai_usage_counters', ['organization_id'], unique=False)
    op.create_index('ix_ai_usage_counters_is_deleted', 'ai_usage_counters', ['is_deleted'], unique=False)
    op.create_index('ix_ai_usage_counters_id', 'ai_usage_counters', ['id'], unique=False)

    op.drop_index(op.f('ix_ai_credit_transactions_wallet_id'), table_name='ai_credit_transactions')
    op.drop_index(op.f('ix_ai_credit_transactions_reason'), table_name='ai_credit_transactions')
    op.drop_index(op.f('ix_ai_credit_transactions_organization_id'), table_name='ai_credit_transactions')
    op.drop_index(op.f('ix_ai_credit_transactions_is_deleted'), table_name='ai_credit_transactions')
    op.drop_index(op.f('ix_ai_credit_transactions_id'), table_name='ai_credit_transactions')
    op.drop_index(op.f('ix_ai_credit_transactions_action_type'), table_name='ai_credit_transactions')
    op.drop_table('ai_credit_transactions')

    op.drop_index(op.f('ix_ai_credit_wallets_organization_id'), table_name='ai_credit_wallets')
    op.drop_index(op.f('ix_ai_credit_wallets_is_deleted'), table_name='ai_credit_wallets')
    op.drop_index(op.f('ix_ai_credit_wallets_id'), table_name='ai_credit_wallets')
    op.drop_table('ai_credit_wallets')

    op.add_column('plans', sa.Column('ai_monthly_limit', sa.INTEGER(), autoincrement=False, nullable=True))
    op.execute("UPDATE plans SET ai_monthly_limit = ai_credits_monthly")
    op.alter_column('plans', 'ai_monthly_limit', nullable=False)
    op.drop_column('plans', 'ai_credits_monthly')
