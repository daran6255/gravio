"""Migrate status data from JSON to String

Revision ID: e1a06a40bdd2
Revises: 1986f22b0e89
Create Date: 2026-02-14 19:13:55.906398

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e1a06a40bdd2'
down_revision: Union[str, None] = '1986f22b0e89'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


import json

def upgrade() -> None:
    bind = op.get_bind()
    
    # Use raw SQL to fetch data to avoid model definition issues
    # Select rows where status looks like JSON
    try:
        result = bind.execute(sa.text("SELECT id, status, others FROM training_candidate_allocations"))
        
        for row in result:
            id_val = row[0]
            status_val = row[1]
            others_val = row[2]
            
            # Check if status looks like a JSON object (starts with {)
            # Since the previous migration changed the column type to String,
            # legacy JSON data is now a string representation of that JSON.
            if isinstance(status_val, str) and status_val.strip().startswith('{'):
                try:
                    # Parse JSON
                    status_json = json.loads(status_val)
                    
                    # Extract simple status string
                    # DefaultKey: 'current' usually holds the status
                    new_status = status_json.get('current', 'allocated')
                    
                    # Update others with any extra data from status
                    new_others = dict(others_val) if others_val else {}
                    
                    # Move 'completed_at' to others if present
                    if 'completed_at' in status_json:
                        new_others['completed_at'] = status_json['completed_at']
                    
                    # Move history to others if present
                    if 'history' in status_json:
                        new_others['status_history'] = status_json['history']
                    
                    # Move actual raw status to legacy_status for safety
                    new_others['legacy_status_json'] = status_json

                    # Update the row
                    # We pass 'others' as string because text() usually expects simpler types
                    # but PostgreSQL casts JSON-compatible string to JSON type automatically
                    bind.execute(
                        sa.text("UPDATE training_candidate_allocations SET status = :status, others = :others WHERE id = :id"),
                        {"status": new_status, "others": json.dumps(new_others), "id": id_val}
                    )
                    
                except json.JSONDecodeError:
                    print(f"Skipping allocation {id_val}: Invalid JSON in status")
                except Exception as e:
                    print(f"Failed to migrate allocation {id_val}: {e}")
                    
    except Exception as e:
        print(f"An error occurred during data migration: {e}")


def downgrade() -> None:
    pass
