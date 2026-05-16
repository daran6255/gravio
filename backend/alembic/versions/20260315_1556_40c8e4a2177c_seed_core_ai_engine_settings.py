"""seed_core_ai_engine_settings

Revision ID: 40c8e4a2177c
Revises: 946fe6643c2e
Create Date: 2026-03-15 15:56:31.989845

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '40c8e4a2177c'
down_revision: Union[str, None] = '946fe6643c2e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Seed Core AI Engine settings
    op.execute(
        "INSERT INTO system_settings (key, value, description, is_secret, created_at, updated_at, is_deleted) VALUES "
        "('ai_provider', 'google', 'AI Provider (google or openai)', false, now(), now(), false), "
        "('ai_model_name', 'gemini-1.5-flash-002', 'AI Model Name (e.g., gemini-1.5-flash-002 or gpt-4o)', false, now(), now(), false), "
        "('google_api_key', '', 'Google Gemini API Key', true, now(), now(), false), "
        "('openai_api_key', '', 'OpenAI API Key', true, now(), now(), false) "
        "ON CONFLICT (key) DO NOTHING;"
    )


def downgrade() -> None:
    op.execute(
        "DELETE FROM system_settings WHERE key IN ('ai_provider', 'ai_model_name', 'google_api_key', 'openai_api_key');"
    )
