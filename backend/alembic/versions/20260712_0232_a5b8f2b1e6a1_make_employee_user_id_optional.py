"""make_employee_user_id_optional

Revision ID: a5b8f2b1e6a1
Revises: 97986451f5d4
Create Date: 2026-07-12 02:32:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a5b8f2b1e6a1'
down_revision: Union[str, None] = '97986451f5d4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Employee profiles can now exist before the person has a Gravit login
    # ("pre-invite") — user_id is set later via the invite flow.
    op.alter_column('hr_employee_profiles', 'user_id', existing_type=sa.Integer(), nullable=True)

    op.add_column('hr_employee_profiles', sa.Column('full_name', sa.String(length=255), nullable=True))
    op.add_column('hr_employee_profiles', sa.Column('email', sa.String(length=255), nullable=True))
    op.add_column('hr_employee_profiles', sa.Column('phone', sa.String(length=50), nullable=True))
    op.create_index(op.f('ix_hr_employee_profiles_email'), 'hr_employee_profiles', ['email'], unique=False)


def downgrade() -> None:
    # NOTE: this will fail if any pre-invite rows (user_id IS NULL) exist —
    # they would need to be backfilled or removed before downgrading.
    op.drop_index(op.f('ix_hr_employee_profiles_email'), table_name='hr_employee_profiles')
    op.drop_column('hr_employee_profiles', 'phone')
    op.drop_column('hr_employee_profiles', 'email')
    op.drop_column('hr_employee_profiles', 'full_name')

    op.alter_column('hr_employee_profiles', 'user_id', existing_type=sa.Integer(), nullable=False)
