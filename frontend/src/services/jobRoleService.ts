import api from './api';
import type { JobRole, JobRoleCreate, JobRoleUpdate, JobRolePaginatedResponse, JobRoleStatus } from '../models/jobRole';

export const jobRoleService = {
	getAll: async (
		skip = 0,
		limit = 100,
		search?: string,
		status?: JobRoleStatus,
		companyId?: number,
		contactId?: number,
		workplaceType?: string,
		jobType?: string
	): Promise<JobRolePaginatedResponse> => {
		const params = new URLSearchParams({
			skip: skip.toString(),
			limit: limit.toString()
		});
		if (search) params.append('search', search);
		if (status) params.append('status', status);
		if (companyId) params.append('company_id', companyId.toString());
		if (contactId) params.append('contact_id', contactId.toString());
		if (workplaceType) params.append('workplace_type', workplaceType);
		if (jobType) params.append('job_type', jobType);

		const response = await api.get<JobRolePaginatedResponse>(`/placement/job-roles?${params.toString()}`);
		return response.data;
	},

	getById: async (publicId: string): Promise<JobRole> => {
		const response = await api.get<JobRole>(`/placement/job-roles/${publicId}`);
		return response.data;
	},

	create: async (jobRole: JobRoleCreate): Promise<JobRole> => {
		const response = await api.post<JobRole>('/placement/job-roles/', jobRole);
		return response.data;
	},

	update: async (publicId: string, jobRole: JobRoleUpdate): Promise<JobRole> => {
		const response = await api.put<JobRole>(`/placement/job-roles/${publicId}`, jobRole);
		return response.data;
	},

	updateStatus: async (publicId: string, status: JobRoleStatus, reason?: string): Promise<JobRole> => {
		const params = new URLSearchParams({ new_status: status });
		if (reason) params.append('reason', reason);
		const response = await api.patch<JobRole>(`/placement/job-roles/${publicId}/status?${params.toString()}`);
		return response.data;
	},

	delete: async (publicId: string, reason?: string): Promise<void> => {
		const params = reason ? `?reason=${encodeURIComponent(reason)}` : '';
		await api.delete(`/placement/job-roles/${publicId}${params}`);
	}
};

export default jobRoleService;
