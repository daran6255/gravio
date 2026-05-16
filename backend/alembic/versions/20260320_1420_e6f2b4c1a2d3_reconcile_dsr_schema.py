"""reconcile dsr schema
 
Revision ID: e6f2b4c1a2d3
Revises: a1b2c3d4e5f6
Create Date: 2026-03-20 14:20:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.engine.reflection import Inspector

# revision identifiers, used by Alembic.
revision: str = 'e6f2b4c1a2d3'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = Inspector.from_engine(conn)
    tables = inspector.get_table_names()

    # --- Reconcile dsr_activities ---
    if 'dsr_activities' in tables:
        columns = [c['name'] for c in inspector.get_columns('dsr_activities')]
        
        # Add missing columns
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
            op.create_foreign_key('fk_dsr_activities_assigned_to', 'dsr_activities', 'users', ['assigned_to'], ['id'], ondelete='SET NULL')

        # Fix JSON to JSONB if needed
        col_others = [c for c in inspector.get_columns('dsr_activities') if c['name'] == 'others'][0]
        if 'JSON' in str(col_others['type']).upper() and 'JSONB' not in str(col_others['type']).upper():
            op.execute('ALTER TABLE dsr_activities ALTER COLUMN others TYPE JSONB USING others::jsonb')

    # --- Reconcile dsr_entries ---
    if 'dsr_entries' in tables:
        columns = [c['name'] for c in inspector.get_columns('dsr_entries')]
        
        if 'admin_notes' not in columns:
            op.add_column('dsr_entries', sa.Column('admin_notes', sa.Text(), nullable=True))
            
        if 'reviewed_by' not in columns:
            op.add_column('dsr_entries', sa.Column('reviewed_by', sa.Integer(), nullable=True))
            op.create_foreign_key('fk_dsr_entries_reviewed_by', 'dsr_entries', 'users', ['reviewed_by'], ['id'], ondelete='SET NULL')
            
        if 'reviewed_at' not in columns:
            op.add_column('dsr_entries', sa.Column('reviewed_at', sa.DateTime(timezone=True), nullable=True))

        if 'is_leave' not in columns:
            op.add_column('dsr_entries', sa.Column('is_leave', sa.Boolean(), nullable=False, server_default='false'))
            
        if 'leave_type' not in columns:
            op.add_column('dsr_entries', sa.Column('leave_type', sa.String(length=50), nullable=True))

        # Fix JSON to JSONB
        col_items = [c for c in inspector.get_columns('dsr_entries') if c['name'] == 'items'][0]
        if 'JSON' in str(col_items['type']).upper() and 'JSONB' not in str(col_items['type']).upper():
            op.execute('ALTER TABLE dsr_entries ALTER COLUMN items TYPE JSONB USING items::jsonb')
            
        col_others = [c for c in inspector.get_columns('dsr_entries') if c['name'] == 'others'][0]
        if 'JSON' in str(col_others['type']).upper() and 'JSONB' not in str(col_others['type']).upper():
            op.execute('ALTER TABLE dsr_entries ALTER COLUMN others TYPE JSONB USING others::jsonb')

    # --- Reconcile dsr_projects ---
    if 'dsr_projects' in tables:
        col_others = [c for c in inspector.get_columns('dsr_projects') if c['name'] == 'others'][0]
        if 'JSON' in str(col_others['type']).upper() and 'JSONB' not in str(col_others['type']).upper():
            op.execute('ALTER TABLE dsr_projects ALTER COLUMN others TYPE JSONB USING others::jsonb')

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
