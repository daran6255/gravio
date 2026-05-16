import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import dealService from '../../services/dealService';
import type { Deal, DealCreate, DealUpdate, DealPaginatedResponse, DealStage, DealType, DealPipelineSummary } from '../../models/deal';

interface DealState {
	list: Deal[];
	total: number;
	selectedDeal: Deal | null;
	pipeline: DealPipelineSummary | null;
	loading: boolean;
	error: string | null;
}

const initialState: DealState = {
	list: [],
	total: 0,
	selectedDeal: null,
	pipeline: null,
	loading: false,
	error: null,
};

export const fetchDeals = createAsyncThunk(
	'deals/fetchAll',
	async (params: {
		skip?: number;
		limit?: number;
		search?: string;
		stage?: DealStage;
		dealType?: DealType;
		assignedTo?: number;
		companyId?: number;
		sortBy?: string;
		sortOrder?: 'asc' | 'desc';
	} | void, { rejectWithValue }) => {
		try {
			const { skip, limit, search, stage, dealType, assignedTo, companyId, sortBy, sortOrder } = params || {};
			return await dealService.getAll(skip, limit, search, stage, dealType, assignedTo, companyId, sortBy, sortOrder);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to fetch deals');
		}
	}
);

export const fetchDealById = createAsyncThunk(
	'deals/fetchById',
	async (publicId: string, { rejectWithValue }) => {
		try {
			return await dealService.getById(publicId);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to fetch deal');
		}
	}
);

export const createDeal = createAsyncThunk(
	'deals/create',
	async (deal: DealCreate, { rejectWithValue }) => {
		try {
			return await dealService.create(deal);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to create deal');
		}
	}
);

export const updateDeal = createAsyncThunk(
	'deals/update',
	async ({ publicId, deal }: { publicId: string, deal: DealUpdate }, { rejectWithValue }) => {
		try {
			return await dealService.update(publicId, deal);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to update deal');
		}
	}
);

export const deleteDeal = createAsyncThunk(
	'deals/delete',
	async (publicId: string, { rejectWithValue }) => {
		try {
			await dealService.delete(publicId);
			return publicId;
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to delete deal');
		}
	}
);

export const fetchPipelineSummary = createAsyncThunk(
	'deals/fetchPipeline',
	async (ownOnly: boolean | void, { rejectWithValue }) => {
		try {
			return await dealService.getPipeline(!!ownOnly);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to fetch pipeline summary');
		}
	}
);

const dealSlice = createSlice({
	name: 'deals',
	initialState,
	reducers: {
		clearSelectedDeal: (state) => {
			state.selectedDeal = null;
		},
		clearError: (state) => {
			state.error = null;
		}
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchDeals.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchDeals.fulfilled, (state, action: PayloadAction<DealPaginatedResponse>) => {
				state.loading = false;
				state.list = action.payload.items;
				state.total = action.payload.total;
			})
			.addCase(fetchDeals.rejected, (state, action: PayloadAction<any>) => {
				state.loading = false;
				state.error = action.payload;
			})
			.addCase(fetchDealById.fulfilled, (state, action: PayloadAction<Deal>) => {
				state.selectedDeal = action.payload;
			})
			.addCase(fetchPipelineSummary.fulfilled, (state, action: PayloadAction<DealPipelineSummary>) => {
				state.pipeline = action.payload;
			})
			.addCase(updateDeal.fulfilled, (state, action: PayloadAction<Deal>) => {
				if (state.selectedDeal?.public_id === action.payload.public_id) {
					state.selectedDeal = action.payload;
				}
				const index = state.list.findIndex(d => d.public_id === action.payload.public_id);
				if (index !== -1) {
					state.list[index] = action.payload;
				}
			})
			.addCase(deleteDeal.fulfilled, (state, action: PayloadAction<string>) => {
				state.list = state.list.filter(d => d.public_id !== action.payload);
				if (state.selectedDeal?.public_id === action.payload) {
					state.selectedDeal = null;
				}
			});
	}
});

export const { clearSelectedDeal, clearError } = dealSlice.actions;
export default dealSlice.reducer;
