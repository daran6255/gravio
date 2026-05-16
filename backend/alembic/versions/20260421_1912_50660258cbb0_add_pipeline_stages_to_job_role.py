"""add_pipeline_stages_to_job_role

Revision ID: 50660258cbb0
Revises: c61a61483442
Create Date: 2026-04-21 19:12:10.356217

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '50660258cbb0'
down_revision: Union[str, None] = 'c61a61483442'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


import json

def upgrade() -> None:
    # 1. Add pipeline_stages column to job_roles
    op.add_column('job_roles', sa.Column('pipeline_stages', sa.JSON(), nullable=True))
    
    # 2. Define default stages
    default_stages = [
        {"id": "mapped", "label": "Mapped", "category": "lead"},
        {"id": "shortlisted", "label": "Shortlisted", "category": "shortlisted"},
        {"id": "interview_l1", "label": "L1 Interview", "category": "interview"},
        {"id": "offered", "label": "Offered", "category": "offer"},
        {"id": "joined", "label": "Joined", "category": "hired"},
        {"id": "rejected", "label": "Rejected", "category": "rejected"},
        {"id": "not_joined", "label": "Not Joined", "category": "not_joined"}
    ]
    default_stages_json = json.dumps(default_stages)
    
    # 3. Update existing job roles with default stages
    op.execute(f"UPDATE job_roles SET pipeline_stages = '{default_stages_json}' WHERE pipeline_stages IS NULL")
    
    # 4. Migrate 'applied' status to 'mapped' in placement_mappings
    op.execute("UPDATE placement_mappings SET status = 'mapped' WHERE status = 'applied'")
    
    # 5. Update history as well
    op.execute("UPDATE placement_pipeline_history SET from_status = 'mapped' WHERE from_status = 'applied'")
    op.execute("UPDATE placement_pipeline_history SET to_status = 'mapped' WHERE to_status = 'applied'")


def downgrade() -> None:
    # 1. Revert 'mapped' back to 'applied' for compatibility (if needed)
    op.execute("UPDATE placement_mappings SET status = 'applied' WHERE status = 'mapped'")
    op.execute("UPDATE placement_pipeline_history SET from_status = 'applied' WHERE from_status = 'mapped'")
    op.execute("UPDATE placement_pipeline_history SET to_status = 'applied' WHERE to_status = 'mapped'")
    
    # 2. Drop the column
    op.drop_column('job_roles', 'pipeline_stages')
