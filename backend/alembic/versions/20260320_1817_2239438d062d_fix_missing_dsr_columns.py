"""fix missing dsr columns

Revision ID: 2239438d062d
Revises: e6f2b4c1a2d3
Create Date: 2026-03-20 18:17:06.568424

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.engine.reflection import Inspector

# revision identifiers, used by Alembic.
revision: str = '2239438d062d'
down_revision: Union[str, None] = 'e6f2b4c1a2d3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = Inspector.from_engine(conn)
    tables = inspector.get_table_names()

    # This migration specifically fixes the dev server issue where e6f2b4c1a2d3 
    # was "applied" but columns were missing.

    # --- Reconcile dsr_activities ---
    if 'dsr_activities' in tables:
        columns = [c['name'] for c in inspector.get_columns('dsr_activities')]
        
        if 'actual_start_date' not in columns:
            op.add_column('dsr_activities', sa.Column('actual_start_date', sa.Date(), nullable=True))
        if 'actual_end_date' not in columns:
            op.add_column('dsr_activities', sa.Column('actual_end_date', sa.Date(), nullable=True))
        if 'total_actual_hours' not in columns:
            op.add_column('dsr_activities', sa.Column('total_actual_hours', sa.Float(), nullable=False, server_default='0.0'))
        if 'estimated_hours' not in columns:
            op.add_column('dsr_activities', sa.Column('estimated_hours', sa.Float(), nullable=True))
        if 'assigned_to' not in columns:
            op.add_column('dsr_activities', sa.Column('assigned_to', sa.Integer(), nullable=True))
            op.create_foreign_key('fk_dsr_activities_assigned_to_v2', 'dsr_activities', 'users', ['assigned_to'], ['id'], ondelete='SET NULL')

    # --- Reconcile dsr_entries ---
    if 'dsr_entries' in tables:
        columns = [c['name'] for c in inspector.get_columns('dsr_entries')]
        
        if 'admin_notes' not in columns:
            op.add_column('dsr_entries', sa.Column('admin_notes', sa.Text(), nullable=True))
        if 'reviewed_by' not in columns:
            op.add_column('dsr_entries', sa.Column('reviewed_by', sa.Integer(), nullable=True))
            op.create_foreign_key('fk_dsr_entries_reviewed_by_v2', 'dsr_entries', 'users', ['reviewed_by'], ['id'], ondelete='SET NULL')
        if 'reviewed_at' not in columns:
            op.add_column('dsr_entries', sa.Column('reviewed_at', sa.DateTime(timezone=True), nullable=True))
        if 'is_leave' not in columns:
            op.add_column('dsr_entries', sa.Column('is_leave', sa.Boolean(), nullable=False, server_default='false'))
        if 'leave_type' not in columns:
            op.add_column('dsr_entries', sa.Column('leave_type', sa.String(length=50), nullable=True))

    # --- Reconcile association table ---
    if 'dsr_activity_assignments' not in tables:
        op.create_table(
            'dsr_activity_assignments',
            sa.Column('activity_id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.ForeignKeyConstraint(['activity_id'], ['dsr_activities.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('activity_id', 'user_id')
        )


def downgrade() -> None:
    pass
