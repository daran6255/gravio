"""add_role_and_activity_logs

Revision ID: d20b1e512fc5
Revises: eccedc755053
Create Date: 2025-12-08 08:52:50.171782

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'd20b1e512fc5'
down_revision: Union[str, None] = 'eccedc755053'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    connection = op.get_bind()
    
    # Create UserRole enum type if not exists
    connection.execute(sa.text("""
        DO $$ BEGIN
            CREATE TYPE userrole AS ENUM ('admin', 'manager', 'sourcing', 'placement', 'trainer');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """))
    
    # Add role column to users table if it doesn't exist
    columns = [col['name'] for col in sa.inspect(connection).get_columns('users')]
    if 'role' not in columns:
        connection.execute(sa.text("""
            ALTER TABLE users ADD COLUMN role userrole DEFAULT 'placement' NOT NULL;
        """))
        
        # Create index on role column
        connection.execute(sa.text("""
            CREATE INDEX IF NOT EXISTS ix_users_role ON users (role);
        """))
    
    # Create ActionType enum type if not exists  
    connection.execute(sa.text("""
        DO $$ BEGIN
            CREATE TYPE actiontype AS ENUM ('create', 'read', 'update', 'delete', 'login', 'logout');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """))
    
    # Check if activity_logs table exists
    tables = sa.inspect(connection).get_table_names()
    if 'activity_logs' not in tables:
        # Create activity_logs table
        connection.execute(sa.text("""
            CREATE TABLE activity_logs (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                action_type actiontype NOT NULL,
                endpoint VARCHAR(255) NOT NULL,
                method VARCHAR(10) NOT NULL,
                resource_type VARCHAR(100),
                resource_id INTEGER,
                changes JSONB,
                ip_address VARCHAR(45),
                user_agent VARCHAR(500),
                status_code INTEGER,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
                deleted_at TIMESTAMPTZ
            );
        """))
        
        # Create indexes
        connection.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_activity_logs_id ON activity_logs (id);"))
        connection.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_activity_logs_user_id ON activity_logs (user_id);"))
        connection.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_activity_logs_action_type ON activity_logs (action_type);"))
        connection.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_activity_logs_resource_type ON activity_logs (resource_type);"))
        connection.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_activity_logs_is_deleted ON activity_logs (is_deleted);"))
        connection.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_activity_logs_user_created ON activity_logs (user_id, created_at);"))


def downgrade() -> None:
    # Drop indexes
    op.drop_index('ix_activity_logs_user_created', table_name='activity_logs')
    op.drop_index(op.f('ix_activity_logs_is_deleted'), table_name='activity_logs')
    op.drop_index(op.f('ix_activity_logs_resource_type'), table_name='activity_logs')
    op.drop_index(op.f('ix_activity_logs_action_type'), table_name='activity_logs')
    op.drop_index(op.f('ix_activity_logs_user_id'), table_name='activity_logs')
    op.drop_index(op.f('ix_activity_logs_id'), table_name='activity_logs')
    
    # Drop activity_logs table
    op.drop_table('activity_logs')
    
    # Drop ActionType enum
    sa.Enum(name='actiontype').drop(op.get_bind(), checkfirst=True)
    
    # Drop index on users.role
    op.drop_index(op.f('ix_users_role'), table_name='users')
    
    # Drop role column from users table
    op.drop_column('users', 'role')
    
    # Drop UserRole enum
    sa.Enum(name='userrole').drop(op.get_bind(), checkfirst=True)
