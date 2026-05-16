"""Fix missing screening assignment table

Revision ID: a1b2c3d4e5f6
Revises: c04c1b5f2d59
Create Date: 2026-03-19 15:35:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = 'c04c1b5f2d59'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Check if table exists before creating
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()
    
    if 'candidate_screening_assignments' not in tables:
        op.create_table('candidate_screening_assignments',
            sa.Column('candidate_id', sa.Integer(), nullable=False),
            sa.Column('assigned_to_id', sa.Integer(), nullable=False),
            sa.Column('assigned_by_id', sa.Integer(), nullable=True),
            sa.Column('assigned_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('is_deleted', sa.Boolean(), nullable=False),
            sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
            sa.ForeignKeyConstraint(['assigned_by_id'], ['users.id'], ondelete='SET NULL'),
            sa.ForeignKeyConstraint(['assigned_to_id'], ['users.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['candidate_id'], ['candidates.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_candidate_screening_assignments_assigned_to_id'), 'candidate_screening_assignments', ['assigned_to_id'], unique=False)
        op.create_index(op.f('ix_candidate_screening_assignments_candidate_id'), 'candidate_screening_assignments', ['candidate_id'], unique=True)
        op.create_index(op.f('ix_candidate_screening_assignments_id'), 'candidate_screening_assignments', ['id'], unique=False)
        op.create_index(op.f('ix_candidate_screening_assignments_is_deleted'), 'candidate_screening_assignments', ['is_deleted'], unique=False)

    # Check if column exists before altering
    columns = [c['name'] for c in inspector.get_columns('assessments')]
    if 'include_seb' in columns:
        try:
            op.alter_column('assessments', 'include_seb',
                existing_type=sa.BOOLEAN(),
                server_default=None,
                existing_nullable=False)
        except Exception:
            pass


def downgrade() -> None:
    op.drop_index(op.f('ix_candidate_screening_assignments_is_deleted'), table_name='candidate_screening_assignments')
    op.drop_index(op.f('ix_candidate_screening_assignments_id'), table_name='candidate_screening_assignments')
    op.drop_index(op.f('ix_candidate_screening_assignments_candidate_id'), table_name='candidate_screening_assignments')
    op.drop_index(op.f('ix_candidate_screening_assignments_assigned_to_id'), table_name='candidate_screening_assignments')
    op.drop_table('candidate_screening_assignments')
