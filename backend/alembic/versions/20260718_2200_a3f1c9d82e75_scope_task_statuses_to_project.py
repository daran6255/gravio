"""scope_task_statuses_to_project

Adds project_id (FK → projects.id CASCADE) to project_task_statuses,
backfills existing rows by assigning each orphaned status row to the
earliest project in the same organization, then makes the column NOT NULL.

This completes the transition from org-level task statuses (old) to
per-project task statuses (new model/service already uses project_id).

Revision ID: a3f1c9d82e75
Revises: f928ba6a8bec
Create Date: 2026-07-18 22:00:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'a3f1c9d82e75'
down_revision: Union[str, None] = 'f928ba6a8bec'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add project_id as nullable first so we can backfill before enforcing NOT NULL.
    op.add_column(
        'project_task_statuses',
        sa.Column('project_id', sa.Integer(), nullable=True),
    )

    # 2. Backfill: assign each status row without a project_id to the earliest project
    #    in the same organization (best-effort — the old schema was org-level, so there
    #    may be no projects at all for some orgs, in which case those rows are left NULL
    #    and will be cleaned up by step 4).
    op.execute("""
        UPDATE project_task_statuses pts
        SET    project_id = (
                   SELECT p.id
                   FROM   projects p
                   WHERE  p.organization_id = pts.organization_id
                     AND  p.is_deleted = false
                   ORDER  BY p.id ASC
                   LIMIT  1
               )
        WHERE  pts.project_id IS NULL
    """)

    # 3. Delete any status rows that still have no project (org has no projects yet).
    #    They would be orphaned and impossible to display anyway.
    op.execute("""
        DELETE FROM project_task_statuses WHERE project_id IS NULL
    """)

    # 4. Now make the column NOT NULL and add FK + index.
    op.alter_column('project_task_statuses', 'project_id', nullable=False)

    op.create_foreign_key(
        'fk_project_task_statuses_project_id',
        'project_task_statuses', 'projects',
        ['project_id'], ['id'],
        ondelete='CASCADE',
    )
    op.create_index(
        op.f('ix_project_task_statuses_project_id'),
        'project_task_statuses',
        ['project_id'],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f('ix_project_task_statuses_project_id'), table_name='project_task_statuses')
    op.drop_constraint('fk_project_task_statuses_project_id', 'project_task_statuses', type_='foreignkey')
    op.alter_column('project_task_statuses', 'project_id', nullable=True)
    op.drop_column('project_task_statuses', 'project_id')
