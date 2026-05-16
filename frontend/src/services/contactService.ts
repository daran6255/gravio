import api from './api';
import type { Contact, ContactCreate, ContactUpdate, ContactPaginatedResponse } from '../models/contact';

export const contactService = {
	getAll: async (
		skip = 0,
		limit = 100,
		search?: string,
		companyId?: number,
		isDecisionMaker?: boolean,
		sortBy = 'created_at',
		sortOrder: 'asc' | 'desc' = 'desc'
	): Promise<ContactPaginatedResponse> => {
		const params = new URLSearchParams({
			skip: skip.toString(),
			limit: limit.toString(),
			sort_by: sortBy,
			sort_order: sortOrder
		});
		if (search) params.append('search', search);
		if (companyId) params.append('company_id', companyId.toString());
		if (isDecisionMaker !== undefined) params.append('is_decision_maker', isDecisionMaker.toString());

		const response = await api.get<ContactPaginatedResponse>(`/crm/contacts?${params.toString()}`);
		return response.data;
	},

	getById: async (publicId: string): Promise<Contact> => {
		const response = await api.get<Contact>(`/crm/contacts/${publicId}`);
		return response.data;
	},

	create: async (contact: ContactCreate): Promise<Contact> => {
		const response = await api.post<Contact>('/crm/contacts/', contact);
		return response.data;
	},

	update: async (publicId: string, contact: ContactUpdate): Promise<Contact> => {
		const response = await api.put<Contact>(`/crm/contacts/${publicId}`, contact);
		return response.data;
	},

	delete: async (publicId: string): Promise<void> => {
		await api.delete(`/crm/contacts/${publicId}`);
	},

	setPrimary: async (publicId: string): Promise<Contact> => {
		const response = await api.post<Contact>(`/crm/contacts/${publicId}/set-primary`);
		return response.data;
	}
};

export default contactService;
