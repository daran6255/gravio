"""Add candidate_submitted_at to mock interview

Revision ID: 4b9435006cfe
Revises: 18d26048c49f
Create Date: 2026-05-12 12:56:24.871146

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4b9435006cfe'
down_revision: Union[str, None] = '18d26048c49f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('training_mock_interviews', sa.Column('candidate_submitted_at', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column('training_mock_interviews', 'candidate_submitted_at')
