"""add activity assignments

Revision ID: 0eae2b9c7bf3
Revises: 5f5714dff454
Create Date: 2026-03-10 22:20:01.250574

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0eae2b9c7bf3'
down_revision: Union[str, None] = '5f5714dff454'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create association table
    op.create_table(
        'dsr_activity_assignments',
        sa.Column('activity_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['activity_id'], ['dsr_activities.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('activity_id', 'user_id')
    )

    # 2. Migrate existing data from assigned_to column to association table
    # Using raw SQL for the data migration to be safe
    op.execute("""
        INSERT INTO dsr_activity_assignments (activity_id, user_id)
        SELECT id, assigned_to 
        FROM dsr_activities 
        WHERE assigned_to IS NOT NULL
    """)


def downgrade() -> None:
    op.drop_table('dsr_activity_assignments')
