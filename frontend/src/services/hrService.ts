// HR Module — API service (Phase 1: Foundation)

import api from './api';
import type {
	HRDepartmentListItem, HRDepartmentResponse, HRDepartmentCreate, HRDepartmentUpdate,
	HRDesignationListItem, HRDesignationResponse, HRDesignationCreate, HRDesignationUpdate,
	HREmployeeListItem, HREmployeeResponse, HREmployeeProfileCreate, HREmployeeProfileUpdate,
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
