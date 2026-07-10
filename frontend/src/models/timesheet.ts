import type { Project } from './projects/project';
import type { ProjectTask } from './projects/projectTask';

export type TimesheetBillingType = 'billable' | 'non_billable';
export type TimesheetStatus = 'draft' | 'submitted' | 'approved' | 'rejected';
export type HolidayType = 'public' | 'org' | 'custom';
export type WeekUnlockStatus = 'pending' | 'approved' | 'denied';

export interface TimesheetCategory {
	id: number;
	user_id?: number;
	name: string;
	color?: string;
	is_org_default: boolean;
	created_at: string;
	updated_at: string;
}

export interface OrgHoliday {
	id: number;
	public_id: string;
	name: string;
	holiday_date: string; // YYYY-MM-DD
	type: HolidayType;
	country_code?: string;
	created_at: string;
	updated_at: string;
}

export interface TimesheetUserSettings {
	id: number;
	user_id: number;
	can_log_on_holidays: boolean;
	max_retroactive_days?: number;
	created_at: string;
	updated_at: string;
}

export interface ProjectTimeLog {
	id: number;
	public_id: string;
	user_id: number;
	project_id?: number;
	task_id?: number;
	category_id?: number;
	log_date: string; // YYYY-MM-DD
	hours: number;
	notes?: string;
	billing_type: TimesheetBillingType;
	status: TimesheetStatus;
	rejection_note?: string;
	approved_by_id?: number;
	approved_at?: string;
	is_holiday_override: boolean;
	created_at: string;
	updated_at: string;
	
	// Preloaded relationships
	project?: Project;
	task?: ProjectTask;
	category?: TimesheetCategory;
	user?: {
		id: number;
		full_name?: string;
		email: string;
		role: string;
		reporting_manager_id?: number;
	};
}

export interface TimesheetSubmitWeekRequest {
	start_date: string; // YYYY-MM-DD
	end_date: string;   // YYYY-MM-DD
}

export interface TimesheetApproveRejectRequest {
	rejection_note?: string;
}

export interface TimesheetWeekUnlockRequest {
	id: number;
	public_id: string;
	user_id: number;
	week_start_date: string; // YYYY-MM-DD, Monday
	week_end_date: string;   // YYYY-MM-DD, Sunday
	status: WeekUnlockStatus;
	reason?: string;
	resolved_by_id?: number;
	resolved_at?: string;
	resolution_note?: string;
	consumed_at?: string;
	created_at: string;
	updated_at: string;
	user?: {
		id: number;
		full_name?: string;
		email: string;
		role: string;
		reporting_manager_id?: number;
	};
}

export interface TimesheetReportRow {
	user_id: number;
	user_name: string;
	project_id?: number;
	project_name?: string;
	task_id?: number;
	task_title?: string;
	category_id?: number;
	category_name?: string;
	billing_type: TimesheetBillingType;
	total_hours: number;
}
