import api from './api';
import type { CRMActivityLog, CRMActivityPaginatedResponse, CRMEntityType } from '../models/crmActivity';

export const crmActivityService = {
	getRecent: async (limit = 20): Promise<CRMActivityLog[]> => {
		const response = await api.get<CRMActivityLog[]>(`/crm/activities?limit=${limit}`);
		return response.data;
	},

	getByEntity: async (entityType: CRMEntityType, entityId: number, skip = 0, limit = 50): Promise<CRMActivityPaginatedResponse> => {
		const response = await api.get<CRMActivityPaginatedResponse>(`/crm/activities/entity/${entityType}/${entityId}?skip=${skip}&limit=${limit}`);
		return response.data;
	},

	getById: async (publicId: string): Promise<CRMActivityLog> => {
		const response = await api.get<CRMActivityLog>(`/crm/activities/${publicId}`);
		return response.data;
	},
	create: async (activity: Partial<CRMActivityLog>): Promise<CRMActivityLog> => {
		const response = await api.post<CRMActivityLog>('/crm/activities', activity);
		return response.data;
	}
};

export default crmActivityService;
