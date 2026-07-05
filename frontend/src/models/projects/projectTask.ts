import type { LeadPriority } from '../crm/lead';

export type BillingType = 'billable' | 'non_billable';

/** A task tag with a user-chosen color. Matches backend's ProjectTaskTag. */
export interface ProjectTaskTag {
	name: string;
	color: string;
}

/** A tenant-configurable task workflow column (e.g. "To Do", "In Progress").
 * Matches backend's ProjectTaskStatusResponse exactly. */
export interface ProjectTaskStatus {
	id: number;
	name: string;
	order: number;
	color: string;
	is_initial_status: boolean;
	is_done_status: boolean;
	custom_fields?: Record<string, any>;
}

export interface ProjectTaskStatusUpsert {
	id?: number;
	name: string;
	order: number;
	color: string;
	is_initial_status: boolean;
	is_done_status: boolean;
	custom_fields?: Record<string, any>;
}

/** A task in a project. Sub-tasks are ProjectTask rows with parent_task_id set --
 * same shape as a top-level task. Matches backend's ProjectTaskResponse exactly. */
export interface ProjectTask {
	id: number;
	public_id: string;
	project_id: number;
	parent_task_id?: number;
	title: string;
	description?: string | null;
	status_id: number;
	priority: LeadPriority;
	assignee_id?: number;
	due_date?: string;
	start_date?: string;
	completed_at?: string;
	order: number;
	estimated_hours?: number;
	actual_hours?: number;
	billing_type: BillingType;
	tags?: ProjectTaskTag[];
	custom_fields?: Record<string, any>;
	created_at: string;
	updated_at: string;
}

/** Matches backend's ProjectTaskCreate — also used to create a sub-task
 * (parent_task_id is derived from the URL, not this payload). */
export interface ProjectTaskCreate {
	title: string;
	description?: string | null;
	status_id?: number;
	priority?: LeadPriority;
	assignee_id?: number;
	due_date?: string;
	start_date?: string;
	order?: number;
	estimated_hours?: number;
	actual_hours?: number;
	billing_type?: BillingType;
	tags?: ProjectTaskTag[];
	custom_fields?: Record<string, any>;
}

export interface ProjectTaskUpdate extends Partial<ProjectTaskCreate> {
	/** Allows re-parenting a sub-task. */
	parent_task_id?: number;
}

/** A file attached to a task. Matches backend's ProjectTaskFileResponse. */
export interface ProjectTaskFile {
	id: number;
	public_id: string;
	task_id: number;
	file_name: string;
	file_size: number;
	mime_type: string;
	owner_id?: number;
	owner_name?: string;
	created_at: string;
	updated_at: string;
}
