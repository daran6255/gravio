"""ai_credit_purchase_reason

Revision ID: c85697a02c25
Revises: 42f7da2c8492
Create Date: 2026-07-22 22:18:52.877052

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c85697a02c25'
down_revision: Union[str, None] = '42f7da2c8492'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE aicredittransactionreason ADD VALUE IF NOT EXISTS 'purchase'")


def downgrade() -> None:
    # Postgres has no DROP VALUE for enums; removing 'purchase' would require
    # rebuilding the type and is not worth the risk for a ledger reason label.
    pass
