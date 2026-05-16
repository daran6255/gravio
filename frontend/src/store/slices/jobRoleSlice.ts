import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import jobRoleService from '../../services/jobRoleService';
import type { JobRole, JobRoleCreate, JobRoleUpdate, JobRolePaginatedResponse, JobRoleStatus } from '../../models/jobRole';

interface JobRoleState {
	list: JobRole[];
	total: number;
	loading: boolean;
	error: string | null;
	currentJobRole: JobRole | null;
}

const initialState: JobRoleState = {
	list: [],
	total: 0,
	loading: false,
	error: null,
	currentJobRole: null,
};

export const fetchJobRoles = createAsyncThunk(
	'jobRoles/fetchAll',
	async (params: { skip?: number; limit?: number; search?: string; status?: JobRoleStatus; companyId?: number; contactId?: number; workplace_type?: string; job_type?: string }, { rejectWithValue }) => {
		try {
			const response = await jobRoleService.getAll(
				params.skip,
				params.limit,
				params.search,
				params.status,
				params.companyId,
				params.contactId,
				params.workplace_type,
				params.job_type
			);
			return response;
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to fetch job roles');
		}
	}
);

export const fetchJobRoleById = createAsyncThunk(
	'jobRoles/fetchById',
	async (publicId: string, { rejectWithValue }) => {
		try {
			return await jobRoleService.getById(publicId);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to fetch job role');
		}
	}
);

export const createJobRole = createAsyncThunk(
	'jobRoles/create',
	async (jobRole: JobRoleCreate, { rejectWithValue }) => {
		try {
			return await jobRoleService.create(jobRole);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to create job role');
		}
	}
);

export const updateJobRole = createAsyncThunk(
	'jobRoles/update',
	async ({ publicId, jobRole }: { publicId: string; jobRole: JobRoleUpdate }, { rejectWithValue }) => {
		try {
			return await jobRoleService.update(publicId, jobRole);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to update job role');
		}
	}
);

export const updateJobRoleStatus = createAsyncThunk(
	'jobRoles/updateStatus',
	async ({ publicId, status, reason }: { publicId: string; status: JobRoleStatus; reason?: string }, { rejectWithValue }) => {
		try {
			return await jobRoleService.updateStatus(publicId, status, reason);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to update job role status');
		}
	}
);

export const deleteJobRole = createAsyncThunk(
	'jobRoles/delete',
	async ({ publicId, reason }: { publicId: string; reason?: string }, { rejectWithValue }) => {
		try {
			await jobRoleService.delete(publicId, reason);
			return publicId;
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to delete job role');
		}
	}
);

const jobRoleSlice = createSlice({
	name: 'jobRoles',
	initialState,
	reducers: {
		clearCurrentJobRole: (state) => {
			state.currentJobRole = null;
		},
		clearError: (state) => {
			state.error = null;
		},
	},
	extraReducers: (builder) => {
		builder
			// Fetch all
			.addCase(fetchJobRoles.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchJobRoles.fulfilled, (state, action: PayloadAction<JobRolePaginatedResponse>) => {
				state.loading = false;
				state.list = action.payload.items;
				state.total = action.payload.total;
			})
			.addCase(fetchJobRoles.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload as string;
			})
			// Fetch by ID
			.addCase(fetchJobRoleById.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchJobRoleById.fulfilled, (state, action: PayloadAction<JobRole>) => {
				state.loading = false;
				state.currentJobRole = action.payload;
			})
			.addCase(fetchJobRoleById.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload as string;
			})
			// Create
			.addCase(createJobRole.pending, (state) => {
				state.loading = true;
			})
			.addCase(createJobRole.fulfilled, (state, action: PayloadAction<JobRole>) => {
				state.loading = false;
				state.list.unshift(action.payload);
				state.total += 1;
			})
			.addCase(createJobRole.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload as string;
			})
			// Update
			.addCase(updateJobRole.fulfilled, (state, action: PayloadAction<JobRole>) => {
				const index = state.list.findIndex(j => j.public_id === action.payload.public_id);
				if (index !== -1) {
					state.list[index] = action.payload;
				}
				if (state.currentJobRole?.public_id === action.payload.public_id) {
					state.currentJobRole = action.payload;
				}
			})
			// Update Status
			.addCase(updateJobRoleStatus.fulfilled, (state, action: PayloadAction<JobRole>) => {
				const index = state.list.findIndex(j => j.public_id === action.payload.public_id);
				if (index !== -1) {
					state.list[index] = action.payload;
				}
			})
			// Delete
			.addCase(deleteJobRole.fulfilled, (state, action: PayloadAction<string>) => {
				state.list = state.list.filter(j => j.public_id !== action.payload);
				state.total -= 1;
			});
	},
});

export const { clearCurrentJobRole, clearError } = jobRoleSlice.actions;
export default jobRoleSlice.reducer;
