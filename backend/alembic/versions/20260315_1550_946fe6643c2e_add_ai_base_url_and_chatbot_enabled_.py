"""add_ai_base_url_and_chatbot_enabled_settings

Revision ID: 946fe6643c2e
Revises: 7f957201595b
Create Date: 2026-03-15 15:50:09.336732

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '946fe6643c2e'
down_revision: Union[str, None] = '7f957201595b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Seed AI Base URL and Chatbot Enabled settings
    op.execute(
        "INSERT INTO system_settings (key, value, description, is_secret, created_at, updated_at, is_deleted) VALUES "
        "('ai_base_url', 'https://generativelanguage.googleapis.com', 'Base API URL for the AI provider (e.g., Google/OpenAI)', false, now(), now(), false), "
        "('chatbot_enabled', 'false', 'Enable or disable the AI-powered chatbot on the frontend', false, now(), now(), false) "
        "ON CONFLICT (key) DO NOTHING;"
    )


def downgrade() -> None:
    op.execute(
        "DELETE FROM system_settings WHERE key IN ('ai_base_url', 'chatbot_enabled');"
    )
