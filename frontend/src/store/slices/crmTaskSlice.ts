import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import crmTaskService from '../../services/crmTaskService';
import type { CRMTask, CRMTaskCreate, CRMTaskUpdate, CRMTaskPaginatedResponse, CRMTaskStatus, CRMTaskPriority, CRMRelatedToType } from '../../models/crmTask';

interface CRMTaskState {
	list: CRMTask[];
	total: number;
	selectedTask: CRMTask | null;
	loading: boolean;
	error: string | null;
}

const initialState: CRMTaskState = {
	list: [],
	total: 0,
	selectedTask: null,
	loading: false,
	error: null,
};

export const fetchCRMTasks = createAsyncThunk(
	'crmTasks/fetchAll',
	async (params: {
		skip?: number;
		limit?: number;
		search?: string;
		status?: CRMTaskStatus;
		priority?: CRMTaskPriority;
		assignedTo?: number;
		relatedToType?: CRMRelatedToType;
		relatedToId?: number;
		overdueOnly?: boolean;
		dueSoonOnly?: boolean;
		sortBy?: string;
		sortOrder?: 'asc' | 'desc';
	} | void, { rejectWithValue }) => {
		try {
			const { skip, limit, search, status, priority, assignedTo, relatedToType, relatedToId, overdueOnly, dueSoonOnly, sortBy, sortOrder } = params || {};
			return await crmTaskService.getAll(skip, limit, search, status, priority, assignedTo, relatedToType, relatedToId, overdueOnly, dueSoonOnly, sortBy, sortOrder);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to fetch tasks');
		}
	}
);

export const fetchCRMTaskById = createAsyncThunk(
	'crmTasks/fetchById',
	async (publicId: string, { rejectWithValue }) => {
		try {
			return await crmTaskService.getById(publicId);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to fetch task');
		}
	}
);

export const fetchTasksByEntity = createAsyncThunk(
	'crmTasks/fetchByEntity',
	async ({ type, id, includeCompleted }: { type: CRMRelatedToType, id: number, includeCompleted?: boolean }, { rejectWithValue }) => {
		try {
			return await crmTaskService.getByEntity(type, id, includeCompleted);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to fetch entity tasks');
		}
	}
);

export const createCRMTask = createAsyncThunk(
	'crmTasks/create',
	async (task: CRMTaskCreate, { rejectWithValue }) => {
		try {
			return await crmTaskService.create(task);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to create task');
		}
	}
);

export const updateCRMTask = createAsyncThunk(
	'crmTasks/update',
	async ({ publicId, task }: { publicId: string, task: CRMTaskUpdate }, { rejectWithValue }) => {
		try {
			return await crmTaskService.update(publicId, task);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to update task');
		}
	}
);

export const deleteCRMTask = createAsyncThunk(
	'crmTasks/delete',
	async (publicId: string, { rejectWithValue }) => {
		try {
			await crmTaskService.delete(publicId);
			return publicId;
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to delete task');
		}
	}
);

const crmTaskSlice = createSlice({
	name: 'crmTasks',
	initialState,
	reducers: {
		clearSelectedTask: (state) => {
			state.selectedTask = null;
		},
		clearError: (state) => {
			state.error = null;
		}
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchCRMTasks.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchCRMTasks.fulfilled, (state, action: PayloadAction<CRMTaskPaginatedResponse>) => {
				state.loading = false;
				state.list = action.payload.items;
				state.total = action.payload.total;
			})
			.addCase(fetchCRMTasks.rejected, (state, action: PayloadAction<any>) => {
				state.loading = false;
				state.error = action.payload;
			})
			.addCase(fetchCRMTaskById.fulfilled, (state, action: PayloadAction<CRMTask>) => {
				state.selectedTask = action.payload;
			})
			.addCase(fetchTasksByEntity.fulfilled, (state, action: PayloadAction<CRMTask[]>) => {
				state.list = action.payload;
				state.total = action.payload.length;
			})
			.addCase(updateCRMTask.fulfilled, (state, action: PayloadAction<CRMTask>) => {
				if (state.selectedTask?.public_id === action.payload.public_id) {
					state.selectedTask = action.payload;
				}
				const index = state.list.findIndex(t => t.public_id === action.payload.public_id);
				if (index !== -1) {
					state.list[index] = action.payload;
				}
			})
			.addCase(deleteCRMTask.fulfilled, (state, action: PayloadAction<string>) => {
				state.list = state.list.filter(t => t.public_id !== action.payload);
				if (state.selectedTask?.public_id === action.payload) {
					state.selectedTask = null;
				}
			});
	}
});

export const { clearSelectedTask, clearError } = crmTaskSlice.actions;
export default crmTaskSlice.reducer;
