"""add_is_active_to_crm_contacts

Revision ID: b2f8295a0c6a
Revises: 5db77a3d3bf1
Create Date: 2026-07-06 13:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'b2f8295a0c6a'
down_revision: Union[str, None] = '5db77a3d3bf1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add is_active column to crm_contacts if it doesn't already exist
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [col['name'] for col in inspector.get_columns('crm_contacts')]
    if 'is_active' not in columns:
        op.add_column('crm_contacts', sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')))


def downgrade() -> None:
    op.drop_column('crm_contacts', 'is_active')
