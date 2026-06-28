"""add_notification_public_id

Revision ID: 791044fd392c
Revises: 3669d0c1c543
Create Date: 2026-06-28 12:20:38.565106

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '791044fd392c'
down_revision: Union[str, None] = '3669d0c1c543'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Note: dropped the auto-generated server_default=None alter_columns for
    # crm_leads.version/is_anonymized - those are intentional DB-side defaults
    # (Python-side `default=` vs `server_default=` mismatch in autogenerate diff), keep them.
    # notifications table is freshly created and empty, so a plain NOT NULL add is safe.
    op.add_column('notifications', sa.Column('public_id', sa.Uuid(), nullable=False))
    op.create_index(op.f('ix_notifications_public_id'), 'notifications', ['public_id'], unique=True)


def downgrade() -> None:
    op.drop_index(op.f('ix_notifications_public_id'), table_name='notifications')
    op.drop_column('notifications', 'public_id')
