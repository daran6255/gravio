"""add_priority_to_crm_deal_tasks

Revision ID: 5db77a3d3bf1
Revises: 39df748cf728
Create Date: 2026-07-06 12:50:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '5db77a3d3bf1'
down_revision: Union[str, None] = '39df748cf728'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add priority column to crm_deal_tasks if it doesn't already exist, reusing the existing leadpriority enum
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [col['name'] for col in inspector.get_columns('crm_deal_tasks')]
    if 'priority' not in columns:
        op.add_column('crm_deal_tasks', sa.Column('priority', postgresql.ENUM(
            'low', 'medium', 'high', 'urgent',
            name='leadpriority', create_type=False
        ), nullable=False, server_default='medium'))


def downgrade() -> None:
    op.drop_column('crm_deal_tasks', 'priority')
