"""add_soft_delete_columns_to_timesheet_user_settings

Revision ID: f48689894aaa
Revises: e53a258a1c9b
Create Date: 2026-07-10 17:59:40.133710

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f48689894aaa'
down_revision: Union[str, None] = 'e53a258a1c9b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # timesheet_user_settings was created in e53a258a1c9b without the is_deleted/
    # deleted_at columns that every other BaseModel-derived table gets from
    # SoftDeleteMixin -- the ORM model expects them and selects them unconditionally,
    # so any query against this table 500s with UndefinedColumnError until they exist.
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [col['name'] for col in inspector.get_columns('timesheet_user_settings')]

    if 'is_deleted' not in columns:
        op.add_column(
            'timesheet_user_settings',
            sa.Column('is_deleted', sa.Boolean(), server_default=sa.text('false'), nullable=False),
        )
    if 'deleted_at' not in columns:
        op.add_column(
            'timesheet_user_settings',
            sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        )


def downgrade() -> None:
    op.drop_column('timesheet_user_settings', 'deleted_at')
    op.drop_column('timesheet_user_settings', 'is_deleted')
