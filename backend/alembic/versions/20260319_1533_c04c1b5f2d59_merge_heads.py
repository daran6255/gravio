"""merge_heads

Revision ID: c04c1b5f2d59
Revises: f82b6ac29d1d, 487f979ccfdd
Create Date: 2026-03-19 15:33:02.416854

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c04c1b5f2d59'
down_revision: Union[str, None] = ('f82b6ac29d1d', '487f979ccfdd')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
