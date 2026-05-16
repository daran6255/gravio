"""rename candidate allocation table and add dropout fields

Revision ID: 8b5a1d57ffb5
Revises: bdb2a669bad2
Create Date: 2026-01-09 12:35:01.159339

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '8b5a1d57ffb5'
down_revision: Union[str, None] = 'bdb2a669bad2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Rename table
    op.rename_table('candidate_allocations', 'training_candidate_allocations')
    
    # Add new columns with server_default to avoid null issues on existing rows
    op.add_column('training_candidate_allocations', sa.Column('is_dropout', sa.Boolean(), nullable=False, server_default=sa.text('false')))
    op.add_column('training_candidate_allocations', sa.Column('dropout_remark', sa.String(length=500), nullable=True))
    
    # Rename indices and constraints for consistency
    op.execute('ALTER INDEX ix_candidate_allocations_batch_id RENAME TO ix_training_candidate_allocations_batch_id')
    op.execute('ALTER INDEX ix_candidate_allocations_candidate_id RENAME TO ix_training_candidate_allocations_candidate_id')
    op.execute('ALTER INDEX ix_candidate_allocations_id RENAME TO ix_training_candidate_allocations_id')
    op.execute('ALTER INDEX ix_candidate_allocations_is_deleted RENAME TO ix_training_candidate_allocations_is_deleted')
    op.execute('ALTER INDEX ix_candidate_allocations_public_id RENAME TO ix_training_candidate_allocations_public_id')
    
    # Create new index for is_dropout
    op.create_index(op.f('ix_training_candidate_allocations_is_dropout'), 'training_candidate_allocations', ['is_dropout'], unique=False)


def downgrade() -> None:
    # Remove index
    op.drop_index(op.f('ix_training_candidate_allocations_is_dropout'), table_name='training_candidate_allocations')
    
    # Rename indices back
    op.execute('ALTER INDEX ix_training_candidate_allocations_batch_id RENAME TO ix_candidate_allocations_batch_id')
    op.execute('ALTER INDEX ix_training_candidate_allocations_candidate_id RENAME TO ix_candidate_allocations_candidate_id')
    op.execute('ALTER INDEX ix_training_candidate_allocations_id RENAME TO ix_candidate_allocations_id')
    op.execute('ALTER INDEX ix_training_candidate_allocations_is_deleted RENAME TO ix_candidate_allocations_is_deleted')
    op.execute('ALTER INDEX ix_training_candidate_allocations_public_id RENAME TO ix_candidate_allocations_public_id')
    
    # Remove columns
    op.drop_column('training_candidate_allocations', 'dropout_remark')
    op.drop_column('training_candidate_allocations', 'is_dropout')
    
    # Rename table back
    op.rename_table('training_candidate_allocations', 'candidate_allocations')
    # ### end Alembic commands ###
