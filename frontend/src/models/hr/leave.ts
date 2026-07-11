// HR Leave Management models

export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export const LEAVE_STATUS_LABELS: Record<LeaveStatus, string> = {
	pending: 'Pending Approval',
	approved: 'Approved',
	rejected: 'Rejected',
	cancelled: 'Cancelled',
};

export const LEAVE_STATUS_COLORS: Record<LeaveStatus, 'warning' | 'success' | 'error' | 'default'> = {
	pending: 'warning',
	approved: 'success',
	rejected: 'error',
	cancelled: 'default',
};

// ---------------------------------------------------------------------------
// Leave Type Configuration
// ---------------------------------------------------------------------------

export interface HRLeaveTypeListItem {
	id: number;
	public_id: string;
	name: string;
	code: string;
	description: string | null;
	default_allocation: number;
	is_carry_forward: boolean;
	max_carry_forward: number;
	is_lop: boolean;
	is_active: boolean;
	created_at: string;
}

export interface HRLeaveTypeResponse extends HRLeaveTypeListItem {
	others: Record<string, unknown> | null;
	organization_id: number;
	updated_at: string;
}

export interface HRLeaveTypeCreate {
	name: string;
	code: string;
	description?: string;
	default_allocation: number;
	is_carry_forward: boolean;
	max_carry_forward: number;
	is_lop: boolean;
	others?: Record<string, unknown> | null;
}

export interface HRLeaveTypeUpdate {
	name?: string;
	code?: string;
	description?: string;
	default_allocation?: number;
	is_carry_forward?: boolean;
	max_carry_forward?: number;
	is_lop?: boolean;
	is_active?: boolean;
	others?: Record<string, unknown> | null;
}

// ---------------------------------------------------------------------------
// Leave Balance
// ---------------------------------------------------------------------------

export interface HRLeaveBalanceResponse {
	id: number;
	public_id: string;
	user_id: number;
	leave_type_id: number;
	leave_type_name: string | null;
	leave_type_code: string | null;
	is_lop: boolean | null;
	year: number;
	allocated: number;
	used: number;
	pending: number;
	others: Record<string, unknown> | null;
	organization_id: number;
	created_at: string;
	updated_at: string;
}

export interface HRLeaveBalanceUpdate {
	allocated?: number;
	used?: number;
	pending?: number;
	others?: Record<string, unknown> | null;
}

// ---------------------------------------------------------------------------
// Leave Request
// ---------------------------------------------------------------------------

export interface HRLeaveRequestResponse {
	id: number;
	public_id: string;
	user_id: number;
	employee_name: string | null;
	employee_code: string | null;
	leave_type_id: number;
	leave_type_name: string | null;
	leave_type_code: string | null;
	from_date: string; // YYYY-MM-DD
	to_date: string;   // YYYY-MM-DD
	is_half_day: boolean;
	half_day_session: string | null;
	total_days: number;
	status: LeaveStatus;
	reason: string | null;
	approved_by_id: number | null;
	approved_by_name: string | null;
	approved_at: string | null;
	manager_notes: string | null;
	others: Record<string, unknown> | null;
	organization_id: number;
	created_at: string;
	updated_at: string;
}

export interface HRLeaveRequestCreate {
	leave_type_id: number;
	from_date: string; // YYYY-MM-DD
	to_date: string;   // YYYY-MM-DD
	is_half_day?: boolean;
	half_day_session?: string | null;
	reason?: string;
	others?: Record<string, unknown> | null;
}

export interface HRLeaveRequestUpdate {
	from_date?: string;
	to_date?: string;
	is_half_day?: boolean;
	half_day_session?: string | null;
	reason?: string;
	others?: Record<string, unknown> | null;
}

export interface HRLeaveApprovalRequest {
	status: 'approved' | 'rejected';
	manager_notes?: string;
}
