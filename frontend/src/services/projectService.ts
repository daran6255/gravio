import api from './api';
import type { PaginatedResponse } from '../models/common';
import type { Project, ProjectCreate, ProjectUpdate, ProjectStatus, ProjectStats } from '../models/projects/project';

const projectService = {
	// --- Projects ---
	listProjects: async (params: {
		page?: number;
		pageSize?: number;
		search?: string;
		status?: ProjectStatus | string;
		ownerId?: number;
		companyId?: number;
	} = {}): Promise<PaginatedResponse<Project>> => {
		const { page = 1, pageSize = 20, search, status, ownerId, companyId } = params;
		const response = await api.get<PaginatedResponse<Project>>('/projects', {
			params: { page, page_size: pageSize, search, status, owner_id: ownerId, company_id: companyId },
		});
		return response.data;
	},

	getProjectStats: async (): Promise<ProjectStats> => {
		const response = await api.get<ProjectStats>('/projects/stats');
		return response.data;
	},

	getProject: async (publicId: string): Promise<Project> => {
		const response = await api.get<Project>(`/projects/${publicId}`);
		return response.data;
	},

	createProject: async (payload: ProjectCreate): Promise<Project> => {
		const response = await api.post<Project>('/projects', payload);
		return response.data;
	},

	updateProject: async (publicId: string, payload: ProjectUpdate): Promise<Project> => {
		const response = await api.patch<Project>(`/projects/${publicId}`, payload);
		return response.data;
	},

	deleteProject: async (publicId: string): Promise<void> => {
		await api.delete(`/projects/${publicId}`);
	},

	bulkUpdateProjects: async (publicIds: string[], updates: { ownerId?: number; status?: ProjectStatus }): Promise<Project[]> => {
		const response = await api.patch<Project[]>('/projects/bulk', {
			public_ids: publicIds,
			owner_id: updates.ownerId,
			status: updates.status,
		});
		return response.data;
	},
};

export default projectService;
