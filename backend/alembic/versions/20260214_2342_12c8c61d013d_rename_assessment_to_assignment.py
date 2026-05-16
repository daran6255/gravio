"""rename_assessment_to_assignment

Revision ID: 12c8c61d013d
Revises: 20cdfca4b79b
Create Date: 2026-02-14 23:42:38.096685

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '12c8c61d013d'
down_revision: Union[str, None] = '20cdfca4b79b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Rename table
    op.rename_table('training_assessments', 'training_assignments')
    
    # 2. Rename columns
    op.alter_column('training_assignments', 'assessment_name', new_column_name='assignment_name')
    op.alter_column('training_assignments', 'assessment_date', new_column_name='assignment_date')
    
    # 3. Rename indexes
    op.execute('ALTER INDEX ix_training_assessments_batch_id RENAME TO ix_training_assignments_batch_id')
    op.execute('ALTER INDEX ix_training_assessments_candidate_id RENAME TO ix_training_assignments_candidate_id')
    op.execute('ALTER INDEX ix_training_assessments_id RENAME TO ix_training_assignments_id')
    op.execute('ALTER INDEX ix_training_assessments_is_deleted RENAME TO ix_training_assignments_is_deleted')
    op.execute('ALTER INDEX ix_training_assessments_trainer_id RENAME TO ix_training_assignments_trainer_id')


def downgrade() -> None:
    # 1. Rename table back
    op.rename_table('training_assignments', 'training_assessments')
    
    # 2. Rename columns back
    op.alter_column('training_assessments', 'assignment_name', new_column_name='assessment_name')
    op.alter_column('training_assessments', 'assignment_date', new_column_name='assessment_date')
    
    # 3. Rename indexes back
    op.execute('ALTER INDEX ix_training_assignments_batch_id RENAME TO ix_training_assessments_batch_id')
    op.execute('ALTER INDEX ix_training_assignments_candidate_id RENAME TO ix_training_assessments_candidate_id')
    op.execute('ALTER INDEX ix_training_assignments_id RENAME TO ix_training_assessments_id')
    op.execute('ALTER INDEX ix_training_assignments_is_deleted RENAME TO ix_training_assessments_is_deleted')
    op.execute('ALTER INDEX ix_training_assignments_trainer_id RENAME TO ix_training_assessments_trainer_id')
    # ### end Alembic commands ###
