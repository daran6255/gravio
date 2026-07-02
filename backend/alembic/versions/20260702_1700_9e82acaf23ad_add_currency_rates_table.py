"""add_currency_rates_table

Revision ID: 9e82acaf23ad
Revises: c640fcfb8350
Create Date: 2026-07-02 17:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9e82acaf23ad'
down_revision: Union[str, None] = 'c640fcfb8350'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'currency_rates',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('rate_date', sa.Date(), nullable=False),
        sa.Column('from_currency', sa.String(length=10), nullable=False),
        sa.Column('to_currency', sa.String(length=10), nullable=False),
        sa.Column('rate', sa.Numeric(20, 10), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('rate_date', 'from_currency', 'to_currency', name='uq_currency_rate_date_pair'),
    )
    op.create_index(op.f('ix_currency_rates_id'), 'currency_rates', ['id'], unique=False)
    op.create_index(op.f('ix_currency_rates_rate_date'), 'currency_rates', ['rate_date'], unique=False)
    op.create_index(op.f('ix_currency_rates_is_deleted'), 'currency_rates', ['is_deleted'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_currency_rates_is_deleted'), table_name='currency_rates')
    op.drop_index(op.f('ix_currency_rates_rate_date'), table_name='currency_rates')
    op.drop_index(op.f('ix_currency_rates_id'), table_name='currency_rates')
    op.drop_table('currency_rates')
