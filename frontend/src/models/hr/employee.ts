// HR Employee models

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

export interface EmergencyContact {
	name: string;
	relation: string;
	phone: string;
}

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
