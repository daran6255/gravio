"""add template_key to projects

A project created from a template (frontend PROJECT_TEMPLATES) previously had
its template_key discarded right after being used to seed initial tasks —
there was no way to later tell which template (and therefore which category)
a project came from. This adds a persisted, nullable template_key column so
the UI can recommend a matching task-status preset for that project's
template category.

Revision ID: f928ba6a8bec
Revises: c8f3d2a91b47
Create Date: 2026-07-18 19:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'f928ba6a8bec'
down_revision = 'c8f3d2a91b47'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('projects', sa.Column('template_key', sa.String(length=100), nullable=True))


def downgrade() -> None:
    op.drop_column('projects', 'template_key')
