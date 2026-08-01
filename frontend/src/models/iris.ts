/** Shared "Ask IRIS" propose-then-confirm types, reused by the Timesheets/Leaves/Meetings
 * IRIS panels the same way IrisTaskPanel uses its own project-scoped copies. Matches
 * backend's IrisPlannedStep / IrisPreviewResponse (app/schemas/project.py) and
 * AuditLogResponse (app/schemas/crm.py), which the module-scoped /iris/preview, /iris/execute,
 * and /iris/activity endpoints (timesheets.py, hr.py, booking.py) reuse as-is. */

export interface IrisPlannedStep {
	tool_name: string;
	parameters: Record<string, any>;
	reasoning?: string | null;
}

export interface IrisPreviewResponse {
	task_name: string;
	response_to_user?: string | null;
	reasoning: string;
	estimated_record_impact: number;
	steps: IrisPlannedStep[];
}

/** One row from a module's /iris/activity feed -- an audit-log comment IRIS posted after
 * a confirmed action. Matches backend's AuditLogResponse. */
export interface IrisActivityEntry {
	id: number;
	action: string;
	field_name?: string | null;
	old_value?: string | null;
	new_value?: string | null;
	changed_by_user_id?: number | null;
	changed_at: string;
}
