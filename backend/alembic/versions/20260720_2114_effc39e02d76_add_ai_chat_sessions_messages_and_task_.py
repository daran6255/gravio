"""add ai chat sessions, messages, and task logs tables

Revision ID: effc39e02d76
Revises: c22e081cd0ae
Create Date: 2026-07-20 21:14:29.042253

Hand-trimmed from autogenerate output: the raw diff also picked up ~50 lines of unrelated
pre-existing schema drift across crm_*, project_time_logs, org_holidays, timesheet_* tables
(server defaults, index naming, unique-constraint naming) that predates this change and isn't
part of it — same drift pattern seen in c22e081cd0ae. Only the three new AI tables are kept here.
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'effc39e02d76'
down_revision: Union[str, None] = 'c22e081cd0ae'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('ai_chat_sessions',
    sa.Column('public_id', sa.Uuid(), nullable=False),
    sa.Column('title', sa.String(length=255), nullable=False, comment='Auto-generated or user-defined conversation title'),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('is_active', sa.Boolean(), nullable=False),
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('is_deleted', sa.Boolean(), nullable=False),
    sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('organization_id', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_ai_chat_sessions_id'), 'ai_chat_sessions', ['id'], unique=False)
    op.create_index(op.f('ix_ai_chat_sessions_is_deleted'), 'ai_chat_sessions', ['is_deleted'], unique=False)
    op.create_index(op.f('ix_ai_chat_sessions_organization_id'), 'ai_chat_sessions', ['organization_id'], unique=False)
    op.create_index(op.f('ix_ai_chat_sessions_public_id'), 'ai_chat_sessions', ['public_id'], unique=True)
    op.create_index(op.f('ix_ai_chat_sessions_user_id'), 'ai_chat_sessions', ['user_id'], unique=False)
    op.create_table('ai_task_logs',
    sa.Column('public_id', sa.Uuid(), nullable=False),
    sa.Column('task_name', sa.String(length=255), nullable=False, comment="Human-readable task name, e.g. 'Process WhatsApp Enquiry'"),
    sa.Column('trigger', sa.Enum('manual', 'webhook', 'schedule', 'api', 'system', name='aitasktrigger'), nullable=False),
    sa.Column('status', sa.Enum('pending', 'planning', 'running', 'awaiting_approval', 'completed', 'partially_completed', 'failed', 'cancelled', name='aitaskstatus'), nullable=False),
    sa.Column('triggered_by_user_id', sa.Integer(), nullable=True, comment='User who triggered this task (null for automated/webhook triggers)'),
    sa.Column('chat_session_id', sa.Integer(), nullable=True, comment='Chat session from which this task was spawned'),
    sa.Column('ai_provider', sa.String(length=50), nullable=True, comment='LLM provider used: gemini, openai, ollama'),
    sa.Column('ai_model', sa.String(length=100), nullable=True, comment='Exact model name used, e.g. gemini-1.5-flash'),
    sa.Column('raw_input', sa.JSON(), nullable=True, comment='The original trigger input payload (e.g., WhatsApp message data)'),
    sa.Column('context_snapshot', sa.JSON(), nullable=True, comment='DB context loaded before planning (e.g., existing contact record)'),
    sa.Column('plan', sa.JSON(), nullable=True, comment='Ordered list of tool calls the LLM planned to make'),
    sa.Column('plan_reasoning', sa.Text(), nullable=True, comment="LLM's chain-of-thought reasoning for this plan"),
    sa.Column('steps', sa.JSON(), nullable=True, comment='Ordered list of ToolStepLog dicts capturing every tool call result'),
    sa.Column('tools_called', sa.Integer(), nullable=False, comment='Total number of tool calls made in this run'),
    sa.Column('tools_succeeded', sa.Integer(), nullable=False),
    sa.Column('tools_failed', sa.Integer(), nullable=False),
    sa.Column('records_affected', sa.Integer(), nullable=False, comment='Total DB records created/updated across all tool calls'),
    sa.Column('requires_approval', sa.Boolean(), nullable=False, comment='True if this task was paused pending human approval'),
    sa.Column('approved_by_user_id', sa.Integer(), nullable=True, comment='User who approved this task (if approval was required)'),
    sa.Column('approved_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('summary', sa.Text(), nullable=True, comment='AI-generated human-readable summary of what was accomplished'),
    sa.Column('error_message', sa.Text(), nullable=True, comment='Top-level error if the task failed entirely'),
    sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('duration_ms', sa.Integer(), nullable=True, comment='Total wall-clock time in milliseconds'),
    sa.Column('llm_tokens_used', sa.Integer(), nullable=True),
    sa.Column('llm_cost_usd', sa.Float(), nullable=True, comment='Estimated LLM cost in USD for this task run'),
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('is_deleted', sa.Boolean(), nullable=False),
    sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('organization_id', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['approved_by_user_id'], ['users.id'], ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['chat_session_id'], ['ai_chat_sessions.id'], ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['triggered_by_user_id'], ['users.id'], ondelete='SET NULL'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_ai_task_logs_chat_session_id'), 'ai_task_logs', ['chat_session_id'], unique=False)
    op.create_index(op.f('ix_ai_task_logs_id'), 'ai_task_logs', ['id'], unique=False)
    op.create_index(op.f('ix_ai_task_logs_is_deleted'), 'ai_task_logs', ['is_deleted'], unique=False)
    op.create_index(op.f('ix_ai_task_logs_organization_id'), 'ai_task_logs', ['organization_id'], unique=False)
    op.create_index(op.f('ix_ai_task_logs_public_id'), 'ai_task_logs', ['public_id'], unique=True)
    op.create_index(op.f('ix_ai_task_logs_status'), 'ai_task_logs', ['status'], unique=False)
    op.create_index(op.f('ix_ai_task_logs_task_name'), 'ai_task_logs', ['task_name'], unique=False)
    op.create_index(op.f('ix_ai_task_logs_trigger'), 'ai_task_logs', ['trigger'], unique=False)
    op.create_index(op.f('ix_ai_task_logs_triggered_by_user_id'), 'ai_task_logs', ['triggered_by_user_id'], unique=False)
    op.create_table('ai_chat_messages',
    sa.Column('session_id', sa.Integer(), nullable=False),
    sa.Column('role', sa.String(length=20), nullable=False, comment='OpenAI-compatible role: user | assistant | system'),
    sa.Column('content', sa.Text(), nullable=False, comment='Raw text content of the message'),
    sa.Column('tokens', sa.Integer(), nullable=True, comment='Token count for this single message'),
    sa.Column('task_log_id', sa.Integer(), nullable=True, comment="If this message triggered an agentic task (tool use), it's linked here."),
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('is_deleted', sa.Boolean(), nullable=False),
    sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('organization_id', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['session_id'], ['ai_chat_sessions.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['task_log_id'], ['ai_task_logs.id'], ondelete='SET NULL'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_ai_chat_messages_id'), 'ai_chat_messages', ['id'], unique=False)
    op.create_index(op.f('ix_ai_chat_messages_is_deleted'), 'ai_chat_messages', ['is_deleted'], unique=False)
    op.create_index(op.f('ix_ai_chat_messages_organization_id'), 'ai_chat_messages', ['organization_id'], unique=False)
    op.create_index(op.f('ix_ai_chat_messages_session_id'), 'ai_chat_messages', ['session_id'], unique=False)
    op.create_index(op.f('ix_ai_chat_messages_task_log_id'), 'ai_chat_messages', ['task_log_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_ai_chat_messages_task_log_id'), table_name='ai_chat_messages')
    op.drop_index(op.f('ix_ai_chat_messages_session_id'), table_name='ai_chat_messages')
    op.drop_index(op.f('ix_ai_chat_messages_organization_id'), table_name='ai_chat_messages')
    op.drop_index(op.f('ix_ai_chat_messages_is_deleted'), table_name='ai_chat_messages')
    op.drop_index(op.f('ix_ai_chat_messages_id'), table_name='ai_chat_messages')
    op.drop_table('ai_chat_messages')
    op.drop_index(op.f('ix_ai_task_logs_triggered_by_user_id'), table_name='ai_task_logs')
    op.drop_index(op.f('ix_ai_task_logs_trigger'), table_name='ai_task_logs')
    op.drop_index(op.f('ix_ai_task_logs_task_name'), table_name='ai_task_logs')
    op.drop_index(op.f('ix_ai_task_logs_status'), table_name='ai_task_logs')
    op.drop_index(op.f('ix_ai_task_logs_public_id'), table_name='ai_task_logs')
    op.drop_index(op.f('ix_ai_task_logs_organization_id'), table_name='ai_task_logs')
    op.drop_index(op.f('ix_ai_task_logs_is_deleted'), table_name='ai_task_logs')
    op.drop_index(op.f('ix_ai_task_logs_id'), table_name='ai_task_logs')
    op.drop_index(op.f('ix_ai_task_logs_chat_session_id'), table_name='ai_task_logs')
    op.drop_table('ai_task_logs')
    op.drop_index(op.f('ix_ai_chat_sessions_user_id'), table_name='ai_chat_sessions')
    op.drop_index(op.f('ix_ai_chat_sessions_public_id'), table_name='ai_chat_sessions')
    op.drop_index(op.f('ix_ai_chat_sessions_organization_id'), table_name='ai_chat_sessions')
    op.drop_index(op.f('ix_ai_chat_sessions_is_deleted'), table_name='ai_chat_sessions')
    op.drop_index(op.f('ix_ai_chat_sessions_id'), table_name='ai_chat_sessions')
    op.drop_table('ai_chat_sessions')
