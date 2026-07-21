"""add booking_page value to leadsource enum

Revision ID: 4285890c42a3
Revises: e6940208c189
Create Date: 2026-07-21 13:44:48.257787

The booking scheduler feature (see e6940208c189 and app/models/crm.py's
LeadSource.BOOKING_PAGE) added a new Python enum member for leads auto-created from
a booking, but never migrated the actual Postgres `leadsource` enum type to match —
inserting a lead with source='booking_page' failed with
asyncpg.exceptions.InvalidTextRepresentationError until this migration runs.

ALTER TYPE ... ADD VALUE cannot run inside a transaction block, so this uses
Alembic's autocommit_block() to escape the migration's default transactional DDL.
"""
from typing import Sequence, Union
from alembic import op

# revision identifiers, used by Alembic.
revision: str = '4285890c42a3'
down_revision: Union[str, None] = 'e6940208c189'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.get_context().autocommit_block():
        op.execute("ALTER TYPE leadsource ADD VALUE IF NOT EXISTS 'booking_page'")


def downgrade() -> None:
    # PostgreSQL has no ALTER TYPE ... DROP VALUE — removing an enum value requires
    # rebuilding the type (rename, create new type, migrate every dependent column,
    # drop old type), and any crm_leads rows already using 'booking_page' would need
    # to be reassigned first. Not implemented: this migration is additive-only.
    pass
