"""add document metadata columns

Revision ID: e73a835eb73a
Revises: a5b8f2b1e6a1
Create Date: 2026-07-12 08:13:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'e73a835eb73a'
down_revision = 'a5b8f2b1e6a1'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('hr_employee_documents', sa.Column('file_name', sa.String(length=255), nullable=True))
    op.add_column('hr_employee_documents', sa.Column('file_size', sa.Integer(), nullable=True))
    op.add_column('hr_employee_documents', sa.Column('uploaded_by_id', sa.Integer(), nullable=True))
    op.create_foreign_key(
        'fk_hr_employee_documents_uploaded_by_id_users',
        'hr_employee_documents', 'users',
        ['uploaded_by_id'], ['id'],
        ondelete='SET NULL'
    )


def downgrade() -> None:
    op.drop_constraint('fk_hr_employee_documents_uploaded_by_id_users', 'hr_employee_documents', type_='foreignkey')
    op.drop_column('hr_employee_documents', 'uploaded_by_id')
    op.drop_column('hr_employee_documents', 'file_size')
    op.drop_column('hr_employee_documents', 'file_name')
