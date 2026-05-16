"""seed_whatsapp_settings

Revision ID: 7f957201595b
Revises: 0d0cc7756b48
Create Date: 2026-03-15 12:46:46.556789

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7f957201595b'
down_revision: Union[str, None] = '0d0cc7756b48'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Seed WhatsApp settings
    op.execute(
        "INSERT INTO system_settings (key, value, description, is_secret, created_at, updated_at, is_deleted) VALUES "
        "('whatsapp_access_token', '', 'Meta WhatsApp Business API System User Access Token', true, now(), now(), false), "
        "('whatsapp_phone_number_id', '', 'Meta WhatsApp Phone Number ID', false, now(), now(), false), "
        "('whatsapp_app_secret', '', 'Meta App Secret for Webhook Verification', true, now(), now(), false), "
        "('whatsapp_verify_token', 'winvinaya_crm_wa', 'Webhook Verify Token (Set this in Meta Developer Portal)', false, now(), now(), false), "
        "('whatsapp_bot_user_id', '1', 'User ID to assign automated leads and tasks to', false, now(), now(), false) "
        "ON CONFLICT (key) DO NOTHING;"
    )

def downgrade() -> None:
    op.execute(
        "DELETE FROM system_settings WHERE key IN ("
        "'whatsapp_access_token', 'whatsapp_phone_number_id', 'whatsapp_app_secret', "
        "'whatsapp_verify_token', 'whatsapp_bot_user_id'"
        ");"
    )
