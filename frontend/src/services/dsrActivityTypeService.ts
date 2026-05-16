import api from './api';
import type { DSRActivityType, PaginationResult, ImportResult } from '../models/dsr';

const dsrActivityTypeService = {
	getActivityTypes: async (
		skip = 0,
		limit = 100,
		onlyActive = true
	): Promise<PaginationResult<DSRActivityType>> => {
		const response = await api.get('/dsr/activity-types/', {
			params: { skip, limit, active_only: onlyActive }
		});
		return response.data;
	},

	getActivityType: async (publicId: string): Promise<DSRActivityType> => {
		const response = await api.get(`/dsr/activity-types/${publicId}`);
		return response.data;
	},

	createActivityType: async (data: Partial<DSRActivityType>): Promise<DSRActivityType> => {
		const response = await api.post('/dsr/activity-types/', data);
		return response.data;
	},

	updateActivityType: async (publicId: string, data: Partial<DSRActivityType>): Promise<DSRActivityType> => {
		const response = await api.put(`/dsr/activity-types/${publicId}`, data);
		return response.data;
	},

	deleteActivityType: async (publicId: string): Promise<void> => {
		await api.delete(`/dsr/activity-types/${publicId}`);
	},
	
	importActivityTypes: async (file: File): Promise<ImportResult> => {
		const formData = new FormData();
		formData.append('file', file);
		const response = await api.post<ImportResult>(`/dsr/activity-types/import`, formData, {
			headers: {
				'Content-Type': 'multipart/form-data',
			},
		});
		return response.data;
	},
	
	downloadTemplate: async (): Promise<void> => {
		const response = await api.get('/dsr/activity-types/import/template', {
			responseType: 'blob'
		});

		const url = window.URL.createObjectURL(new Blob([response.data]));
		const link = document.createElement('a');
		link.href = url;
		link.setAttribute('download', 'dsr_activity_types_template.csv');
		document.body.appendChild(link);
		link.click();
		link.remove();
		window.URL.revokeObjectURL(url);
	},
	
	bulkDeleteActivityTypes: async (publicIds: string[]): Promise<void> => {
		await api.post('/dsr/activity-types/bulk-delete', { public_ids: publicIds });
	}
};

export default dsrActivityTypeService;
