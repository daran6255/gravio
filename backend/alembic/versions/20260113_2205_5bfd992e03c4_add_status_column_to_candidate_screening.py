"""add_status_column_to_candidate_screening

Revision ID: 5bfd992e03c4
Revises: a4267c5dfc7f
Create Date: 2026-01-13 22:05:07.906428

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5bfd992e03c4'
down_revision: Union[str, None] = 'a4267c5dfc7f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add status column to candidate_screenings table
    op.add_column('candidate_screenings', sa.Column('status', sa.String(length=100), nullable=True))


def downgrade() -> None:
    # Remove status column from candidate_screenings table
    op.drop_column('candidate_screenings', 'status')

