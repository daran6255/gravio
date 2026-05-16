import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import trainingPlanService from '../../services/trainingPlanService';
import type { TrainingBatchPlan } from '../../models/training';

interface TrainingPlanState {
	weeklyPlan: TrainingBatchPlan[];
	allPlans: TrainingBatchPlan[];
	loading: boolean;
	error: string | null;
}

const initialState: TrainingPlanState = {
	weeklyPlan: [],
	allPlans: [],
	loading: false,
	error: null,
};

export const fetchWeeklyPlan = createAsyncThunk(
	'trainingPlan/fetchWeeklyPlan',
	async ({ batchPublicId, startDate }: { batchPublicId: string, startDate: string }, { rejectWithValue }) => {
		try {
			const response = await trainingPlanService.getWeeklyPlan(batchPublicId, startDate);
			return response;
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to fetch weekly plan');
		}
	}
);

export const fetchAllBatchPlans = createAsyncThunk(
	'trainingPlan/fetchAllBatchPlans',
	async (batchPublicId: string, { rejectWithValue }) => {
		try {
			const response = await trainingPlanService.getAllBatchPlans(batchPublicId);
			return response;
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to fetch all batch plans');
		}
	}
);

export const createPlanEntry = createAsyncThunk(
	'trainingPlan/createEntry',
	async (data: any, { rejectWithValue }) => {
		try {
			const response = await trainingPlanService.createPlanEntry(data);
			return response;
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to create plan entry');
		}
	}
);

export const updatePlanEntry = createAsyncThunk(
	'trainingPlan/updateEntry',
	async ({ publicId, data }: { publicId: string, data: Partial<TrainingBatchPlan> }, { rejectWithValue }) => {
		try {
			const response = await trainingPlanService.updatePlanEntry(publicId, data);
			return response;
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to update plan entry');
		}
	}
);

export const deletePlanEntry = createAsyncThunk(
	'trainingPlan/deleteEntry',
	async (publicId: string, { rejectWithValue }) => {
		try {
			await trainingPlanService.deletePlanEntry(publicId);
			return publicId;
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to delete plan entry');
		}
	}
);

export const syncBatchWithProject = createAsyncThunk(
	'trainingPlan/syncBatchWithProject',
	async (batchPublicId: string, { rejectWithValue }) => {
		try {
			await trainingPlanService.syncBatchWithProject(batchPublicId);
			return batchPublicId;
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to synchronize batch with project');
		}
	}
);

const trainingPlanSlice = createSlice({
	name: 'trainingPlan',
	initialState,
	reducers: {
		clearPlanError: (state) => {
			state.error = null;
		},
		resetWeeklyPlan: (state) => {
			state.weeklyPlan = [];
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchWeeklyPlan.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchWeeklyPlan.fulfilled, (state, action: PayloadAction<TrainingBatchPlan[]>) => {
				state.loading = false;
				state.weeklyPlan = action.payload;
			})
			.addCase(fetchWeeklyPlan.rejected, (state, action: PayloadAction<any>) => {
				state.loading = false;
				state.error = action.payload;
			})
			.addCase(createPlanEntry.fulfilled, (state, action: PayloadAction<TrainingBatchPlan>) => {
				state.weeklyPlan.push(action.payload);
			})
			.addCase(updatePlanEntry.fulfilled, (state, action: PayloadAction<TrainingBatchPlan>) => {
				const index = state.weeklyPlan.findIndex(p => p.public_id === action.payload.public_id);
				if (index !== -1) {
					state.weeklyPlan[index] = action.payload;
				}
			})
			.addCase(deletePlanEntry.fulfilled, (state, action: PayloadAction<string>) => {
				state.weeklyPlan = state.weeklyPlan.filter(p => p.public_id !== action.payload);
			})
			.addCase(fetchAllBatchPlans.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchAllBatchPlans.fulfilled, (state, action: PayloadAction<TrainingBatchPlan[]>) => {
				state.loading = false;
				state.allPlans = action.payload;
			})
			.addCase(fetchAllBatchPlans.rejected, (state, action: PayloadAction<any>) => {
				state.loading = false;
				state.error = action.payload;
			})
			.addCase(syncBatchWithProject.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(syncBatchWithProject.fulfilled, (state) => {
				state.loading = false;
			})
			.addCase(syncBatchWithProject.rejected, (state, action: PayloadAction<any>) => {
				state.loading = false;
				state.error = action.payload;
			});
	},
});

export const { clearPlanError, resetWeeklyPlan } = trainingPlanSlice.actions;
export default trainingPlanSlice.reducer;
