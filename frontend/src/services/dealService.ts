import api from './api';
import type { Deal, DealCreate, DealUpdate, DealPaginatedResponse, DealStage, DealType, DealPipelineSummary } from '../models/deal';

export const dealService = {
	getAll: async (
		skip = 0,
		limit = 100,
		search?: string,
		stage?: DealStage,
		dealType?: DealType,
		assignedTo?: number,
		companyId?: number,
		sortBy = 'created_at',
		sortOrder: 'asc' | 'desc' = 'desc'
	): Promise<DealPaginatedResponse> => {
		const params = new URLSearchParams({
			skip: skip.toString(),
			limit: limit.toString(),
			sort_by: sortBy,
			sort_order: sortOrder
		});
		if (search) params.append('search', search);
		if (stage) params.append('stage', stage);
		if (dealType) params.append('deal_type', dealType);
		if (assignedTo) params.append('assigned_to', assignedTo.toString());
		if (companyId) params.append('company_id', companyId.toString());

		const response = await api.get<DealPaginatedResponse>(`/crm/deals?${params.toString()}`);
		return response.data;
	},

	getById: async (publicId: string): Promise<Deal> => {
		const response = await api.get<Deal>(`/crm/deals/${publicId}`);
		return response.data;
	},

	create: async (deal: DealCreate): Promise<Deal> => {
		const response = await api.post<Deal>('/crm/deals/', deal);
		return response.data;
	},

	update: async (publicId: string, deal: DealUpdate): Promise<Deal> => {
		const response = await api.put<Deal>(`/crm/deals/${publicId}`, deal);
		return response.data;
	},

	delete: async (publicId: string): Promise<void> => {
		await api.delete(`/crm/deals/${publicId}`);
	},

	getPipeline: async (ownOnly = false): Promise<DealPipelineSummary> => {
		const response = await api.get<DealPipelineSummary>(`/crm/deals/pipeline?own_only=${ownOnly}`);
		return response.data;
	}
};

export default dealService;
