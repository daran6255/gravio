"""add_whatsapp_crm_integration

Revision ID: a9f3b2e1d4c7
Revises: 20260312_1149_1e7d5a6ac44a
Create Date: 2026-03-15 11:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a9f3b2e1d4c7'
down_revision: Union[str, None] = '1e7d5a6ac44a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ----------------------------------------------------------------
    # 1. Extend existing PostgreSQL ENUMs with new 'whatsapp' values
    #    PostgreSQL requires ALTER TYPE ... ADD VALUE for existing enums.
    # ----------------------------------------------------------------

    # LeadSource: add 'whatsapp'
    op.execute("ALTER TYPE leadsource ADD VALUE IF NOT EXISTS 'whatsapp'")

    # ContactSource: add 'whatsapp'
    op.execute("ALTER TYPE contactsource ADD VALUE IF NOT EXISTS 'whatsapp'")

    # CRMActivityType: add 'whatsapp_message'
    op.execute("ALTER TYPE crmactivitytype ADD VALUE IF NOT EXISTS 'whatsapp_message'")

    # ----------------------------------------------------------------
    # 2. Make contacts.email nullable and drop its unique constraint
    # ----------------------------------------------------------------

    # Drop unique index created by original migration
    op.drop_index('ix_contacts_email', table_name='contacts')

    # Make the column nullable
    op.alter_column(
        'contacts',
        'email',
        existing_type=sa.String(length=255),
        nullable=True,
        comment='Optional for WhatsApp-sourced contacts',
    )

    # Re-create as a non-unique index so lookups are still fast
    op.create_index(
        op.f('ix_contacts_email'),
        'contacts',
        ['email'],
        unique=False,
    )

    # ----------------------------------------------------------------
    # 3. Create whatsapp_messages audit table
    # ----------------------------------------------------------------
    op.create_table(
        'whatsapp_messages',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column(
            'wa_message_id',
            sa.String(length=255),
            nullable=False,
            comment="Meta's unique message ID (wamid.*) — used for idempotency",
        ),
        sa.Column(
            'wa_phone_number_id',
            sa.String(length=100),
            nullable=False,
            comment='Meta Phone Number ID that received the message',
        ),
        sa.Column(
            'from_phone',
            sa.String(length=30),
            nullable=False,
            comment="Sender's phone number in E.164 format e.g. 919876543210",
        ),
        sa.Column(
            'from_name',
            sa.String(length=255),
            nullable=True,
            comment='WhatsApp display name of the sender',
        ),
        sa.Column(
            'message_body',
            sa.Text(),
            nullable=True,
            comment='Raw text content of the message',
        ),
        sa.Column(
            'message_type',
            sa.String(length=50),
            nullable=False,
            server_default='text',
            comment='Meta message type: text | image | document | audio | video | sticker | location',
        ),
        sa.Column(
            'received_at',
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text('now()'),
            comment='Timestamp from Meta webhook payload',
        ),
        sa.Column(
            'processing_status',
            sa.String(length=20),
            nullable=False,
            server_default='pending',
            comment='Current processing state: pending | processed | failed | ignored',
        ),
        sa.Column(
            'ai_intent',
            sa.String(length=50),
            nullable=True,
            comment='AI-classified intent: new_person | known_contact | follow_up | ignore',
        ),
        sa.Column(
            'ai_confidence',
            sa.Float(),
            nullable=True,
            comment='AI classification confidence score 0.0 – 1.0',
        ),
        sa.Column(
            'crm_action_taken',
            sa.JSON(),
            nullable=True,
            comment='Summary of CRM records created/updated: {lead_id, contact_id, company_id, task_id}',
        ),
        sa.Column(
            'error_message',
            sa.Text(),
            nullable=True,
            comment='Error details if processing_status is failed',
        ),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False,
        ),
        sa.Column(
            'updated_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False,
        ),
        sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )

    op.create_index(
        op.f('ix_whatsapp_messages_id'),
        'whatsapp_messages',
        ['id'],
        unique=False,
    )
    op.create_index(
        op.f('ix_whatsapp_messages_wa_message_id'),
        'whatsapp_messages',
        ['wa_message_id'],
        unique=True,
    )
    op.create_index(
        op.f('ix_whatsapp_messages_wa_phone_number_id'),
        'whatsapp_messages',
        ['wa_phone_number_id'],
        unique=False,
    )
    op.create_index(
        op.f('ix_whatsapp_messages_from_phone'),
        'whatsapp_messages',
        ['from_phone'],
        unique=False,
    )
    op.create_index(
        op.f('ix_whatsapp_messages_processing_status'),
        'whatsapp_messages',
        ['processing_status'],
        unique=False,
    )
    op.create_index(
        op.f('ix_whatsapp_messages_is_deleted'),
        'whatsapp_messages',
        ['is_deleted'],
        unique=False,
    )


def downgrade() -> None:
    # ----------------------------------------------------------------
    # Reverse order: drop table, restore contacts.email, then remove
    # enum values (PostgreSQL does NOT support DROP VALUE natively,
    # so we recreate each enum without the added values).
    # ----------------------------------------------------------------

    # 1. Drop whatsapp_messages table
    op.drop_index(op.f('ix_whatsapp_messages_is_deleted'), table_name='whatsapp_messages')
    op.drop_index(op.f('ix_whatsapp_messages_processing_status'), table_name='whatsapp_messages')
    op.drop_index(op.f('ix_whatsapp_messages_from_phone'), table_name='whatsapp_messages')
    op.drop_index(op.f('ix_whatsapp_messages_wa_phone_number_id'), table_name='whatsapp_messages')
    op.drop_index(op.f('ix_whatsapp_messages_wa_message_id'), table_name='whatsapp_messages')
    op.drop_index(op.f('ix_whatsapp_messages_id'), table_name='whatsapp_messages')
    op.drop_table('whatsapp_messages')

    # 2. Restore contacts.email to NOT NULL with unique index
    op.drop_index('ix_contacts_email', table_name='contacts')
    op.alter_column(
        'contacts',
        'email',
        existing_type=sa.String(length=255),
        nullable=False,
        comment=None,
    )
    op.create_index(op.f('ix_contacts_email'), 'contacts', ['email'], unique=True)

    # 3. Remove enum values by recreating each enum type
    #    (PostgreSQL requires recreating the type; contacts/leads must be cast)
    op.execute("""
        ALTER TABLE leads ALTER COLUMN lead_source TYPE VARCHAR(50);
        ALTER TABLE contacts ALTER COLUMN contact_source TYPE VARCHAR(50);
        ALTER TABLE crm_activity_logs ALTER COLUMN activity_type TYPE VARCHAR(50);

        DROP TYPE IF EXISTS leadsource;
        CREATE TYPE leadsource AS ENUM
            ('website','referral','campaign','event','cold_call','social_media','partner');
        ALTER TABLE leads ALTER COLUMN lead_source
            TYPE leadsource USING lead_source::leadsource;

        DROP TYPE IF EXISTS contactsource;
        CREATE TYPE contactsource AS ENUM
            ('website','referral','event','cold_call','linkedin','other');
        ALTER TABLE contacts ALTER COLUMN contact_source
            TYPE contactsource USING contact_source::contactsource;

        DROP TYPE IF EXISTS crmactivitytype;
        CREATE TYPE crmactivitytype AS ENUM
            ('created','updated','deleted','status_changed','email_sent',
             'call_made','meeting_held','note_added','stage_changed','converted');
        ALTER TABLE crm_activity_logs ALTER COLUMN activity_type
            TYPE crmactivitytype USING activity_type::crmactivitytype;
    """)
