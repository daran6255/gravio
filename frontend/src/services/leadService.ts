import api from './api';
import type { Lead, LeadCreate, LeadUpdate, LeadPaginatedResponse, LeadStatus, LeadSource, LeadStats } from '../models/lead';
import type { Deal } from '../models/deal';

export const leadService = {
	getAll: async (
		skip = 0,
		limit = 100,
		search?: string,
		status?: LeadStatus,
		source?: LeadSource,
		assignedTo?: number,
		minScore?: number,
		maxScore?: number,
		sortBy = 'lead_score',
		sortOrder: 'asc' | 'desc' = 'desc'
	): Promise<LeadPaginatedResponse> => {
		const params = new URLSearchParams({
			skip: skip.toString(),
			limit: limit.toString(),
			sort_by: sortBy,
			sort_order: sortOrder
		});
		if (search) params.append('search', search);
		if (status) params.append('status', status);
		if (source) params.append('source', source);
		if (assignedTo) params.append('assigned_to', assignedTo.toString());
		if (minScore !== undefined) params.append('min_score', minScore.toString());
		if (maxScore !== undefined) params.append('max_score', maxScore.toString());

		const response = await api.get<LeadPaginatedResponse>(`/crm/leads?${params.toString()}`);
		return response.data;
	},

	getById: async (publicId: string): Promise<Lead> => {
		const response = await api.get<Lead>(`/crm/leads/${publicId}`);
		return response.data;
	},

	create: async (lead: LeadCreate): Promise<Lead> => {
		const response = await api.post<Lead>('/crm/leads/', lead);
		return response.data;
	},

	update: async (publicId: string, lead: LeadUpdate): Promise<Lead> => {
		const response = await api.put<Lead>(`/crm/leads/${publicId}`, lead);
		return response.data;
	},

	delete: async (publicId: string): Promise<void> => {
		await api.delete(`/crm/leads/${publicId}`);
	},

	convert: async (publicId: string, dealData: any): Promise<{ lead: Lead; deal: Deal }> => {
		const response = await api.post<{ lead: Lead; deal: Deal }>(`/crm/leads/${publicId}/convert`, dealData);
		return response.data;
	},

	getStats: async (ownOnly = false): Promise<LeadStats> => {
		const response = await api.get<LeadStats>(`/crm/leads/stats?own_only=${ownOnly}`);
		return response.data;
	}
};

export default leadService;
