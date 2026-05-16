import { createSlice, createAsyncThunk, type ActionReducerMapBuilder, type PayloadAction } from '@reduxjs/toolkit';
import dsrActivityTypeService from '../../services/dsrActivityTypeService';
import type { DSRActivityType, PaginationResult } from '../../models/dsr';

interface DSRActivityTypeState {
	activityTypes: DSRActivityType[];
	total: number;
	loading: boolean;
	error: string | null;
}

const initialState: DSRActivityTypeState = {
	activityTypes: [],
	total: 0,
	loading: false,
	error: null,
};

export const fetchActivityTypes = createAsyncThunk(
	'dsrActivityType/fetchActivityTypes',
	async (params: { skip?: number; limit?: number; onlyActive?: boolean } | undefined, { rejectWithValue }) => {
		try {
			const { skip = 0, limit = 100, onlyActive = true } = params || {};
			return await dsrActivityTypeService.getActivityTypes(skip, limit, onlyActive);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to fetch activity types');
		}
	}
);

export const createActivityType = createAsyncThunk(
	'dsrActivityType/createActivityType',
	async (data: Partial<DSRActivityType>, { rejectWithValue }) => {
		try {
			return await dsrActivityTypeService.createActivityType(data);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to create activity type');
		}
	}
);

export const updateActivityType = createAsyncThunk(
	'dsrActivityType/updateActivityType',
	async ({ publicId, data }: { publicId: string; data: Partial<DSRActivityType> }, { rejectWithValue }) => {
		try {
			return await dsrActivityTypeService.updateActivityType(publicId, data);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to update activity type');
		}
	}
);

export const deleteActivityType = createAsyncThunk(
	'dsrActivityType/deleteActivityType',
	async (publicId: string, { rejectWithValue }) => {
		try {
			await dsrActivityTypeService.deleteActivityType(publicId);
			return publicId;
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to delete activity type');
		}
	}
);

const dsrActivityTypeSlice = createSlice({
	name: 'dsrActivityType',
	initialState,
	reducers: {
		clearActivityTypeError: (state) => {
			state.error = null;
		},
	},
	extraReducers: (builderValue: ActionReducerMapBuilder<DSRActivityTypeState>) => {
		builderValue
			.addCase(fetchActivityTypes.fulfilled, (state, action: PayloadAction<PaginationResult<DSRActivityType>>) => {
				state.loading = false;
				state.activityTypes = action.payload.items;
				state.total = action.payload.total;
			})
			.addCase(createActivityType.fulfilled, (state, action: PayloadAction<DSRActivityType>) => {
				state.loading = false;
				state.activityTypes.unshift(action.payload);
				state.total += 1;
			})
			.addCase(updateActivityType.fulfilled, (state, action: PayloadAction<DSRActivityType>) => {
				state.loading = false;
				const index = state.activityTypes.findIndex(at => at.public_id === action.payload.public_id);
				if (index !== -1) {
					state.activityTypes[index] = action.payload;
				}
			})
			.addCase(deleteActivityType.fulfilled, (state, action: PayloadAction<string>) => {
				state.loading = false;
				state.activityTypes = state.activityTypes.filter(at => at.public_id !== action.payload);
				state.total -= 1;
			})
			.addMatcher(
				(action) => action.type.startsWith('dsrActivityType/') && action.type.endsWith('/pending'),
				(state) => {
					state.loading = true;
					state.error = null;
				}
			)
			.addMatcher(
				(action) => action.type.startsWith('dsrActivityType/') && action.type.endsWith('/rejected'),
				(state, action: any) => {
					state.loading = false;
					state.error = action.payload || 'An unknown error occurred';
				}
			)
			.addMatcher(
				(action) => action.type.startsWith('dsrActivityType/') && action.type.endsWith('/fulfilled'),
				(state) => {
					state.loading = false;
				}
			);
	},
});

export const { clearActivityTypeError } = dsrActivityTypeSlice.actions;
export default dsrActivityTypeSlice.reducer;
