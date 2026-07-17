// Super Admin organization console — provision/list/deactivate/reactivate organizations.
// extendTrial already lives in authService.ts (built earlier) — left there, not duplicated here.
import api from './api';
import type { Organization } from '../models/auth';
import type { CreateOrganizationRequest, CreateOrganizationResponse, AdminStats, SystemHealth } from '../models/admin';
import type { PaginatedResponse } from '../models/common';
import type { TeamMember } from '../models/user';

const orgAdminService = {
	createOrganization: async (payload: CreateOrganizationRequest): Promise<CreateOrganizationResponse> => {
		const response = await api.post<CreateOrganizationResponse>('/admin/organizations', payload);
		return response.data;
	},

	listOrganizations: async (
		page = 1,
		pageSize = 20,
		search?: string,
		accountType?: string
	): Promise<PaginatedResponse<Organization>> => {
		const response = await api.get<PaginatedResponse<Organization>>('/admin/organizations', {
			params: { page, page_size: pageSize, search, account_type: accountType },
		});
		return response.data;
	},

	deactivateOrganization: async (publicId: string): Promise<Organization> => {
		const response = await api.post<Organization>(`/admin/organizations/${publicId}/deactivate`);
		return response.data;
	},

	reactivateOrganization: async (publicId: string): Promise<Organization> => {
		const response = await api.post<Organization>(`/admin/organizations/${publicId}/reactivate`);
		return response.data;
	},

	getAdminStats: async (): Promise<AdminStats> => {
		const response = await api.get<AdminStats>('/admin/stats');
		return response.data;
	},

	getSystemHealth: async (): Promise<SystemHealth> => {
		const response = await api.get<SystemHealth>('/admin/system-health');
		return response.data;
	},

	getOrganizationUsers: async (
		publicId: string,
		page = 1,
		pageSize = 100
	): Promise<PaginatedResponse<TeamMember>> => {
		const response = await api.get<PaginatedResponse<TeamMember>>(`/admin/organizations/${publicId}/users`, {
			params: { page, page_size: pageSize },
		});
		return response.data;
	},

	deleteOrganization: async (publicId: string): Promise<Organization> => {
		const response = await api.delete<Organization>(`/admin/organizations/${publicId}`);
		return response.data;
	},
};

export default orgAdminService;
