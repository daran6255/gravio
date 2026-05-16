"""consolidate_ai_api_keys

Revision ID: 0a81ff50a796
Revises: 40c8e4a2177c
Create Date: 2026-03-15 16:00:04.922694

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0a81ff50a796'
down_revision: Union[str, None] = '40c8e4a2177c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Ensure generic ai_api_key exists
    op.execute(
        "INSERT INTO system_settings (key, value, description, is_secret, created_at, updated_at, is_deleted) "
        "VALUES ('ai_api_key', '', 'Generic AI API Key', true, now(), now(), false) "
        "ON CONFLICT (key) DO NOTHING;"
    )
    
    # Migrate google_api_key to ai_api_key if ai_api_key is empty and google_api_key has a value
    op.execute(
        "UPDATE system_settings SET value = (SELECT value FROM system_settings WHERE key = 'google_api_key') "
        "WHERE key = 'ai_api_key' AND (value IS NULL OR value = '') "
        "AND EXISTS (SELECT 1 FROM system_settings WHERE key = 'google_api_key' AND value IS NOT NULL AND value != '' AND value != '********');"
    )
    
    # Migrate openai_api_key to ai_api_key if ai_api_key is still empty
    op.execute(
        "UPDATE system_settings SET value = (SELECT value FROM system_settings WHERE key = 'openai_api_key') "
        "WHERE key = 'ai_api_key' AND (value IS NULL OR value = '') "
        "AND EXISTS (SELECT 1 FROM system_settings WHERE key = 'openai_api_key' AND value IS NOT NULL AND value != '' AND value != '********');"
    )

    # Clean up specific keys
    op.execute("DELETE FROM system_settings WHERE key IN ('google_api_key', 'openai_api_key');")


def downgrade() -> None:
    # Re-seed specific keys if needed, though consolidated is preferred
    op.execute(
        "INSERT INTO system_settings (key, value, description, is_secret, created_at, updated_at, is_deleted) VALUES "
        "('google_api_key', '', 'Google Gemini API Key', true, now(), now(), false), "
        "('openai_api_key', '', 'OpenAI API Key', true, now(), now(), false) "
        "ON CONFLICT (key) DO NOTHING;"
    )
