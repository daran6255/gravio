import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import projectService from '../../services/projectService';
import crmService from '../../services/crmService';
import { fetchReminders } from './crmSlice';
import type { Project, ProjectCreate, ProjectUpdate, ProjectStatus, DealConvertToProjectRequest, ProjectStats, DealProjectConversionPreview } from '../../models/projects/project';
import type {
	ProjectTask,
	ProjectTaskCreate,
	ProjectTaskUpdate,
	ProjectTaskStatus,
	ProjectTaskStatusUpsert,
	ProjectTaskFile,
	ProjectTaskHistoryEntry,
} from '../../models/projects/projectTask';
import type { PaginatedResponse } from '../../models/common';

/** Backend errors are shaped { success, error: { code, message, detail } } - not a top-level `detail`. */
function extractErrorMessage(error: any, fallback: string): string {
	return error?.response?.data?.error?.message || error?.response?.data?.detail || error?.message || fallback;
}

interface ProjectsState {
	projects: Project[];
	projectsTotal: number;
	projectsPage: number;
	projectsPageSize: number;
	projectsLoading: boolean;
	projectsError: string | null;

	projectStats: ProjectStats | null;
	projectStatsLoading: boolean;
	projectStatsError: string | null;

	currentProject: Project | null;
	currentProjectLoading: boolean;
	currentProjectError: string | null;

	projectMutating: boolean;
	projectMutationError: string | null;

	projectsBulkUpdateLoading: boolean;
	projectsBulkUpdateError: string | null;

	projectTasks: ProjectTask[];
	projectTasksLoading: boolean;
	taskMutating: boolean;
	taskMutationError: string | null;

	// Per-project task options cache, keyed by project public_id -- used by pickers
	// (e.g. the log-time form) that need several independent projects' task lists
	// loaded at once, unlike `projectTasks` above which holds a single project's tasks.
	projectTaskOptions: Record<string, ProjectTask[]>;
	projectTaskOptionsLoading: Record<string, boolean>;

	taskStatuses: ProjectTaskStatus[];
	taskStatusesLoading: boolean;
	taskStatusMutating: boolean;
	taskStatusMutationError: string | null;

	convertLoading: boolean;
	convertError: string | null;
	conversionPreview: DealProjectConversionPreview | null;
	conversionPreviewLoading: boolean;
	conversionPreviewError: string | null;
	taskFiles: ProjectTaskFile[];
	taskFilesLoading: boolean;
	taskFilesError: string | null;
	fileUploading: boolean;
	fileUploadError: string | null;

	taskHistory: ProjectTaskHistoryEntry[];
	taskHistoryLoading: boolean;
	taskHistoryError: string | null;
}

const initialState: ProjectsState = {
	projects: [],
	projectsTotal: 0,
	projectsPage: 1,
	projectsPageSize: 20,
	projectsLoading: false,
	projectsError: null,

	projectStats: null,
	projectStatsLoading: false,
	projectStatsError: null,

	currentProject: null,
	currentProjectLoading: false,
	currentProjectError: null,

	projectMutating: false,
	projectMutationError: null,

	projectsBulkUpdateLoading: false,
	projectsBulkUpdateError: null,

	projectTasks: [],
	projectTasksLoading: false,
	taskMutating: false,
	taskMutationError: null,

	projectTaskOptions: {},
	projectTaskOptionsLoading: {},

	taskStatuses: [],
	taskStatusesLoading: false,
	taskStatusMutating: false,
	taskStatusMutationError: null,

	convertLoading: false,
	convertError: null,
	conversionPreview: null,
	conversionPreviewLoading: false,
	conversionPreviewError: null,
	taskFiles: [],
	taskFilesLoading: false,
	taskFilesError: null,
	fileUploading: false,
	fileUploadError: null,

	taskHistory: [],
	taskHistoryLoading: false,
	taskHistoryError: null,
};

// --- Projects ---
export const fetchProjects = createAsyncThunk(
	'projects/fetchProjects',
	async (
		params:
			| {
					page?: number;
					pageSize?: number;
					search?: string;
					status?: string;
					ownerId?: number;
					companyId?: number;
					assignedToMe?: boolean;
					excludeCompleted?: boolean;
			  }
			| undefined,
		{ rejectWithValue }
	) => {
		try {
			return await projectService.listProjects(params || {});
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to fetch projects'));
		}
	}
);

export const fetchProjectStats = createAsyncThunk(
	'projects/fetchProjectStats',
	async (_: void | undefined, { rejectWithValue }) => {
		try {
			return await projectService.getProjectStats();
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to fetch project stats'));
		}
	}
);

export const fetchProject = createAsyncThunk(
	'projects/fetchProject',
	async (publicId: string, { rejectWithValue }) => {
		try {
			return await projectService.getProject(publicId);
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to fetch project'));
		}
	}
);

export const createProject = createAsyncThunk(
	'projects/createProject',
	async (payload: ProjectCreate, { rejectWithValue }) => {
		try {
			return await projectService.createProject(payload);
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to create project'));
		}
	}
);

export const updateProject = createAsyncThunk(
	'projects/updateProject',
	async ({ publicId, payload }: { publicId: string; payload: ProjectUpdate }, { rejectWithValue }) => {
		try {
			return await projectService.updateProject(publicId, payload);
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to update project'));
		}
	}
);

export const deleteProject = createAsyncThunk(
	'projects/deleteProject',
	async (publicId: string, { rejectWithValue }) => {
		try {
			await projectService.deleteProject(publicId);
			return publicId;
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to delete project'));
		}
	}
);

export const bulkUpdateProjects = createAsyncThunk(
	'projects/bulkUpdateProjects',
	async (params: { publicIds: string[]; ownerId?: number; status?: ProjectStatus }, { rejectWithValue }) => {
		try {
			return await projectService.bulkUpdateProjects(params.publicIds, { ownerId: params.ownerId, status: params.status });
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to update projects'));
		}
	}
);

// --- Project Tasks (and sub-tasks) ---
export const fetchProjectTasks = createAsyncThunk(
	'projects/fetchProjectTasks',
	async (projectPublicId: string, { rejectWithValue }) => {
		try {
			return await projectService.listProjectTasks(projectPublicId);
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to fetch tasks'));
		}
	}
);

export const fetchProjectTaskOptions = createAsyncThunk(
	'projects/fetchProjectTaskOptions',
	async (projectPublicId: string, { rejectWithValue }) => {
		try {
			const tasks = await projectService.listProjectTasks(projectPublicId);
			return { projectPublicId, tasks };
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to fetch tasks'));
		}
	}
);

export const createProjectTask = createAsyncThunk(
	'projects/createProjectTask',
	async ({ projectPublicId, payload }: { projectPublicId: string; payload: ProjectTaskCreate }, { rejectWithValue }) => {
		try {
			return await projectService.createProjectTask(projectPublicId, payload);
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to create task'));
		}
	}
);

export const createSubtask = createAsyncThunk(
	'projects/createSubtask',
	async ({ parentTaskPublicId, payload }: { parentTaskPublicId: string; payload: ProjectTaskCreate }, { rejectWithValue }) => {
		try {
			return await projectService.createSubtask(parentTaskPublicId, payload);
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to create sub-task'));
		}
	}
);

export const updateProjectTask = createAsyncThunk(
	'projects/updateProjectTask',
	async ({ taskPublicId, payload }: { taskPublicId: string; payload: ProjectTaskUpdate }, { rejectWithValue }) => {
		try {
			return await projectService.updateProjectTask(taskPublicId, payload);
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to update task'));
		}
	}
);

export const deleteProjectTask = createAsyncThunk(
	'projects/deleteProjectTask',
	async (taskPublicId: string, { rejectWithValue }) => {
		try {
			await projectService.deleteProjectTask(taskPublicId);
			return taskPublicId;
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to delete task'));
		}
	}
);

export const fetchTaskHistory = createAsyncThunk(
	'projects/fetchTaskHistory',
	async (taskPublicId: string, { rejectWithValue }) => {
		try {
			return await projectService.getTaskHistory(taskPublicId);
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to fetch task history'));
		}
	}
);

export const addTaskComment = createAsyncThunk(
	'projects/addTaskComment',
	async ({ taskPublicId, content }: { taskPublicId: string; content: string }, { dispatch, rejectWithValue }) => {
		try {
			const comment = await projectService.createTaskComment(taskPublicId, content);
			dispatch(fetchTaskHistory(taskPublicId));
			return comment;
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to add comment'));
		}
	}
);

/** Confirms and runs an IRIS action on a task. IRIS may have changed the task's own fields
 * (status, hours, etc. via update_project_task), created a reminder (set_task_reminder), as
 * well as posted a reply comment, so this refreshes the task list (source of truth for
 * `latestTask` in the drawer), the history/comments thread, and this task's reminders --
 * a plain `addTaskComment` only needs the history. Without the reminders refresh, IRIS setting
 * a reminder wrote straight to the DB but the drawer's reminder badge (which reads from
 * crmSlice's `state.reminders`, populated once on drawer open) never learned about it until the
 * whole page was reloaded. */
export const runIrisAction = createAsyncThunk(
	'projects/runIrisAction',
	async (
		{ taskId, taskPublicId, projectPublicId, message }: { taskId: number; taskPublicId: string; projectPublicId: string; message: string },
		{ dispatch, rejectWithValue }
	) => {
		try {
			const comment = await projectService.executeIrisAction(taskPublicId, message);
			// Awaited (not fire-and-forget): callers that show a "done" state right after this
			// resolves need the store to already reflect IRIS's changes by then, not "soon".
			await Promise.all([
				dispatch(fetchTaskHistory(taskPublicId)),
				dispatch(fetchProjectTasks(projectPublicId)),
				dispatch(fetchReminders({ entityType: 'project_task', entityId: taskId })),
			]);
			return comment;
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'IRIS could not complete that action'));
		}
	}
);

// --- Task Statuses (per-project) ---
export const fetchTaskStatuses = createAsyncThunk(
	'projects/fetchTaskStatuses',
	async (projectPublicId: string, { rejectWithValue }) => {
		try {
			return await projectService.listTaskStatuses(projectPublicId);
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to fetch task statuses'));
		}
	}
);

export const updateTaskStatuses = createAsyncThunk(
	'projects/updateTaskStatuses',
	async ({ projectPublicId, statuses }: { projectPublicId: string; statuses: ProjectTaskStatusUpsert[] }, { rejectWithValue }) => {
		try {
			return await projectService.updateTaskStatuses(projectPublicId, statuses);
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to update task statuses'));
		}
	}
);

export const fetchDealProjectConversionPreview = createAsyncThunk(
	'projects/fetchDealProjectConversionPreview',
	async (dealPublicId: string, { rejectWithValue }) => {
		try {
			return await crmService.getDealProjectConversionPreview(dealPublicId);
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to fetch project conversion preview'));
		}
	}
);

export const fetchTaskFiles = createAsyncThunk(
	'projects/fetchTaskFiles',
	async (taskPublicId: string, { rejectWithValue }) => {
		try {
			return await projectService.listTaskFiles(taskPublicId);
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to fetch task files'));
		}
	}
);

export const uploadTaskFile = createAsyncThunk(
	'projects/uploadTaskFile',
	async ({ taskPublicId, file }: { taskPublicId: string; file: File }, { rejectWithValue }) => {
		try {
			return await projectService.uploadTaskFile(taskPublicId, file);
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to upload file'));
		}
	}
);

export const deleteTaskFile = createAsyncThunk(
	'projects/deleteTaskFile',
	async ({ taskPublicId, filePublicId }: { taskPublicId: string; filePublicId: string }, { rejectWithValue }) => {
		try {
			await projectService.deleteTaskFile(taskPublicId, filePublicId);
			return filePublicId;
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to delete file'));
		}
	}
);

export const viewTaskFile = createAsyncThunk(
	'projects/viewTaskFile',
	async ({ taskPublicId, filePublicId }: { taskPublicId: string; filePublicId: string }, { rejectWithValue }) => {
		try {
			await projectService.viewTaskFile(taskPublicId, filePublicId);
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to view file'));
		}
	}
);

export const downloadTaskFile = createAsyncThunk(
	'projects/downloadTaskFile',
	async ({ taskPublicId, filePublicId, fileName }: { taskPublicId: string; filePublicId: string; fileName: string }, { rejectWithValue }) => {
		try {
			await projectService.downloadTaskFile(taskPublicId, filePublicId, fileName);
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to download file'));
		}
	}
);

// --- Deal -> Project conversion ---
export const convertDealToProject = createAsyncThunk(
	'projects/convertDealToProject',
	async ({ dealPublicId, payload }: { dealPublicId: string; payload: DealConvertToProjectRequest }, { rejectWithValue }) => {
		try {
			const project = await crmService.convertDealToProject(dealPublicId, payload);
			return project;
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to convert deal to project'));
		}
	}
);

const projectsSlice = createSlice({
	name: 'projects',
	initialState,
	reducers: {
		clearCurrentProject: (state) => {
			state.currentProject = null;
			state.currentProjectError = null;
			state.projectTasks = [];
		},
		clearConvertError: (state) => {
			state.convertError = null;
		},
	},
	extraReducers: (builder) => {
		builder
			// Projects
			.addCase(fetchProjects.pending, (state) => {
				state.projectsLoading = true;
				state.projectsError = null;
			})
			.addCase(fetchProjects.fulfilled, (state, action: PayloadAction<PaginatedResponse<Project>>) => {
				state.projectsLoading = false;
				state.projects = action.payload.items;
				state.projectsTotal = action.payload.total;
				state.projectsPage = action.payload.page;
				state.projectsPageSize = action.payload.page_size;
			})
			.addCase(fetchProjects.rejected, (state, action: PayloadAction<any>) => {
				state.projectsLoading = false;
				state.projectsError = action.payload;
			})
			.addCase(fetchProjectStats.pending, (state) => {
				state.projectStatsLoading = true;
				state.projectStatsError = null;
			})
			.addCase(fetchProjectStats.fulfilled, (state, action: PayloadAction<ProjectStats>) => {
				state.projectStatsLoading = false;
				state.projectStats = action.payload;
			})
			.addCase(fetchProjectStats.rejected, (state, action: PayloadAction<any>) => {
				state.projectStatsLoading = false;
				state.projectStatsError = action.payload;
			})
			.addCase(fetchProject.pending, (state) => {
				state.currentProjectLoading = true;
				state.currentProjectError = null;
			})
			.addCase(fetchProject.fulfilled, (state, action: PayloadAction<Project>) => {
				state.currentProjectLoading = false;
				state.currentProject = action.payload;
			})
			.addCase(fetchProject.rejected, (state, action: PayloadAction<any>) => {
				state.currentProjectLoading = false;
				state.currentProjectError = action.payload;
			})
			.addCase(createProject.pending, (state) => { state.projectMutating = true; state.projectMutationError = null; })
			.addCase(createProject.fulfilled, (state, action: PayloadAction<Project>) => {
				state.projectMutating = false;
				state.projects = [action.payload, ...state.projects];
			})
			.addCase(createProject.rejected, (state, action: PayloadAction<any>) => {
				state.projectMutating = false;
				state.projectMutationError = action.payload;
			})
			.addCase(updateProject.pending, (state) => { state.projectMutating = true; state.projectMutationError = null; })
			.addCase(updateProject.fulfilled, (state, action: PayloadAction<Project>) => {
				state.projectMutating = false;
				state.projects = state.projects.map((p) => (p.public_id === action.payload.public_id ? action.payload : p));
				if (state.currentProject?.public_id === action.payload.public_id) {
					state.currentProject = action.payload;
				}
			})
			.addCase(updateProject.rejected, (state, action: PayloadAction<any>) => {
				state.projectMutating = false;
				state.projectMutationError = action.payload;
			})
			.addCase(deleteProject.fulfilled, (state, action: PayloadAction<string>) => {
				state.projects = state.projects.filter((p) => p.public_id !== action.payload);
			})
			.addCase(bulkUpdateProjects.pending, (state) => {
				state.projectsBulkUpdateLoading = true;
				state.projectsBulkUpdateError = null;
			})
			.addCase(bulkUpdateProjects.fulfilled, (state, action: PayloadAction<Project[]>) => {
				state.projectsBulkUpdateLoading = false;
				for (const updated of action.payload) {
					const idx = state.projects.findIndex((p) => p.public_id === updated.public_id);
					if (idx !== -1) state.projects[idx] = updated;
				}
			})
			.addCase(bulkUpdateProjects.rejected, (state, action: PayloadAction<any>) => {
				state.projectsBulkUpdateLoading = false;
				state.projectsBulkUpdateError = action.payload;
			})

			// Project Tasks
			.addCase(fetchProjectTasks.pending, (state) => {
				state.projectTasksLoading = true;
			})
			.addCase(fetchProjectTasks.fulfilled, (state, action: PayloadAction<ProjectTask[]>) => {
				state.projectTasksLoading = false;
				state.projectTasks = action.payload;
			})
			.addCase(fetchProjectTasks.rejected, (state) => {
				state.projectTasksLoading = false;
			})
			.addCase(fetchProjectTaskOptions.pending, (state, action) => {
				state.projectTaskOptionsLoading[action.meta.arg] = true;
			})
			.addCase(fetchProjectTaskOptions.fulfilled, (state, action: PayloadAction<{ projectPublicId: string; tasks: ProjectTask[] }>) => {
				state.projectTaskOptionsLoading[action.payload.projectPublicId] = false;
				state.projectTaskOptions[action.payload.projectPublicId] = action.payload.tasks;
			})
			.addCase(fetchProjectTaskOptions.rejected, (state, action) => {
				state.projectTaskOptionsLoading[action.meta.arg] = false;
				state.projectTaskOptions[action.meta.arg] = [];
			})
			.addCase(createProjectTask.pending, (state) => { state.taskMutating = true; })
			.addCase(createProjectTask.fulfilled, (state, action: PayloadAction<ProjectTask>) => {
				state.taskMutating = false;
				state.projectTasks = [...state.projectTasks, action.payload];
			})
			.addCase(createProjectTask.rejected, (state, action: PayloadAction<any>) => {
				state.taskMutating = false;
				state.taskMutationError = action.payload;
			})
			.addCase(createSubtask.pending, (state) => { state.taskMutating = true; })
			.addCase(createSubtask.fulfilled, (state, action: PayloadAction<ProjectTask>) => {
				state.taskMutating = false;
				state.projectTasks = [...state.projectTasks, action.payload];
			})
			.addCase(createSubtask.rejected, (state, action: PayloadAction<any>) => {
				state.taskMutating = false;
				state.taskMutationError = action.payload;
			})
			.addCase(updateProjectTask.pending, (state, action) => {
				state.taskMutating = true;
				// Optimistic update: immediately reflect payload changes so the card
				// moves to the new column without waiting for the API round-trip.
				const { taskPublicId, payload } = action.meta.arg;
				const idx = state.projectTasks.findIndex((t) => t.public_id === taskPublicId);
				if (idx !== -1) {
					if (payload.status_id !== undefined) state.projectTasks[idx].status_id = payload.status_id;
					if (payload.assignee_id !== undefined) state.projectTasks[idx].assignee_id = payload.assignee_id;
				}
			})
			.addCase(updateProjectTask.fulfilled, (state, action: PayloadAction<ProjectTask>) => {
				state.taskMutating = false;
				state.projectTasks = state.projectTasks.map((t) =>
					t.public_id === action.payload.public_id ? action.payload : t
				);
			})
			.addCase(updateProjectTask.rejected, (state, action: PayloadAction<any>) => {
				state.taskMutating = false;
				state.taskMutationError = action.payload;
			})
			.addCase(deleteProjectTask.fulfilled, (state, action: PayloadAction<string>) => {
				// Deleting a task also soft-deletes its sub-tasks server-side; walk
				// parent_task_id (a numeric id, not public_id) to drop any task whose
				// parent was just deleted too, so the list matches immediately without
				// waiting for a refetch.
				const deletedTask = state.projectTasks.find((t) => t.public_id === action.payload);
				const deletedIds = new Set<number>(deletedTask ? [deletedTask.id] : []);
				let changed = true;
				while (changed) {
					changed = false;
					for (const t of state.projectTasks) {
						if (t.parent_task_id != null && deletedIds.has(t.parent_task_id) && !deletedIds.has(t.id)) {
							deletedIds.add(t.id);
							changed = true;
						}
					}
				}
				state.projectTasks = state.projectTasks.filter((t) => !deletedIds.has(t.id));
			})

			// Task history
			.addCase(fetchTaskHistory.pending, (state) => {
				state.taskHistoryLoading = true;
				state.taskHistoryError = null;
			})
			.addCase(fetchTaskHistory.fulfilled, (state, action: PayloadAction<PaginatedResponse<ProjectTaskHistoryEntry>>) => {
				state.taskHistoryLoading = false;
				state.taskHistory = action.payload.items;
			})
			.addCase(fetchTaskHistory.rejected, (state, action: PayloadAction<any>) => {
				state.taskHistoryLoading = false;
				state.taskHistoryError = action.payload;
			})

			// Task Statuses
			.addCase(fetchTaskStatuses.pending, (state) => {
				state.taskStatusesLoading = true;
			})
			.addCase(fetchTaskStatuses.fulfilled, (state, action: PayloadAction<ProjectTaskStatus[]>) => {
				state.taskStatusesLoading = false;
				state.taskStatuses = action.payload;
			})
			.addCase(fetchTaskStatuses.rejected, (state) => {
				state.taskStatusesLoading = false;
			})
			.addCase(updateTaskStatuses.pending, (state) => { state.taskStatusMutating = true; })
			.addCase(updateTaskStatuses.fulfilled, (state, action: PayloadAction<ProjectTaskStatus[]>) => {
				state.taskStatusMutating = false;
				state.taskStatuses = action.payload;
			})
			.addCase(updateTaskStatuses.rejected, (state, action: PayloadAction<any>) => {
				state.taskStatusMutating = false;
				state.taskStatusMutationError = action.payload;
			})

			// Deal -> Project conversion
			.addCase(convertDealToProject.pending, (state) => {
				state.convertLoading = true;
				state.convertError = null;
			})
			.addCase(convertDealToProject.fulfilled, (state, action: PayloadAction<Project>) => {
				state.convertLoading = false;
				state.projects = [action.payload, ...state.projects];
			})
			.addCase(convertDealToProject.rejected, (state, action: PayloadAction<any>) => {
				state.convertLoading = false;
				state.convertError = action.payload;
			})
			// Deal -> Project conversion preview
			.addCase(fetchDealProjectConversionPreview.pending, (state) => {
				state.conversionPreviewLoading = true;
				state.conversionPreviewError = null;
			})
			.addCase(fetchDealProjectConversionPreview.fulfilled, (state, action: PayloadAction<DealProjectConversionPreview>) => {
				state.conversionPreviewLoading = false;
				state.conversionPreview = action.payload;
			})
			.addCase(fetchDealProjectConversionPreview.rejected, (state, action: PayloadAction<any>) => {
				state.conversionPreviewLoading = false;
				state.conversionPreviewError = action.payload;
			})
			// Task files
			.addCase(fetchTaskFiles.pending, (state) => {
				state.taskFilesLoading = true;
				state.taskFilesError = null;
			})
			.addCase(fetchTaskFiles.fulfilled, (state, action: PayloadAction<ProjectTaskFile[]>) => {
				state.taskFilesLoading = false;
				state.taskFiles = action.payload;
			})
			.addCase(fetchTaskFiles.rejected, (state, action: PayloadAction<any>) => {
				state.taskFilesLoading = false;
				state.taskFilesError = action.payload;
			})
			.addCase(uploadTaskFile.pending, (state) => {
				state.fileUploading = true;
				state.fileUploadError = null;
			})
			.addCase(uploadTaskFile.fulfilled, (state, action: PayloadAction<ProjectTaskFile>) => {
				state.fileUploading = false;
				state.taskFiles = [...state.taskFiles, action.payload];
			})
			.addCase(uploadTaskFile.rejected, (state, action: PayloadAction<any>) => {
				state.fileUploading = false;
				state.fileUploadError = action.payload;
			})
			.addCase(deleteTaskFile.fulfilled, (state, action: PayloadAction<string>) => {
				state.taskFiles = state.taskFiles.filter((f) => f.public_id !== action.payload);
			});
	},
});

export const { clearCurrentProject, clearConvertError } = projectsSlice.actions;
export default projectsSlice.reducer;
