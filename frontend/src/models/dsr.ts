export type DSRActivityStatus = 'planned' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled';

export const DSRActivityStatusValues = {
	PLANNED: 'planned' as DSRActivityStatus,
	IN_PROGRESS: 'in_progress' as DSRActivityStatus,
	COMPLETED: 'completed' as DSRActivityStatus,
	ON_HOLD: 'on_hold' as DSRActivityStatus,
	CANCELLED: 'cancelled' as DSRActivityStatus
};

export type DSRStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

export const DSRStatusValues = {
	DRAFT: 'draft' as DSRStatus,
	SUBMITTED: 'submitted' as DSRStatus,
	APPROVED: 'approved' as DSRStatus,
	REJECTED: 'rejected' as DSRStatus
};

export interface DSRUserSnapshot {
	id: number;
	public_id: string;
	full_name: string | null;
	username: string;
	email: string;
}

export interface DSRProject {
	id: number;
	public_id: string;
	name: string;
	project_type: 'standard' | 'training';
	linked_batch_id?: number | null;
	linked_batch_name?: string | null;
	linked_batch?: {
		public_id: string;
		batch_name: string;
	};
	linked_batches?: {
		public_id: string;
		batch_name: string;
	}[];
	owner_id: number;
	owner?: DSRUserSnapshot;
	creator?: DSRUserSnapshot;
	is_active: boolean;
	others?: Record<string, any>;
	created_at: string;
	updated_at: string;
}

export interface DSRActivity {
	id: number;
	public_id: string;
	project_id: number;
	project?: {
		id: number;
		public_id: string;
		name: string;
	};
	name: string;
	description: string | null;
	start_date: string | null;
	end_date: string | null;
	actual_end_date: string | null;
	status: DSRActivityStatus;
	assigned_users: DSRUserSnapshot[];
	is_active: boolean;
	estimated_hours: number | null;
	total_actual_hours: number;
	actual_start_date: string | null;
	others?: Record<string, any>;
	created_at: string;
	updated_at: string;
}

export interface DSRActivityType {
	id: number;
	public_id: string;
	name: string;
	code: string;
	description: string | null;
	category?: string | null;
	is_active: boolean;
	sort_order: number;
	created_at: string;
	updated_at: string;
}

export interface DSRItem {
	project_public_id: string| null;
	project_name?: string;
	project_name_other?: string;
	activity_public_id: string | null;
	activity_name?: string;
	activity_name_other?: string;
	activity_type_name?: string | null;
	description: string;
	start_time: string;
	end_time: string;
	hours: number;
}

export interface DSREntry {
	id: number;
	public_id: string;
	user_id: number;
	user?: DSRUserSnapshot;
	report_date: string;
	status: DSRStatus;
	submitted_at: string | null;
	is_previous_day_submission: boolean;
	previous_day_permission_granted_by: number | null;
	items: DSRItem[];
	is_leave: boolean;
	leave_type?: string | null;
	others?: Record<string, any>;
	// Admin review fields
	admin_notes?: string | null;
	reviewed_by?: number | null;
	reviewed_at?: string | null;
	created_at: string;
	updated_at: string;
}

export interface DSRProjectCreate {
	name: string;
	owner_user_public_id: string;
	project_type?: 'standard' | 'training';
	linked_batch_public_id?: string | null;
	linked_batch_public_ids?: string[];
	is_active?: boolean;
	others?: Record<string, any>;
}

export interface DSRActivityCreate {
	project_public_id: string;
	name: string;
	description?: string;
	start_date?: string | null;
	end_date?: string | null;
	actual_end_date?: string | null;
	status?: DSRActivityStatus;
	assigned_user_public_ids?: string[];
	is_active?: boolean;
	estimated_hours?: number | null;
	others?: Record<string, any>;
}

export interface DSREntryCreate {
	report_date: string;
	items?: (Omit<DSRItem, 'project_name' | 'activity_name' | 'hours' | 'project_public_id' | 'activity_public_id' | 'activity_type_name'> & { 
		project_public_id?: string | null;
		activity_public_id?: string | null;
		activity_type_name?: string | null;
		project_name_other?: string;
		activity_name_other?: string;
		hours?: number;
	})[];
	is_leave?: boolean;
	leave_type?: string;
	others?: Record<string, any>;
}

export interface ImportResult {
	total_rows: number;
	created: number;
	skipped: number;
	errors: Array<{
		row: number;
		error: string;
	}>;
}

export interface MissingDSR extends DSRUserSnapshot {
	role: string;
}

export interface PaginationResult<T> {
	items: T[];
	total: number;
}

export type DSRPermissionStatus = 'pending' | 'granted' | 'rejected';

export interface DSRPermissionRequest {
	id: number;
	public_id: string;
	user_id: number;
	user?: DSRUserSnapshot;
	report_date: string;
	reason: string;
	status: DSRPermissionStatus;
	handled_by?: number;
	handled_at?: string;
	admin_notes?: string;
	created_at: string;
	updated_at: string;
}

export interface DSRPermissionStats {
	raised: number;
	approved: number;
	rejected: number;
}

export type DSRProjectRequestStatus = 'pending' | 'approved' | 'rejected';

export interface DSRProjectRequest {
	id: number;
	public_id: string;
	project_name: string;
	reason: string | null;
	status: DSRProjectRequestStatus;
	admin_notes: string | null;
	requested_by: number;
	requester?: DSRUserSnapshot;
	handled_by?: number;
	handled_at?: string;
	created_project_id?: number;
	created_at: string;
	updated_at: string;
}

export type DSRLeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface DSRLeaveApplication {
	id: number;
	public_id: string;
	user_id: number;
	user?: DSRUserSnapshot;
	start_date: string;
	end_date: string;
	leave_type: string;
	reason: string | null;
	status: DSRLeaveStatus;
	admin_notes: string | null;
	handled_by: number | null;
	handled_at: string | null;
	created_at: string;
	updated_at: string;
}

export interface DSRLeaveStats {
	total_apps: number;
	total_days: number;
	pending_apps: number;
	pending_days: number;
	approved_apps: number;
	approved_days: number;
	rejected_apps: number;
	rejected_days: number;
}
