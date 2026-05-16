"""convert_dsr_json_to_jsonb

Revision ID: 5fa312cb22cf
Revises: fd64097c25ff
Create Date: 2026-03-16 12:20:43.985897

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5fa312cb22cf'
down_revision: Union[str, None] = 'fd64097c25ff'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Convert dsr_entries columns
    op.execute('ALTER TABLE dsr_entries ALTER COLUMN items TYPE JSONB USING items::jsonb')
    op.execute('ALTER TABLE dsr_entries ALTER COLUMN others TYPE JSONB USING others::jsonb')
    
    # Convert dsr_projects columns
    op.execute('ALTER TABLE dsr_projects ALTER COLUMN others TYPE JSONB USING others::jsonb')
    
    # Convert dsr_activities columns
    op.execute('ALTER TABLE dsr_activities ALTER COLUMN others TYPE JSONB USING others::jsonb')


def downgrade() -> None:
    # Convert back to JSON
    op.execute('ALTER TABLE dsr_entries ALTER COLUMN items TYPE JSON USING items::json')
    op.execute('ALTER TABLE dsr_entries ALTER COLUMN others TYPE JSON USING others::json')
    op.execute('ALTER TABLE dsr_projects ALTER COLUMN others TYPE JSON USING others::json')
    op.execute('ALTER TABLE dsr_activities ALTER COLUMN others TYPE JSON USING others::json')
