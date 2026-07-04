import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import projectService from '../../services/projectService';
import crmService from '../../services/crmService';
import type { Project, ProjectCreate, ProjectStatus, DealConvertToProjectRequest, ProjectStats } from '../../models/projects/project';
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

	convertLoading: boolean;
	convertError: string | null;
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

	convertLoading: false,
	convertError: null,
};

// --- Projects ---
export const fetchProjects = createAsyncThunk(
	'projects/fetchProjects',
	async (
		params: { page?: number; pageSize?: number; search?: string; status?: string; ownerId?: number; companyId?: number } | undefined,
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
			});
	},
});

export const { clearCurrentProject, clearConvertError } = projectsSlice.actions;
export default projectsSlice.reducer;
