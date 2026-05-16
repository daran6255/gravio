import api from './api';
import type { DSRActivity, DSRActivityCreate, DSRActivityStatus, ImportResult } from '../models/dsr';

const dsrActivityService = {
	getActivities: async (
		skip = 0,
		limit = 100,
		project_public_id?: string,
		status?: DSRActivityStatus,
		active_only = false,
		search?: string,
		assigned_to?: string
	) => {
		const response = await api.get<{ items: DSRActivity[]; total: number }>(`/dsr/activities`, {
			params: { skip, limit, project_public_id, status, active_only, search, assigned_to },
		});
		return response.data;
	},

	getActivity: async (publicId: string) => {
		const response = await api.get<DSRActivity>(`/dsr/activities/${publicId}`);
		return response.data;
	},

	createActivity: async (data: DSRActivityCreate) => {
		const response = await api.post<DSRActivity>(`/dsr/activities`, data);
		return response.data;
	},

	updateActivity: async (publicId: string, data: Partial<DSRActivityCreate>) => {
		const response = await api.put<DSRActivity>(`/dsr/activities/${publicId}`, data);
		return response.data;
	},

	deleteActivity: async (publicId: string) => {
		await api.delete(`/dsr/activities/${publicId}`);
	},

	bulkDeleteActivities: async (publicIds: string[]) => {
		const response = await api.post(`/dsr/activities/bulk-delete`, {
			public_ids: publicIds
		});
		return response.data;
	},

	importFromExcel: async (file: File, projectPublicId?: string): Promise<ImportResult> => {
		const formData = new FormData();
		formData.append('file', file);
		const response = await api.post('/dsr/activities/import', formData, {
			params: { project_public_id: projectPublicId },
			headers: { 'Content-Type': 'multipart/form-data' }
		});
		return response.data;
	},

	downloadTemplate: async () => {
		const response = await api.get('/dsr/activities/template', {
			responseType: 'blob'
		});

		const url = window.URL.createObjectURL(new Blob([response.data]));
		const link = document.createElement('a');
		link.href = url;
		link.setAttribute('download', 'activity_import_template.xlsx');
		document.body.appendChild(link);
		link.click();
		link.remove();
	},

	exportActivities: async (projectPublicId: string) => {
		const response = await api.get('/dsr/activities/export', {
			params: { project_public_id: projectPublicId },
			responseType: 'blob'
		});

		const url = window.URL.createObjectURL(new Blob([response.data]));
		const link = document.createElement('a');
		link.href = url;
		link.setAttribute('download', 'activities_export.xlsx');
		document.body.appendChild(link);
		link.click();
		link.remove();
	}
};

export default dsrActivityService;
