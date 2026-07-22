"""ai_credit_wallet_per_user

Revision ID: 42f7da2c8492
Revises: c83bbb08d091
Create Date: 2026-07-22 20:50:35.647173

Wallets move from one-per-organization (a shared pool) to one-per-(organization, user) --
every user now gets their own full monthly credit allotment off the org's plan rate, instead
of a Team's users splitting one shared pool. Existing wallet/transaction rows predate this
model (they have no per-user meaning to backfill into) and are cleared; each user's wallet is
recreated lazily, fresh, the next time they make or check an AI call -- same lazy-create
behavior as a first-ever wallet always had.

Note: autogenerate also picked up a large amount of pre-existing, unrelated schema drift
(server defaults, indexes, and constraints on several other tables) that has nothing to do
with this change. That drift was deliberately excluded here, same as the prior AI credits
migration (c22e081cd0ae) did.
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '42f7da2c8492'
down_revision: Union[str, None] = 'c83bbb08d091'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Existing rows predate the per-user model and have nothing meaningful to backfill
    # user_id from -- cleared so the new column can be added NOT NULL outright. Each user's
    # wallet recreates itself lazily on their next AI call/credit check, same as always.
    op.execute("DELETE FROM ai_credit_transactions")
    op.execute("DELETE FROM ai_credit_wallets")

    op.add_column('ai_credit_wallets', sa.Column('user_id', sa.Integer(), nullable=False))
    op.drop_constraint('uq_ai_credit_wallet_org', 'ai_credit_wallets', type_='unique')
    op.create_index(op.f('ix_ai_credit_wallets_user_id'), 'ai_credit_wallets', ['user_id'], unique=False)
    op.create_unique_constraint('uq_ai_credit_wallet_org_user', 'ai_credit_wallets', ['organization_id', 'user_id'])
    op.create_foreign_key(
        'fk_ai_credit_wallets_user_id_users', 'ai_credit_wallets', 'users', ['user_id'], ['id'], ondelete='CASCADE',
    )


def downgrade() -> None:
    op.drop_constraint('fk_ai_credit_wallets_user_id_users', 'ai_credit_wallets', type_='foreignkey')
    op.drop_constraint('uq_ai_credit_wallet_org_user', 'ai_credit_wallets', type_='unique')
    op.drop_index(op.f('ix_ai_credit_wallets_user_id'), table_name='ai_credit_wallets')
    op.create_unique_constraint('uq_ai_credit_wallet_org', 'ai_credit_wallets', ['organization_id'])
    op.drop_column('ai_credit_wallets', 'user_id')
