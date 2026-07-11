// HR Module — TypeScript models (Phase 1: Foundation)

export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'intern' | 'consultant';
export type WorkLocation = 'onsite' | 'remote' | 'hybrid';
export type EmployeeStatus = 'active' | 'on_notice' | 'probation' | 'resigned' | 'terminated' | 'on_leave';

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
	full_time: 'Full-Time',
	part_time: 'Part-Time',
	contract: 'Contract',
	intern: 'Intern',
	consultant: 'Consultant',
};

export const WORK_LOCATION_LABELS: Record<WorkLocation, string> = {
	onsite: 'On-Site',
	remote: 'Remote',
	hybrid: 'Hybrid',
};

export const EMPLOYEE_STATUS_LABELS: Record<EmployeeStatus, string> = {
	active: 'Active',
	on_notice: 'On Notice',
	probation: 'Probation',
	resigned: 'Resigned',
	terminated: 'Terminated',
	on_leave: 'On Leave',
};

export const EMPLOYEE_STATUS_COLORS: Record<EmployeeStatus, 'success' | 'warning' | 'info' | 'error' | 'default'> = {
	active: 'success',
	probation: 'info',
	on_notice: 'warning',
	on_leave: 'warning',
	resigned: 'default',
	terminated: 'error',
};

// ---------------------------------------------------------------------------
// Department
// ---------------------------------------------------------------------------

export interface HRDepartmentListItem {
	id: number;
	public_id: string;
	name: string;
	description: string | null;
	parent_id: number | null;
	head_user_id: number | null;
	head_user_name: string | null;
	is_active: boolean;
	designation_count: number | null;
	employee_count: number | null;
	created_at: string;
}

export interface HRDepartmentResponse extends HRDepartmentListItem {
	others: Record<string, unknown> | null;
	organization_id: number;
	updated_at: string;
}

export interface HRDepartmentCreate {
	name: string;
	description?: string;
	parent_id?: number | null;
	head_user_id?: number | null;
	others?: Record<string, unknown> | null;
}

export interface HRDepartmentUpdate {
	name?: string;
	description?: string;
	parent_id?: number | null;
	head_user_id?: number | null;
	is_active?: boolean;
	others?: Record<string, unknown> | null;
}

// ---------------------------------------------------------------------------
// Designation
// ---------------------------------------------------------------------------

export interface HRDesignationListItem {
	id: number;
	public_id: string;
	name: string;
	department_id: number | null;
	department_name: string | null;
	grade: string | null;
	is_active: boolean;
	created_at: string;
}

export interface HRDesignationResponse extends HRDesignationListItem {
	description: string | null;
	others: Record<string, unknown> | null;
	organization_id: number;
	updated_at: string;
}

export interface HRDesignationCreate {
	name: string;
	department_id?: number | null;
	grade?: string;
	description?: string;
	others?: Record<string, unknown> | null;
}

export interface HRDesignationUpdate {
	name?: string;
	department_id?: number | null;
	grade?: string;
	description?: string;
	is_active?: boolean;
	others?: Record<string, unknown> | null;
}

// ---------------------------------------------------------------------------
// Emergency Contact
// ---------------------------------------------------------------------------

export interface EmergencyContact {
	name: string;
	relation: string;
	phone: string;
}

// ---------------------------------------------------------------------------
// Employee Profile
// ---------------------------------------------------------------------------

export interface HREmployeeListItem {
	id: number;
	public_id: string;
	user_id: number;
	employee_id: string | null;
	full_name: string | null;
	email: string | null;
	role: string | null;
	avatar: string | null;
	employee_status: EmployeeStatus;
	employment_type: EmploymentType;
	work_location: WorkLocation;
	department_id: number | null;
	department_name: string | null;
	designation_id: number | null;
	designation_name: string | null;
	date_of_joining: string | null;
	is_active: boolean | null;
	created_at: string;
}

export interface HREmployeeResponse extends HREmployeeListItem {
	date_of_leaving: string | null;
	probation_end_date: string | null;
	pan_number: string | null;
	aadhaar_number: string | null;
	bank_account_number: string | null;
	bank_ifsc: string | null;
	bank_name: string | null;
	emergency_contact: EmergencyContact | null;
	others: Record<string, unknown> | null;
	organization_id: number;
	user_public_id: string | null;
	username: string | null;
	job_title: string | null;
	phone: string | null;
	reporting_manager_id: number | null;
	reporting_manager_name: string | null;
	created_at: string;
	updated_at: string;
}

export interface HREmployeeProfileCreate {
	user_id: number;
	employee_id?: string;
	department_id?: number | null;
	designation_id?: number | null;
	employment_type?: EmploymentType;
	work_location?: WorkLocation;
	employee_status?: EmployeeStatus;
	date_of_joining?: string | null;
	date_of_leaving?: string | null;
	probation_end_date?: string | null;
	pan_number?: string;
	aadhaar_number?: string;
	bank_account_number?: string;
	bank_ifsc?: string;
	bank_name?: string;
	emergency_contact?: EmergencyContact | null;
	others?: Record<string, unknown> | null;
}

export interface HREmployeeProfileUpdate {
	department_id?: number | null;
	designation_id?: number | null;
	employment_type?: EmploymentType;
	work_location?: WorkLocation;
	employee_status?: EmployeeStatus;
	date_of_joining?: string | null;
	date_of_leaving?: string | null;
	probation_end_date?: string | null;
	pan_number?: string;
	aadhaar_number?: string;
	bank_account_number?: string;
	bank_ifsc?: string;
	bank_name?: string;
	emergency_contact?: EmergencyContact | null;
	others?: Record<string, unknown> | null;
}
