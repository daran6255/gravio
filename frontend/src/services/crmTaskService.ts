import api from './api';
import type { CRMTask, CRMTaskCreate, CRMTaskUpdate, CRMTaskPaginatedResponse, CRMTaskStatus, CRMTaskPriority, CRMRelatedToType } from '../models/crmTask';

export const crmTaskService = {
	getAll: async (
		skip = 0,
		limit = 100,
		search?: string,
		status?: CRMTaskStatus,
		priority?: CRMTaskPriority,
		assignedTo?: number,
		relatedToType?: CRMRelatedToType,
		relatedToId?: number,
		overdueOnly = false,
		dueSoonOnly = false,
		sortBy = 'due_date',
		sortOrder: 'asc' | 'desc' = 'asc'
	): Promise<CRMTaskPaginatedResponse> => {
		const params = new URLSearchParams({
			skip: skip.toString(),
			limit: limit.toString(),
			sort_by: sortBy,
			sort_order: sortOrder,
			overdue_only: overdueOnly.toString(),
			due_soon_only: dueSoonOnly.toString()
		});
		if (search) params.append('search', search);
		if (status) params.append('status', status);
		if (priority) params.append('priority', priority);
		if (assignedTo) params.append('assigned_to', assignedTo.toString());
		if (relatedToType) params.append('related_to_type', relatedToType);
		if (relatedToId) params.append('related_to_id', relatedToId.toString());

		const response = await api.get<CRMTaskPaginatedResponse>(`/crm/tasks?${params.toString()}`);
		return response.data;
	},

	getById: async (publicId: string): Promise<CRMTask> => {
		const response = await api.get<CRMTask>(`/crm/tasks/${publicId}`);
		return response.data;
	},

	create: async (task: CRMTaskCreate): Promise<CRMTask> => {
		const response = await api.post<CRMTask>('/crm/tasks/', task);
		return response.data;
	},

	update: async (publicId: string, task: CRMTaskUpdate): Promise<CRMTask> => {
		const response = await api.put<CRMTask>(`/crm/tasks/${publicId}`, task);
		return response.data;
	},

	delete: async (publicId: string): Promise<void> => {
		await api.delete(`/crm/tasks/${publicId}`);
	},

	getByEntity: async (entityType: CRMRelatedToType, entityId: number, includeCompleted = false): Promise<CRMTask[]> => {
		const response = await api.get<CRMTask[]>(`/crm/tasks/entity/${entityType}/${entityId}?include_completed=${includeCompleted}`);
		return response.data;
	}
};

export default crmTaskService;
