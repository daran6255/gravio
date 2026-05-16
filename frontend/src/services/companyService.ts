import api from './api';
import type { Company, CompanyCreate, CompanyUpdate, CompanyStats, CompanyPaginatedResponse } from '../models/company';

export const companyService = {
	getAll: async (
		skip = 0,
		limit = 100,
		search?: string,
		status?: string,
		industry?: string,
		sortBy = 'created_at',
		sortOrder: 'asc' | 'desc' = 'desc'
	): Promise<CompanyPaginatedResponse> => {
		const params = new URLSearchParams({
			skip: skip.toString(),
			limit: limit.toString(),
			sort_by: sortBy,
			sort_order: sortOrder
		});
		if (search) params.append('search', search);
		if (status) params.append('status', status);
		if (industry) params.append('industry', industry);

		const response = await api.get<CompanyPaginatedResponse>(`/crm/companies?${params.toString()}`);
		return response.data;
	},

	getById: async (publicId: string): Promise<Company> => {
		const response = await api.get<Company>(`/crm/companies/${publicId}`);
		return response.data;
	},

	create: async (company: CompanyCreate): Promise<Company> => {
		const response = await api.post<Company>('/crm/companies/', company);
		return response.data;
	},

	update: async (publicId: string, company: CompanyUpdate): Promise<Company> => {
		const response = await api.put<Company>(`/crm/companies/${publicId}`, company);
		return response.data;
	},

	delete: async (publicId: string): Promise<void> => {
		await api.delete(`/crm/companies/${publicId}`);
	},

	getStats: async (): Promise<CompanyStats> => {
		const response = await api.get<CompanyStats>('/crm/companies/stats');
		return response.data;
	}
};

export default companyService;
