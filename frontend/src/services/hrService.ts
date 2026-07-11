// HR Module — API service (Phase 1: Foundation)

import api from './api';
import type {
	HRDepartmentListItem, HRDepartmentResponse, HRDepartmentCreate, HRDepartmentUpdate,
	HRDesignationListItem, HRDesignationResponse, HRDesignationCreate, HRDesignationUpdate,
	HREmployeeListItem, HREmployeeResponse, HREmployeeProfileCreate, HREmployeeProfileUpdate,
	HRLeaveTypeListItem, HRLeaveTypeResponse, HRLeaveTypeCreate, HRLeaveTypeUpdate,
	HRLeaveBalanceResponse, HRLeaveBalanceUpdate,
	HRLeaveRequestResponse, HRLeaveRequestCreate, HRLeaveApprovalRequest,
	HRSalaryComponent, HRSalaryComponentCreate, HRSalaryComponentUpdate,
	HRSalaryStructure, HRSalaryStructureCreate, HRSalaryStructureUpdate,
	HREmployeeSalary, HREmployeeSalaryCreate,
	HRPayrollRun, HRPayrollRunCreate,
	HRVariablePayEntry, HRVariablePayEntryCreate,
	HRPayslip,
} from '../models/hr';

interface PaginatedResponse<T> {
	items: T[];
	total: number;
	skip: number;
	limit: number;
}

// ---------------------------------------------------------------------------
// Departments
// ---------------------------------------------------------------------------

export const hrDepartmentApi = {
	list: (includeInactive = false): Promise<HRDepartmentListItem[]> =>
		api.get('/hr/departments', { params: { include_inactive: includeInactive } }).then(r => r.data),

	get: (id: number): Promise<HRDepartmentResponse> =>
		api.get(`/hr/departments/${id}`).then(r => r.data),

	create: (payload: HRDepartmentCreate): Promise<HRDepartmentResponse> =>
		api.post('/hr/departments', payload).then(r => r.data),

	update: (id: number, payload: HRDepartmentUpdate): Promise<HRDepartmentResponse> =>
		api.patch(`/hr/departments/${id}`, payload).then(r => r.data),

	delete: (id: number): Promise<void> =>
		api.delete(`/hr/departments/${id}`).then(r => r.data),
};

// ---------------------------------------------------------------------------
// Designations
// ---------------------------------------------------------------------------

export const hrDesignationApi = {
	list: (departmentId?: number): Promise<HRDesignationListItem[]> =>
		api.get('/hr/designations', { params: departmentId ? { department_id: departmentId } : {} }).then(r => r.data),

	create: (payload: HRDesignationCreate): Promise<HRDesignationResponse> =>
		api.post('/hr/designations', payload).then(r => r.data),

	update: (id: number, payload: HRDesignationUpdate): Promise<HRDesignationResponse> =>
		api.patch(`/hr/designations/${id}`, payload).then(r => r.data),

	delete: (id: number): Promise<void> =>
		api.delete(`/hr/designations/${id}`).then(r => r.data),
};

// ---------------------------------------------------------------------------
// Employees
// ---------------------------------------------------------------------------

export interface EmployeeListParams {
	department_id?: number;
	employee_status?: string;
	search?: string;
	skip?: number;
	limit?: number;
}

export const hrEmployeeApi = {
	list: (params?: EmployeeListParams): Promise<PaginatedResponse<HREmployeeListItem>> =>
		api.get('/hr/employees', { params }).then(r => r.data),

	get: (publicId: string): Promise<HREmployeeResponse> =>
		api.get(`/hr/employees/${publicId}`).then(r => r.data),

	getByUserId: (userId: number): Promise<HREmployeeResponse> =>
		api.get(`/hr/employees/by-user/${userId}`).then(r => r.data),

	create: (payload: HREmployeeProfileCreate): Promise<HREmployeeResponse> =>
		api.post('/hr/employees', payload).then(r => r.data),

	update: (publicId: string, payload: HREmployeeProfileUpdate): Promise<HREmployeeResponse> =>
		api.patch(`/hr/employees/${publicId}`, payload).then(r => r.data),
};

// ---------------------------------------------------------------------------
// Leave Types Configuration
// ---------------------------------------------------------------------------

export const hrLeaveTypeApi = {
	list: (includeInactive = false): Promise<HRLeaveTypeListItem[]> =>
		api.get('/hr/leave-types', { params: { include_inactive: includeInactive } }).then(r => r.data),

	create: (payload: HRLeaveTypeCreate): Promise<HRLeaveTypeResponse> =>
		api.post('/hr/leave-types', payload).then(r => r.data),

	update: (id: number, payload: HRLeaveTypeUpdate): Promise<HRLeaveTypeResponse> =>
		api.patch(`/hr/leave-types/${id}`, payload).then(r => r.data),

	delete: (id: number): Promise<void> =>
		api.delete(`/hr/leave-types/${id}`).then(r => r.data),
};

// ---------------------------------------------------------------------------
// Leave Balances
// ---------------------------------------------------------------------------

export const hrLeaveBalanceApi = {
	getMyBalances: (year?: number): Promise<HRLeaveBalanceResponse[]> =>
		api.get('/hr/leaves/balances', { params: year ? { year } : {} }).then(r => r.data),

	getEmployeeBalances: (userId: number, year?: number): Promise<HRLeaveBalanceResponse[]> =>
		api.get(`/hr/leaves/balances/${userId}`, { params: year ? { year } : {} }).then(r => r.data),

	update: (id: number, payload: HRLeaveBalanceUpdate): Promise<HRLeaveBalanceResponse> =>
		api.patch(`/hr/leaves/balances/${id}`, payload).then(r => r.data),
};

// ---------------------------------------------------------------------------
// Leave Requests
// ---------------------------------------------------------------------------

export const hrLeaveRequestApi = {
	getMyRequests: (statusFilter?: string): Promise<HRLeaveRequestResponse[]> =>
		api.get('/hr/leaves/requests', { params: statusFilter ? { status_filter: statusFilter } : {} }).then(r => r.data),

	create: (payload: HRLeaveRequestCreate): Promise<HRLeaveRequestResponse> =>
		api.post('/hr/leaves/requests', payload).then(r => r.data),

	listPending: (): Promise<HRLeaveRequestResponse[]> =>
		api.get('/hr/leaves/requests/pending').then(r => r.data),

	get: (publicId: string): Promise<HRLeaveRequestResponse> =>
		api.get(`/hr/leaves/requests/${publicId}`).then(r => r.data),

	approveReject: (publicId: string, payload: HRLeaveApprovalRequest): Promise<HRLeaveRequestResponse> =>
		api.post(`/hr/leaves/requests/${publicId}/approve-reject`, payload).then(r => r.data),

	cancel: (publicId: string): Promise<HRLeaveRequestResponse> =>
		api.post(`/hr/leaves/requests/${publicId}/cancel`).then(r => r.data),
};

// ---------------------------------------------------------------------------
// Payroll Components Config
// ---------------------------------------------------------------------------

export const hrPayrollComponentApi = {
	list: (): Promise<HRSalaryComponent[]> =>
		api.get('/hr/payroll/components').then(r => r.data),

	create: (payload: HRSalaryComponentCreate): Promise<HRSalaryComponent> =>
		api.post('/hr/payroll/components', payload).then(r => r.data),

	update: (id: number, payload: HRSalaryComponentUpdate): Promise<HRSalaryComponent> =>
		api.patch(`/hr/payroll/components/${id}`, payload).then(r => r.data),

	delete: (id: number): Promise<void> =>
		api.delete(`/hr/payroll/components/${id}`).then(r => r.data),
};

// ---------------------------------------------------------------------------
// Salary Structures Config
// ---------------------------------------------------------------------------

export const hrPayrollStructureApi = {
	list: (): Promise<HRSalaryStructure[]> =>
		api.get('/hr/payroll/structures').then(r => r.data),

	create: (payload: HRSalaryStructureCreate): Promise<HRSalaryStructure> =>
		api.post('/hr/payroll/structures', payload).then(r => r.data),

	update: (id: number, payload: HRSalaryStructureUpdate): Promise<HRSalaryStructure> =>
		api.patch(`/hr/payroll/structures/${id}`, payload).then(r => r.data),

	delete: (id: number): Promise<void> =>
		api.delete(`/hr/payroll/structures/${id}`).then(r => r.data),
};

// ---------------------------------------------------------------------------
// Employee Salary Assignments
// ---------------------------------------------------------------------------

export const hrEmployeeSalaryApi = {
	get: (userId: number): Promise<HREmployeeSalary | null> =>
		api.get(`/hr/payroll/salaries/${userId}`).then(r => r.data),

	assign: (payload: HREmployeeSalaryCreate): Promise<HREmployeeSalary> =>
		api.post('/hr/payroll/salaries', payload).then(r => r.data),
};

// ---------------------------------------------------------------------------
// Payroll Runs
// ---------------------------------------------------------------------------

export const hrPayrollRunApi = {
	list: (): Promise<HRPayrollRun[]> =>
		api.get('/hr/payroll/runs').then(r => r.data),

	create: (payload: HRPayrollRunCreate): Promise<HRPayrollRun> =>
		api.post('/hr/payroll/runs', payload).then(r => r.data),

	calculate: (id: number): Promise<HRPayrollRun> =>
		api.post(`/hr/payroll/runs/${id}/calculate`).then(r => r.data),

	finalize: (id: number): Promise<HRPayrollRun> =>
		api.post(`/hr/payroll/runs/${id}/finalize`).then(r => r.data),
};

// ---------------------------------------------------------------------------
// Variable Pay Entries
// ---------------------------------------------------------------------------

export const hrVariablePayApi = {
	create: (runId: number, payload: HRVariablePayEntryCreate): Promise<HRVariablePayEntry> =>
		api.post(`/hr/payroll/runs/${runId}/variable-pay`, payload).then(r => r.data),

	delete: (id: number): Promise<void> =>
		api.delete(`/hr/payroll/variable-pay/${id}`).then(r => r.data),
};

// ---------------------------------------------------------------------------
// Payslips
// ---------------------------------------------------------------------------

export interface PayslipListParams {
	run_id?: number;
	user_id?: number;
}

export const hrPayslipApi = {
	list: (params?: PayslipListParams): Promise<HRPayslip[]> =>
		api.get('/hr/payroll/payslips', { params }).then(r => r.data),

	get: (publicId: string): Promise<HRPayslip> =>
		api.get(`/hr/payroll/payslips/${publicId}`).then(r => r.data),

	getPdfUrl: (publicId: string): string => {
		// Use baseURL or resolve from location origin if base is relative
		const base = api.defaults.baseURL || '/api/v1';
		return `${base}/hr/payroll/payslips/${publicId}/pdf`;
	},
};


