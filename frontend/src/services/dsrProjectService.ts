import api from './api';
import type { DSRProject, DSRProjectCreate, ImportResult } from '../models/dsr';

const dsrProjectService = {
	getProjects: async (skip = 0, limit = 100, active_only = false, search?: string, assigned_to?: string) => {
		const response = await api.get<{ items: DSRProject[]; total: number }>(`/dsr/projects`, {
			params: { skip, limit, active_only, search, assigned_to },
		});
		return response.data;
	},

	getProject: async (publicId: string) => {
		const response = await api.get<DSRProject>(`/dsr/projects/${publicId}`);
		return response.data;
	},

	createProject: async (data: DSRProjectCreate) => {
		const response = await api.post<DSRProject>(`/dsr/projects`, data);
		return response.data;
	},

	updateProject: async (publicId: string, data: Partial<DSRProjectCreate>) => {
		const response = await api.put<DSRProject>(`/dsr/projects/${publicId}`, data);
		return response.data;
	},

	deleteProject: async (publicId: string) => {
		await api.delete(`/dsr/projects/${publicId}`);
	},

	importFromExcel: async (file: File) => {
		const formData = new FormData();
		formData.append('file', file);
		const response = await api.post<ImportResult>(`/dsr/projects/import`, formData, {
			headers: {
				'Content-Type': 'multipart/form-data',
			},
		});
		return response.data;
	},

	downloadTemplate: async () => {
		const response = await api.get('/dsr/projects/template', {
			responseType: 'blob'
		});

		const url = window.URL.createObjectURL(new Blob([response.data]));
		const link = document.createElement('a');
		link.href = url;
		link.setAttribute('download', 'project_import_template.xlsx');
		document.body.appendChild(link);
		link.click();
		link.remove();
	},

	clearAllDsrData: async () => {
		const response = await api.post('/maintenance/dsr/clear-data');
		return response.data;
	},

	syncTrainingProject: async (publicId: string) => {
		const response = await api.post<{ success: boolean }>(`/dsr/projects/${publicId}/sync`);
		return response.data;
	}
};

export default dsrProjectService;
