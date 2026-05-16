import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import trainingService from '../../services/trainingService';
import type { TrainingBatch, TrainingStats, CandidateAllocation } from '../../models/training';

interface TrainingState {
	batches: TrainingBatch[];
	stats: TrainingStats | null;
	allocations: CandidateAllocation[];
	eligibleCandidates: { public_id: string, name: string, email: string, phone: string, disability_type?: string }[];
	loading: boolean;
	total: number;
	error: string | null;
}

const initialState: TrainingState = {
	batches: [],
	stats: null,
	allocations: [],
	eligibleCandidates: [],
	loading: false,
	total: 0,
	error: null,
};

export const fetchTrainingStats = createAsyncThunk(
	'training/fetchStats',
	async (_, { rejectWithValue }) => {
		try {
			const response = await trainingService.getStats();
			return response;
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.message || 'Failed to fetch training stats');
		}
	}
);

export const fetchTrainingBatches = createAsyncThunk(
	'training/fetchBatches',
	async (params: any = {}, { rejectWithValue }) => {
		try {
			const response = await trainingService.getBatches(params);
			return response;
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.message || 'Failed to fetch training batches');
		}
	}
);

export const createTrainingBatch = createAsyncThunk(
	'training/createBatch',
	async (data: Partial<TrainingBatch>, { rejectWithValue }) => {
		try {
			const response = await trainingService.createBatch(data);
			return response;
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || error.response?.data?.message || 'Failed to create training batch');
		}
	}
);

export const updateTrainingBatch = createAsyncThunk(
	'training/updateBatch',
	async ({ publicId, data }: { publicId: string, data: Partial<TrainingBatch> }, { rejectWithValue }) => {
		try {
			const response = await trainingService.updateBatch(publicId, data);
			return response;
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || error.response?.data?.message || 'Failed to update training batch');
		}
	}
);

export const extendTrainingBatch = createAsyncThunk(
	'training/extendBatch',
	async ({ publicId, new_close_date, reason }: { publicId: string, new_close_date: string, reason?: string }, { rejectWithValue }) => {
		try {
			const response = await trainingService.extendBatch(publicId, { new_close_date, reason });
			return response;
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || error.response?.data?.message || 'Failed to extend training batch');
		}
	}
);

export const fetchAllocations = createAsyncThunk(
	'training/fetchAllocations',
	async ({ batchPublicId, params }: { batchPublicId: string, params?: any }, { rejectWithValue }) => {
		try {
			const response = await trainingService.getAllocations(batchPublicId, params);
			return response;
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || error.response?.data?.message || 'Failed to fetch allocations');
		}
	}
);

export const fetchEligibleCandidates = createAsyncThunk(
	'training/fetchEligibleCandidates',
	async (batchPublicId: string | undefined, { rejectWithValue }) => {
		try {
			const response = await trainingService.getEligibleCandidates(batchPublicId);
			return response;
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.message || 'Failed to fetch eligible candidates');
		}
	}
);

export const markAsDropout = createAsyncThunk(
	'training/markAsDropout',
	async ({ publicId, remark }: { publicId: string, remark: string }, { rejectWithValue }) => {
		try {
			const response = await trainingService.updateAllocation(publicId, {
				is_dropout: true,
				status: 'dropped_out',
				dropout_remark: remark
			});
			return response;
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || error.response?.data?.message || 'Failed to mark as dropout');
		}
	}
);

export const allocateCandidate = createAsyncThunk(
	'training/allocateCandidate',
	async ({ batchId, candidateId, batchPublicId, candidatePublicId }: { batchId: number, candidateId: number, batchPublicId?: string, candidatePublicId?: string }, { rejectWithValue, dispatch }) => {
		try {
			const response = await trainingService.allocateCandidate({
				batch_id: batchId,
				candidate_id: candidateId,
				batch_public_id: batchPublicId,
				candidate_public_id: candidatePublicId,
				status: 'allocated'
			});
			// If allocation successful, we might need to refresh stats and batches because status might have changed
			dispatch(fetchTrainingStats());
			dispatch(fetchTrainingBatches({}));
			return response;
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || error.response?.data?.message || 'Failed to allocate candidate');
		}
	}
);

export const removeAllocation = createAsyncThunk(
	'training/removeAllocation',
	async (publicId: string, { rejectWithValue }) => {
		try {
			await trainingService.removeAllocation(publicId);
			return publicId;
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || error.response?.data?.message || 'Failed to remove allocation');
		}
	}
);

export const reallocateCandidate = createAsyncThunk(
	'training/reallocateCandidate',
	async ({ publicId, newBatchPublicId, transferData }: { publicId: string; newBatchPublicId: string; transferData: boolean }, { rejectWithValue }) => {
		try {
			const data = await trainingService.reallocateCandidate(publicId, newBatchPublicId, transferData);
			return { publicId, newAllocation: data };
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || error.response?.data?.message || 'Failed to reallocate candidate');
		}
	}
);

export const updateAllocationStatus = createAsyncThunk(
	'training/updateAllocationStatus',
	async ({ publicId, status }: { publicId: string, status: string }, { rejectWithValue }) => {
		try {
			const response = await trainingService.updateAllocation(publicId, { status: status });
			return response;
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || error.response?.data?.message || 'Failed to update allocation status');
		}
	}
);

export const deleteTrainingBatch = createAsyncThunk(
	'training/deleteBatch',
	async (publicId: string, { rejectWithValue }) => {
		try {
			await trainingService.deleteBatch(publicId);
			return publicId;
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || error.response?.data?.message || 'Failed to delete training batch');
		}
	}
);

export const fetchAllAllocations = createAsyncThunk(
	'training/fetchAllAllocations',
	async (params: any = {}, { rejectWithValue }) => {
		try {
			const response = await trainingService.getAllAllocations(params);
			return response;
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || error.response?.data?.message || 'Failed to fetch allocations');
		}
	}
);

const trainingSlice = createSlice({
	name: 'training',
	initialState,
	reducers: {
		clearError: (state) => {
			state.error = null;
		},
	},
	extraReducers: (builder) => {
		builder
			// Stats
			.addCase(fetchTrainingStats.pending, (state) => {
				state.loading = true;
			})
			.addCase(fetchTrainingStats.fulfilled, (state, action: PayloadAction<TrainingStats>) => {
				state.loading = false;
				state.stats = action.payload;
			})
			.addCase(fetchTrainingStats.rejected, (state, action: PayloadAction<any>) => {
				state.loading = false;
				state.error = action.payload;
			})
			// Batches
			.addCase(fetchTrainingBatches.pending, (state) => {
				state.loading = true;
			})
			.addCase(fetchTrainingBatches.fulfilled, (state, action: PayloadAction<{ items: TrainingBatch[], total: number }>) => {
				state.loading = false;
				state.batches = action.payload.items;
				state.total = action.payload.total;
			})
			.addCase(fetchTrainingBatches.rejected, (state, action: PayloadAction<any>) => {
				state.loading = false;
				state.error = action.payload;
			})
			// Create
			.addCase(createTrainingBatch.fulfilled, (state, action: PayloadAction<TrainingBatch>) => {
				state.loading = false;
				state.batches.unshift(action.payload);
			})
			// Update
			.addCase(updateTrainingBatch.fulfilled, (state, action: PayloadAction<TrainingBatch>) => {
				state.loading = false;
				const index = state.batches.findIndex(b => b.public_id === action.payload.public_id);
				if (index !== -1) {
					state.batches[index] = action.payload;
				}
			})
			// Extend
			.addCase(extendTrainingBatch.fulfilled, (state, action: PayloadAction<TrainingBatch>) => {
				state.loading = false;
				const index = state.batches.findIndex(b => b.public_id === action.payload.public_id);
				if (index !== -1) {
					state.batches[index] = action.payload;
				}
			})
			// Allocations
			.addCase(fetchAllocations.pending, (state) => {
				state.loading = true;
			})
			.addCase(fetchAllocations.fulfilled, (state, action: PayloadAction<CandidateAllocation[]>) => {
				state.loading = false;
				state.allocations = action.payload;
			})
			.addCase(fetchAllocations.rejected, (state, action: PayloadAction<any>) => {
				state.loading = false;
				state.error = action.payload;
			})
			// Eligible Candidates
			.addCase(fetchEligibleCandidates.fulfilled, (state, action: PayloadAction<any[]>) => {
				state.eligibleCandidates = action.payload;
			})
			// Allocate
			.addCase(allocateCandidate.fulfilled, (state, action: PayloadAction<CandidateAllocation>) => {
				state.allocations.push(action.payload);
				// Remove from eligible list
				state.eligibleCandidates = state.eligibleCandidates.filter(c => c.public_id !== action.payload.candidate?.public_id);
			})
			// Update Status
			.addCase(updateAllocationStatus.fulfilled, (state, action: PayloadAction<CandidateAllocation>) => {
				const index = state.allocations.findIndex(a => a.public_id === action.payload.public_id);
				if (index !== -1) {
					state.allocations[index] = action.payload;
				}
			})
			.addCase(markAsDropout.fulfilled, (state, action: PayloadAction<CandidateAllocation>) => {
				const index = state.allocations.findIndex(a => a.public_id === action.payload.public_id);
				if (index !== -1) {
					state.allocations[index] = action.payload;
				}
			})
			.addCase(removeAllocation.fulfilled, (state, action: PayloadAction<string>) => {
				state.allocations = state.allocations.filter(a => a.public_id !== action.payload);
			})
			.addCase(reallocateCandidate.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(reallocateCandidate.fulfilled, (state, action: PayloadAction<{ publicId: string, newAllocation: any }>) => {
				state.loading = false;
				// Remove the old allocation from the list as it's been soft-deleted and moved
				state.allocations = state.allocations.filter(a => a.public_id !== action.payload.publicId);
			})
			.addCase(reallocateCandidate.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload as string;
			})
			.addCase(deleteTrainingBatch.fulfilled, (state, action: PayloadAction<string>) => {
				state.loading = false;
				state.batches = state.batches.filter(b => b.public_id !== action.payload);
				state.total -= 1;
			})
			// Global Allocations
			.addCase(fetchAllAllocations.pending, (state) => {
				state.loading = true;
			})
			.addCase(fetchAllAllocations.fulfilled, (state, action: PayloadAction<{ items: CandidateAllocation[], total: number }>) => {
				state.loading = false;
				state.allocations = action.payload.items;
				state.total = action.payload.total;
			})
			.addCase(fetchAllAllocations.rejected, (state, action: PayloadAction<any>) => {
				state.loading = false;
				state.error = action.payload;
			});
	},
});

export const { clearError } = trainingSlice.actions;
export default trainingSlice.reducer;
