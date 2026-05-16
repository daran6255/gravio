import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { type MockInterview, type MockInterviewCreate, type MockInterviewUpdate } from '../../models/MockInterview';
import mockInterviewService from '../../services/mockInterviewService';

interface MockInterviewState {
	mockInterviews: MockInterview[];
	currentMockInterview: MockInterview | null;
	loading: boolean;
	error: string | null;
	success: boolean;
}

const initialState: MockInterviewState = {
	mockInterviews: [],
	currentMockInterview: null,
	loading: false,
	error: null,
	success: false,
};

// Async thunks
export const fetchMockInterviewsByBatch = createAsyncThunk(
	'mockInterviews/fetchByBatch',
	async (batchId: number, { rejectWithValue }) => {
		try {
			return await mockInterviewService.getByBatchId(batchId);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to fetch mock interviews');
		}
	}
);

export const createMockInterview = createAsyncThunk(
	'mockInterviews/create',
	async (data: MockInterviewCreate, { rejectWithValue }) => {
		try {
			return await mockInterviewService.create(data);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to create mock interview');
		}
	}
);

export const updateMockInterview = createAsyncThunk(
	'mockInterviews/update',
	async ({ id, data }: { id: number; data: MockInterviewUpdate }, { rejectWithValue }) => {
		try {
			return await mockInterviewService.update(id, data);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to update mock interview');
		}
	}
);

export const deleteMockInterview = createAsyncThunk(
	'mockInterviews/delete',
	async (id: number, { rejectWithValue }) => {
		try {
			await mockInterviewService.delete(id);
			return id;
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to delete mock interview');
		}
	}
);

const mockInterviewSlice = createSlice({
	name: 'mockInterviews',
	initialState,
	reducers: {
		resetState: (state) => {
			state.loading = false;
			state.error = null;
			state.success = false;
			state.currentMockInterview = null;
		},
		setCurrentMockInterview: (state, action: PayloadAction<MockInterview | null>) => {
			state.currentMockInterview = action.payload;
		},
	},
	extraReducers: (builder) => {
		builder
			// Fetch by batch
			.addCase(fetchMockInterviewsByBatch.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchMockInterviewsByBatch.fulfilled, (state, action) => {
				state.loading = false;
				state.mockInterviews = action.payload;
			})
			.addCase(fetchMockInterviewsByBatch.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload as string;
			})
			// Create
			.addCase(createMockInterview.pending, (state) => {
				state.loading = true;
				state.error = null;
				state.success = false;
			})
			.addCase(createMockInterview.fulfilled, (state, action) => {
				state.loading = false;
				state.success = true;
				state.mockInterviews.unshift(action.payload);
				state.currentMockInterview = action.payload;
			})
			.addCase(createMockInterview.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload as string;
			})
			// Update
			.addCase(updateMockInterview.pending, (state) => {
				state.loading = true;
				state.error = null;
				state.success = false;
			})
			.addCase(updateMockInterview.fulfilled, (state, action) => {
				state.loading = false;
				state.success = true;
				const index = state.mockInterviews.findIndex((i) => i.id === action.payload.id);
				if (index !== -1) {
					state.mockInterviews[index] = action.payload;
				}
				state.currentMockInterview = action.payload;
			})
			.addCase(updateMockInterview.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload as string;
			})
			// Delete
			.addCase(deleteMockInterview.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(deleteMockInterview.fulfilled, (state, action) => {
				state.loading = false;
				state.mockInterviews = state.mockInterviews.filter((i) => i.id !== action.payload);
			})
			.addCase(deleteMockInterview.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload as string;
			});
	},
});

export const { resetState, setCurrentMockInterview } = mockInterviewSlice.actions;
export default mockInterviewSlice.reducer;
