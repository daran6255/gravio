"""revert_multi_tenant_to_baseline

Revision ID: efe3746623c0
Revises: 7d562a410c63
Create Date: 2026-03-24 18:24:00

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'efe3746623c0'
down_revision: Union[str, None] = '7d562a410c63'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


TABLES_WITH_ORG_ID = [
    "users",
    "activity_logs",
    "candidate_assignments",
    "candidate_screenings",
    "candidate_documents",
    "candidate_counseling",
    "leads",
    "deals",
    "crm_tasks",
    "crm_activities",
    "training_batches",
    "training_batch_extensions",
    "training_candidate_allocations",
    "training_attendance",
    "training_assignments",
    "training_sessions",
    "training_enrolments",
    "assessments",
    "assessment_questions",
    "assessment_results",
    "assessment_responses",
    "training_mock_interviews",
    "training_batch_events",
    "training_batch_plans",
    "ticket_messages",
    "dsr_activity_assignments",
    "dsr_activities",
    "dsr_projects",
    "dsr_entries",
    "dsr_leaves",
    "holidays",
    "whatsapp_messages",
    "notifications",
    "ai_chatbot_settings",
    "analytics_reports",
    "tickets",
    "system_settings",
]


def upgrade() -> None:
    # This migration is a dummy for when the database is already at efe3746623c0
    # but the intermediate file history is lost.
    # It allows downgrade back to 7d562a410c63.
    pass


def downgrade() -> None:
    connection = op.get_bind()
    
    # 1. Use dynamic SQL to drop the org_id column from ALL tables in the public schema
    connection.execute(sa.text("""
        DO $$ 
        DECLARE 
            r RECORD;
        BEGIN 
            FOR r IN (
                SELECT table_name 
                FROM information_schema.columns 
                WHERE column_name = 'org_id' 
                  AND table_schema = 'public'
            ) LOOP 
                -- Drop the column with CASCADE to automatically handle associated constraints/indexes
                EXECUTE 'ALTER TABLE ' || quote_ident(r.table_name) || ' DROP COLUMN IF EXISTS org_id CASCADE';
            END LOOP;
        END $$;
    """))

    # 2. Revert notification table specific changes (soft delete columns)
    connection.execute(sa.text("""
        DO $$ 
        BEGIN 
            IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename  = 'notifications') THEN 
                EXECUTE 'ALTER TABLE notifications DROP COLUMN IF EXISTS deleted_at CASCADE';
                EXECUTE 'ALTER TABLE notifications DROP COLUMN IF EXISTS is_deleted CASCADE';
            END IF;
        END $$;
    """))

    # 3. Drop organization related tables with CASCADE for safety
    connection.execute(sa.text("DROP TABLE IF EXISTS organization_memberships CASCADE"))
    connection.execute(sa.text("DROP TABLE IF EXISTS organizations CASCADE"))
