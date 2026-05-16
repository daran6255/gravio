import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import publicInterviewService from '../../services/publicInterviewService';
import type { TrainingMockInterview } from '../../models/training';

interface PublicInterviewState {
	currentInterview: TrainingMockInterview | null;
	loading: boolean;
	submitting: boolean;
	error: string | null;
	submitted: boolean;
}

const initialState: PublicInterviewState = {
	currentInterview: null,
	loading: false,
	submitting: false,
	error: null,
	submitted: false,
};

export const fetchPublicInterview = createAsyncThunk(
	'publicInterview/fetch',
	async (token: string, { rejectWithValue }) => {
		try {
			return await publicInterviewService.getInterview(token);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to fetch interview details');
		}
	}
);

export const submitPublicAnswers = createAsyncThunk(
	'publicInterview/submit',
	async ({ token, answers }: { token: string; answers: { question: string; answer: string }[] }, { rejectWithValue }) => {
		try {
			return await publicInterviewService.submitAnswers(token, answers);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to submit evaluation answers');
		}
	}
);

const publicInterviewSlice = createSlice({
	name: 'publicInterview',
	initialState,
	reducers: {
		resetPublicState: (state) => {
			state.loading = false;
			state.submitting = false;
			state.error = null;
			state.submitted = false;
			state.currentInterview = null;
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchPublicInterview.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchPublicInterview.fulfilled, (state, action) => {
				state.loading = false;
				state.currentInterview = action.payload;
			})
			.addCase(fetchPublicInterview.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload as string;
			})
			.addCase(submitPublicAnswers.pending, (state) => {
				state.submitting = true;
				state.error = null;
			})
			.addCase(submitPublicAnswers.fulfilled, (state, action) => {
				state.submitting = false;
				state.currentInterview = action.payload;
			})
			.addCase(submitPublicAnswers.rejected, (state, action) => {
				state.submitting = false;
				state.error = action.payload as string;
			});
	},
});

export const { resetPublicState } = publicInterviewSlice.actions;
export default publicInterviewSlice.reducer;
