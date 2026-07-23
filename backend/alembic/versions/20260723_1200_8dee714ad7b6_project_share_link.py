"""project share link

Revision ID: 8dee714ad7b6
Revises: c85697a02c25
Create Date: 2026-07-23 12:00:00.000000

Adds a client-facing, read-only status page per project: share_token (rotated
on regenerate -- rotation is how an old link is revoked) and share_enabled
(lets sharing be turned off without losing/regenerating the token).
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = '8dee714ad7b6'
down_revision: Union[str, None] = 'c85697a02c25'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('projects', sa.Column('share_token', sa.Uuid(), nullable=True))
    op.add_column('projects', sa.Column('share_enabled', sa.Boolean(), nullable=False, server_default=sa.false()))
    op.create_index(op.f('ix_projects_share_token'), 'projects', ['share_token'], unique=True)
    op.alter_column('projects', 'share_enabled', server_default=None)


def downgrade() -> None:
    op.drop_index(op.f('ix_projects_share_token'), table_name='projects')
    op.drop_column('projects', 'share_enabled')
    op.drop_column('projects', 'share_token')
