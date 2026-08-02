"""backfill 'Development' org-default timesheet category

Revision ID: b7c1e4a92f3d
Revises: aa53c7cbf0fd
Create Date: 2026-08-02 10:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'b7c1e4a92f3d'
down_revision: Union[str, None] = 'aa53c7cbf0fd'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# TimesheetCategoryRepository.DEFAULT_CATEGORIES gained a "Development" entry so
# project-less dev work (e.g. an internal integration with no matching Project record) has
# somewhere to be logged instead of failing with a "no project matching" error. seed_defaults()
# only seeds the full list once per org (it's a no-op if any org-default category already
# exists), so organizations seeded before this change never pick the new entry up on their
# own -- backfill it for every org that already has its default set.
_NAME = "Development"
_COLOR = "#EC4899"


def upgrade() -> None:
    op.get_bind().execute(
        sa.text(
            """
            INSERT INTO user_timesheet_categories
                (organization_id, user_id, name, color, is_org_default, is_deleted, created_at, updated_at)
            SELECT DISTINCT organization_id, NULL, :name, :color, true, false, now(), now()
            FROM user_timesheet_categories existing
            WHERE existing.is_org_default = true
              AND existing.is_deleted = false
              AND NOT EXISTS (
                  SELECT 1 FROM user_timesheet_categories dev
                  WHERE dev.organization_id = existing.organization_id
                    AND dev.is_org_default = true
                    AND dev.is_deleted = false
                    AND lower(dev.name) = lower(:name)
              )
            """
        ),
        {"name": _NAME, "color": _COLOR},
    )


def downgrade() -> None:
    op.get_bind().execute(
        sa.text(
            "DELETE FROM user_timesheet_categories WHERE is_org_default = true AND lower(name) = lower(:name)"
        ),
        {"name": _NAME},
    )
