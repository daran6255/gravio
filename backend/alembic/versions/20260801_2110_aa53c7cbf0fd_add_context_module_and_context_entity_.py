"""add context_module and context_entity_id to ai_chat_sessions

Revision ID: aa53c7cbf0fd
Revises: de484f85a4f1
Create Date: 2026-08-01 21:10:17.553883

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'aa53c7cbf0fd'
down_revision: Union[str, None] = 'de484f85a4f1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Note: `alembic revision --autogenerate` also picked up a large amount of pre-existing,
# unrelated schema drift across many other tables (dropped server_defaults, added indexes,
# dropped unique constraints) -- none of that is part of this change, so this migration was
# hand-trimmed to only the two new columns actually being added here.


def upgrade() -> None:
    op.add_column('ai_chat_sessions', sa.Column('context_module', sa.String(length=30), nullable=True, comment="e.g. 'leave' | 'timesheet' | 'meeting' | 'project_task'; null for the global chat drawer"))
    op.add_column('ai_chat_sessions', sa.Column('context_entity_id', sa.String(length=64), nullable=True, comment="Optional record id (e.g. a task's public_id) the session was opened against"))
    op.create_index(op.f('ix_ai_chat_sessions_context_module'), 'ai_chat_sessions', ['context_module'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_ai_chat_sessions_context_module'), table_name='ai_chat_sessions')
    op.drop_column('ai_chat_sessions', 'context_entity_id')
    op.drop_column('ai_chat_sessions', 'context_module')
