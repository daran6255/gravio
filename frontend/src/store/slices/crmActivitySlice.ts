import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import crmActivityService from '../../services/crmActivityService';
import type { CRMActivityLog, CRMActivityPaginatedResponse, CRMEntityType } from '../../models/crmActivity';

interface CRMActivityState {
	list: CRMActivityLog[];
	total: number;
	selectedActivity: CRMActivityLog | null;
	loading: boolean;
	error: string | null;
}

const initialState: CRMActivityState = {
	list: [],
	total: 0,
	selectedActivity: null,
	loading: false,
	error: null,
};

export const fetchRecentActivities = createAsyncThunk(
	'crmActivities/fetchRecent',
	async (limit: number | void, { rejectWithValue }) => {
		try {
			return await crmActivityService.getRecent(limit || 20);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to fetch recent activities');
		}
	}
);

export const fetchEntityActivities = createAsyncThunk(
	'crmActivities/fetchByEntity',
	async ({ type, id, skip, limit }: { type: CRMEntityType, id: number, skip?: number, limit?: number }, { rejectWithValue }) => {
		try {
			return await crmActivityService.getByEntity(type, id, skip, limit);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to fetch entity activities');
		}
	}
);

export const fetchActivityById = createAsyncThunk(
	'crmActivities/fetchById',
	async (publicId: string, { rejectWithValue }) => {
		try {
			return await crmActivityService.getById(publicId);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to fetch activity');
		}
	}
);

export const createActivity = createAsyncThunk(
	'crmActivities/create',
	async (activity: Partial<CRMActivityLog>, { rejectWithValue }) => {
		try {
			return await crmActivityService.create(activity);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to create activity');
		}
	}
);

const crmActivitySlice = createSlice({
	name: 'crmActivities',
	initialState,
	reducers: {
		clearSelectedActivity: (state) => {
			state.selectedActivity = null;
		},
		clearError: (state) => {
			state.error = null;
		}
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchRecentActivities.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchRecentActivities.fulfilled, (state, action: PayloadAction<CRMActivityLog[]>) => {
				state.loading = false;
				state.list = action.payload;
				state.total = action.payload.length;
			})
			.addCase(fetchRecentActivities.rejected, (state, action: PayloadAction<any>) => {
				state.loading = false;
				state.error = action.payload;
			})
			.addCase(fetchEntityActivities.fulfilled, (state, action: PayloadAction<CRMActivityPaginatedResponse>) => {
				state.list = action.payload.items;
				state.total = action.payload.total;
			})
			.addCase(fetchActivityById.fulfilled, (state, action: PayloadAction<CRMActivityLog>) => {
				state.selectedActivity = action.payload;
			})
			.addCase(createActivity.fulfilled, (state, action: PayloadAction<CRMActivityLog>) => {
				state.list.unshift(action.payload);
				state.total += 1;
			});
	}
});

export const { clearSelectedActivity, clearError } = crmActivitySlice.actions;
export default crmActivitySlice.reducer;
