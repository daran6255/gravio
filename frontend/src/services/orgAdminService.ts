// Super Admin organization console — provision/list/deactivate/reactivate organizations.
// extendTrial already lives in authService.ts (built earlier) — left there, not duplicated here.
import api from './api';
import type { Organization } from '../models/auth';
import type { CreateOrganizationRequest, CreateOrganizationResponse } from '../models/admin';
import type { PaginatedResponse } from '../models/common';

const orgAdminService = {
	createOrganization: async (payload: CreateOrganizationRequest): Promise<CreateOrganizationResponse> => {
		const response = await api.post<CreateOrganizationResponse>('/admin/organizations', payload);
		return response.data;
	},

	listOrganizations: async (
		page = 1,
		pageSize = 20,
		search?: string
	): Promise<PaginatedResponse<Organization>> => {
		const response = await api.get<PaginatedResponse<Organization>>('/admin/organizations', {
			params: { page, page_size: pageSize, search },
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
};

export default orgAdminService;
