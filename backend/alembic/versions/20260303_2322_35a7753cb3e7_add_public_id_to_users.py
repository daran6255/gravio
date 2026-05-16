"""add public_id to users

Revision ID: 35a7753cb3e7
Revises: 134885e270b6
Create Date: 2026-03-03 23:22:08.117454

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
import uuid


# revision identifiers, used by Alembic.
revision: str = '35a7753cb3e7'
down_revision: Union[str, None] = '134885e270b6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Check if column exists
    conn = op.get_bind()
    
    # Check column existence safely
    res = conn.execute(sa.text(
        "SELECT count(*) FROM information_schema.columns "
        "WHERE table_name='users' AND column_name='public_id'"
    ))
    column_exists = res.scalar() > 0

    if not column_exists:
        # Add public_id as nullable
        op.add_column('users', sa.Column('public_id', sa.Uuid(), nullable=True))
        
        # Custom script to populate public_id for existing users
        connection = op.get_bind()
        user_table = sa.table('users', sa.column('id', sa.Integer), sa.column('public_id', sa.Uuid))
        users = connection.execute(sa.select(user_table.c.id)).fetchall()
        
        for user in users:
            connection.execute(
                user_table.update().where(user_table.c.id == user.id).values(public_id=uuid.uuid4())
            )
        
        # Make non-nullable and add index
        op.alter_column('users', 'public_id', nullable=False)
        
    # Check if index exists safely before creating
    res_idx = conn.execute(sa.text(
        "SELECT count(*) FROM pg_class c "
        "JOIN pg_index i ON c.oid = i.indexrelid "
        "WHERE c.relname = 'ix_users_public_id'"
    ))
    index_exists = res_idx.scalar() > 0
    if not index_exists:
        op.create_index(op.f('ix_users_public_id'), 'users', ['public_id'], unique=True)


def downgrade() -> None:
    op.drop_index(op.f('ix_users_public_id'), table_name='users')
    op.drop_column('users', 'public_id')
