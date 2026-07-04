"""expand_project_status_values

Revision ID: 8e3a306ef55f
Revises: 6e3c76db9e0e
Create Date: 2026-07-04 19:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '8e3a306ef55f'
down_revision: Union[str, None] = '6e3c76db9e0e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

OLD_VALUES = ('planning', 'active', 'on_hold', 'completed', 'archived')
NEW_VALUES = (
    'planning', 'active', 'in_progress', 'delayed', 'in_testing',
    'on_hold', 'completed', 'approved', 'invoiced', 'canceled',
)


def upgrade() -> None:
    op.execute("ALTER TYPE projectstatus RENAME TO projectstatus_old")
    new_enum = sa.Enum(*NEW_VALUES, name='projectstatus')
    new_enum.create(op.get_bind())
    op.execute(
        "ALTER TABLE projects ALTER COLUMN status TYPE projectstatus USING "
        "(CASE status::text WHEN 'archived' THEN 'canceled' ELSE status::text END)::projectstatus"
    )
    op.execute("DROP TYPE projectstatus_old")


def downgrade() -> None:
    op.execute("ALTER TYPE projectstatus RENAME TO projectstatus_new")
    old_enum = sa.Enum(*OLD_VALUES, name='projectstatus')
    old_enum.create(op.get_bind())
    op.execute(
        "ALTER TABLE projects ALTER COLUMN status TYPE projectstatus USING "
        "(CASE status::text "
        "WHEN 'in_progress' THEN 'active' "
        "WHEN 'delayed' THEN 'on_hold' "
        "WHEN 'in_testing' THEN 'active' "
        "WHEN 'approved' THEN 'completed' "
        "WHEN 'invoiced' THEN 'completed' "
        "WHEN 'canceled' THEN 'archived' "
        "ELSE status::text END)::projectstatus"
    )
    op.execute("DROP TYPE projectstatus_new")
