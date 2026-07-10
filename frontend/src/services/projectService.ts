import api from './api';
import type { PaginatedResponse } from '../models/common';
import type { Project, ProjectCreate, ProjectUpdate, ProjectStatus, ProjectStats } from '../models/projects/project';
import type {
	ProjectTask,
	ProjectTaskCreate,
	ProjectTaskUpdate,
	ProjectTaskStatus,
	ProjectTaskStatusUpsert,
	ProjectTaskFile,
} from '../models/projects/projectTask';

const projectService = {
	// --- Projects ---
	listProjects: async (params: {
		page?: number;
		pageSize?: number;
		search?: string;
		status?: ProjectStatus | string;
		ownerId?: number;
		companyId?: number;
		assignedToMe?: boolean;
		excludeCompleted?: boolean;
	} = {}): Promise<PaginatedResponse<Project>> => {
		const { page = 1, pageSize = 20, search, status, ownerId, companyId, assignedToMe, excludeCompleted } = params;
		const response = await api.get<PaginatedResponse<Project>>('/projects', {
			params: {
				page,
				page_size: pageSize,
				search,
				status,
				owner_id: ownerId,
				company_id: companyId,
				assigned_to_me: assignedToMe,
				exclude_completed: excludeCompleted,
			},
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

	// --- Project Tasks (and sub-tasks) ---
	listProjectTasks: async (
		projectPublicId: string,
		params: { assignedToMe?: boolean; excludeDone?: boolean } = {}
	): Promise<ProjectTask[]> => {
		const { assignedToMe, excludeDone } = params;
		const response = await api.get<ProjectTask[]>(`/projects/${projectPublicId}/tasks`, {
			params: { assigned_to_me: assignedToMe, exclude_done: excludeDone },
		});
		return response.data;
	},

	createProjectTask: async (projectPublicId: string, payload: ProjectTaskCreate): Promise<ProjectTask> => {
		const response = await api.post<ProjectTask>(`/projects/${projectPublicId}/tasks`, payload);
		return response.data;
	},

	createSubtask: async (parentTaskPublicId: string, payload: ProjectTaskCreate): Promise<ProjectTask> => {
		const response = await api.post<ProjectTask>(`/project-tasks/${parentTaskPublicId}/subtasks`, payload);
		return response.data;
	},

	updateProjectTask: async (taskPublicId: string, payload: ProjectTaskUpdate): Promise<ProjectTask> => {
		const response = await api.patch<ProjectTask>(`/project-tasks/${taskPublicId}`, payload);
		return response.data;
	},

	deleteProjectTask: async (taskPublicId: string): Promise<void> => {
		await api.delete(`/project-tasks/${taskPublicId}`);
	},

	// --- Task Statuses (tenant-configurable) ---
	listTaskStatuses: async (): Promise<ProjectTaskStatus[]> => {
		const response = await api.get<ProjectTaskStatus[]>('/project-task-statuses');
		return response.data;
	},

	updateTaskStatuses: async (statuses: ProjectTaskStatusUpsert[]): Promise<ProjectTaskStatus[]> => {
		const response = await api.patch<ProjectTaskStatus[]>('/project-task-statuses', { statuses });
		return response.data;
	},

	// --- Task File Attachments ---
	listTaskFiles: async (taskPublicId: string): Promise<ProjectTaskFile[]> => {
		const response = await api.get<ProjectTaskFile[]>(`/project-tasks/${taskPublicId}/files`);
		return response.data;
	},

	uploadTaskFile: async (taskPublicId: string, file: File): Promise<ProjectTaskFile> => {
		const formData = new FormData();
		formData.append('file', file);
		const response = await api.post<ProjectTaskFile>(`/project-tasks/${taskPublicId}/files`, formData, {
			headers: { 'Content-Type': 'multipart/form-data' },
		});
		return response.data;
	},

	deleteTaskFile: async (taskPublicId: string, filePublicId: string): Promise<void> => {
		await api.delete(`/project-tasks/${taskPublicId}/files/${filePublicId}`);
	},

	viewTaskFile: async (taskPublicId: string, filePublicId: string): Promise<void> => {
		const response = await api.get(`/project-tasks/${taskPublicId}/files/${filePublicId}/download`, {
			responseType: 'blob',
		});
		const blob = new Blob([response.data], { type: response.headers['content-type'] });
		const viewUrl = window.URL.createObjectURL(blob);
		// Opened as a real tab (not a popup) so the browser's native viewer (images, PDFs)
		// takes over; the object URL is revoked after a delay to give that tab time to load it.
		window.open(viewUrl, '_blank', 'noopener,noreferrer');
		setTimeout(() => window.URL.revokeObjectURL(viewUrl), 60_000);
	},

	downloadTaskFile: async (taskPublicId: string, filePublicId: string, fileName: string): Promise<void> => {
		const response = await api.get(`/project-tasks/${taskPublicId}/files/${filePublicId}/download`, {
			responseType: 'blob',
		});
		const blob = new Blob([response.data], { type: response.headers['content-type'] });
		const downloadUrl = window.URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = downloadUrl;
		link.download = fileName;
		document.body.appendChild(link);
		link.click();
		link.remove();
		window.URL.revokeObjectURL(downloadUrl);
	},
};

export default projectService;
