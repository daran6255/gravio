"""create_project_task_files

Revision ID: 39df748cf728
Revises: 8e3a306ef55f
Create Date: 2026-07-05 09:33:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '39df748cf728'
down_revision: Union[str, None] = '8e3a306ef55f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('project_task_files',
    sa.Column('public_id', sa.Uuid(), nullable=False),
    sa.Column('task_id', sa.Integer(), nullable=False),
    sa.Column('file_name', sa.String(length=255), nullable=False),
    sa.Column('file_path', sa.String(length=512), nullable=False),
    sa.Column('file_size', sa.Integer(), nullable=False),
    sa.Column('mime_type', sa.String(length=100), nullable=False),
    sa.Column('owner_id', sa.Integer(), nullable=True),
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('is_deleted', sa.Boolean(), nullable=False),
    sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('organization_id', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], ),
    sa.ForeignKeyConstraint(['owner_id'], ['users.id'], ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['task_id'], ['project_tasks.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_project_task_files_id'), 'project_task_files', ['id'], unique=False)
    op.create_index(op.f('ix_project_task_files_is_deleted'), 'project_task_files', ['is_deleted'], unique=False)
    op.create_index(op.f('ix_project_task_files_organization_id'), 'project_task_files', ['organization_id'], unique=False)
    op.create_index(op.f('ix_project_task_files_owner_id'), 'project_task_files', ['owner_id'], unique=False)
    op.create_index(op.f('ix_project_task_files_public_id'), 'project_task_files', ['public_id'], unique=True)
    op.create_index(op.f('ix_project_task_files_task_id'), 'project_task_files', ['task_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_project_task_files_task_id'), table_name='project_task_files')
    op.drop_index(op.f('ix_project_task_files_public_id'), table_name='project_task_files')
    op.drop_index(op.f('ix_project_task_files_owner_id'), table_name='project_task_files')
    op.drop_index(op.f('ix_project_task_files_organization_id'), table_name='project_task_files')
    op.drop_index(op.f('ix_project_task_files_is_deleted'), table_name='project_task_files')
    op.drop_index(op.f('ix_project_task_files_id'), table_name='project_task_files')
    op.drop_table('project_task_files')
