"""cascade delete organization children

Every tenant-scoped table has an organization_id foreign key with no ON DELETE
rule (implicit NO ACTION), so deleting an Organization via the Super Admin
console fails with a ForeignKeyViolationError the moment that org has any real
data (a CRM pipeline, a project, a timesheet category, etc. — all of which are
auto-provisioned at signup). All *other* foreign keys in the schema already
carry an explicit ondelete rule (CASCADE/SET NULL/RESTRICT as appropriate) —
this migration closes the one remaining gap so Organization deletion cascades
correctly. Also covers refresh_tokens.user_id so a cascaded user deletion
doesn't hit the same problem one hop down.

Revision ID: c8f3d2a91b47
Revises: e73a835eb73a
Create Date: 2026-07-17 18:00:00.000000
"""
from alembic import op

# revision identifiers, used by Alembic.
revision = 'c8f3d2a91b47'
down_revision = 'e73a835eb73a'
branch_labels = None
depends_on = None


# Every table with a direct organization_id -> organizations.id foreign key.
ORG_SCOPED_TABLES = [
    'ai_usage_counters',
    'audit_logs',
    'crm_activities',
    'crm_companies',
    'crm_contacts',
    'crm_deal_tasks',
    'crm_deals',
    'crm_files',
    'crm_lead_tasks',
    'crm_leads',
    'crm_pipelines',
    'crm_reminders',
    'crm_tags',
    'hr_checklist_instances',
    'hr_checklist_templates',
    'hr_departments',
    'hr_designations',
    'hr_employee_documents',
    'hr_employee_profiles',
    'hr_employee_salaries',
    'hr_leave_balances',
    'hr_leave_requests',
    'hr_leave_types',
    'hr_payroll_runs',
    'hr_payslips',
    'hr_salary_components',
    'hr_salary_structures',
    'hr_variable_pay_entries',
    'notifications',
    'org_holidays',
    'project_task_files',
    'project_task_statuses',
    'project_tasks',
    'project_time_logs',
    'projects',
    'timesheet_user_settings',
    'timesheet_week_unlock_requests',
    'user_timesheet_categories',
    'users',
]


def upgrade() -> None:
    for table in ORG_SCOPED_TABLES:
        constraint = f'{table}_organization_id_fkey'
        op.drop_constraint(constraint, table, type_='foreignkey')
        op.create_foreign_key(
            constraint, table, 'organizations',
            ['organization_id'], ['id'],
            ondelete='CASCADE'
        )

    op.drop_constraint('refresh_tokens_user_id_fkey', 'refresh_tokens', type_='foreignkey')
    op.create_foreign_key(
        'refresh_tokens_user_id_fkey', 'refresh_tokens', 'users',
        ['user_id'], ['id'],
        ondelete='CASCADE'
    )


def downgrade() -> None:
    for table in ORG_SCOPED_TABLES:
        constraint = f'{table}_organization_id_fkey'
        op.drop_constraint(constraint, table, type_='foreignkey')
        op.create_foreign_key(
            constraint, table, 'organizations',
            ['organization_id'], ['id']
        )

    op.drop_constraint('refresh_tokens_user_id_fkey', 'refresh_tokens', type_='foreignkey')
    op.create_foreign_key(
        'refresh_tokens_user_id_fkey', 'refresh_tokens', 'users',
        ['user_id'], ['id']
    )
