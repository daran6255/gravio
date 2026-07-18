export type ProjectStatus =
	| 'planning'
	| 'active'
	| 'in_progress'
	| 'delayed'
	| 'in_testing'
	| 'on_hold'
	| 'completed'
	| 'approved'
	| 'invoiced'
	| 'canceled';

/** Canonical status list/labels, shared by the table filter and forms. */
export const PROJECT_STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
	{ value: 'planning', label: 'Planning' },
	{ value: 'active', label: 'Active' },
	{ value: 'in_progress', label: 'In Progress' },
	{ value: 'delayed', label: 'Delayed' },
	{ value: 'in_testing', label: 'In Testing' },
	{ value: 'on_hold', label: 'On Hold' },
	{ value: 'completed', label: 'Completed' },
	{ value: 'approved', label: 'Approved' },
	{ value: 'invoiced', label: 'Invoiced' },
	{ value: 'canceled', label: 'Canceled' },
];

export interface Project {
	id: number;
	public_id: string;
	name: string;
	description?: string;
	owner_id?: number;
	company_id?: number;
	/** Set when this project was created by converting a Won CRM deal. */
	deal_id?: number;
	status: ProjectStatus;
	start_date?: string;
	end_date?: string;
	budget?: number;
	currency: string;
	phase?: string;
	issues?: string;
	tags?: string[];
	custom_fields?: Record<string, any>;
	created_at: string;
	updated_at: string;
	/** Only populated when the list/get endpoint eager-loads tasks. */
	task_count?: number;
	completed_task_count?: number;
	/** Only populated when the endpoint eager-loads the owner/company/deal relations. */
	owner_name?: string;
	company_name?: string;
	deal_title?: string;
}

/** Matches backend's ProjectCreate. */
export interface ProjectCreate {
	name: string;
	description?: string;
	owner_id?: number;
	company_id?: number;
	status?: ProjectStatus;
	start_date?: string;
	end_date?: string;
	budget?: number;
	currency?: string;
	phase?: string;
	issues?: string;
	template_key?: string;
	tags?: string[];
	custom_fields?: Record<string, any>;
	custom_tasks?: any[];
}

export interface ProjectUpdate extends Partial<ProjectCreate> { }

/** Matches backend's DealConvertToProjectRequest. */
export interface DealConvertToProjectRequest {
	name?: string;
	owner_id?: number;
	start_date?: string;
	end_date?: string;
	budget?: number;
	template_key?: string;
	custom_tasks?: any[];
}

export interface DealProjectConversionPreview {
	original_value?: number;
	original_currency: string;
	target_currency: string;
	converted_value?: number;
	rate?: number;
	rate_date?: string;
	converted: boolean;
}

export interface ProjectBudgetByCurrency {
	currency: string;
	total: number;
}

export interface ProjectDeadlineItem {
	public_id: string;
	name: string;
	end_date: string;
}

export interface ProjectStatusCount {
	status: ProjectStatus;
	count: number;
}

/** Matches backend's ProjectStatsResponse (GET /projects/stats). */
export interface ProjectStats {
	total_projects: number;
	status_counts: ProjectStatusCount[];
	overdue_count: number;
	total_tasks: number;
	completed_tasks: number;
	budget_by_currency: ProjectBudgetByCurrency[];
	upcoming_deadlines: ProjectDeadlineItem[];
	overdue_projects: ProjectDeadlineItem[];
}

