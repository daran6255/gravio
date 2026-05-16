import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import leadService from '../../services/leadService';
import type { Lead, LeadCreate, LeadUpdate, LeadPaginatedResponse, LeadStatus, LeadSource, LeadStats } from '../../models/lead';
import type { Deal } from '../../models/deal';

interface LeadState {
	list: Lead[];
	total: number;
	selectedLead: Lead | null;
	stats: LeadStats | null;
	loading: boolean;
	error: string | null;
}

const initialState: LeadState = {
	list: [],
	total: 0,
	selectedLead: null,
	stats: null,
	loading: false,
	error: null,
};

export const fetchLeads = createAsyncThunk(
	'leads/fetchAll',
	async (params: {
		skip?: number;
		limit?: number;
		search?: string;
		status?: LeadStatus;
		source?: LeadSource;
		assignedTo?: number;
		minScore?: number;
		maxScore?: number;
		sortBy?: string;
		sortOrder?: 'asc' | 'desc';
	} | void, { rejectWithValue }) => {
		try {
			const { skip, limit, search, status, source, assignedTo, minScore, maxScore, sortBy, sortOrder } = params || {};
			return await leadService.getAll(skip, limit, search, status, source, assignedTo, minScore, maxScore, sortBy, sortOrder);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to fetch leads');
		}
	}
);

export const fetchLeadById = createAsyncThunk(
	'leads/fetchById',
	async (publicId: string, { rejectWithValue }) => {
		try {
			return await leadService.getById(publicId);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to fetch lead');
		}
	}
);

export const createLead = createAsyncThunk(
	'leads/create',
	async (lead: LeadCreate, { rejectWithValue }) => {
		try {
			return await leadService.create(lead);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to create lead');
		}
	}
);

export const updateLead = createAsyncThunk(
	'leads/update',
	async ({ publicId, lead }: { publicId: string, lead: LeadUpdate }, { rejectWithValue }) => {
		try {
			return await leadService.update(publicId, lead);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to update lead');
		}
	}
);

export const convertLead = createAsyncThunk(
	'leads/convert',
	async ({ publicId, dealData }: { publicId: string, dealData: any }, { rejectWithValue }) => {
		try {
			return await leadService.convert(publicId, dealData);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to convert lead');
		}
	}
);

export const deleteLead = createAsyncThunk(
	'leads/delete',
	async (publicId: string, { rejectWithValue }) => {
		try {
			await leadService.delete(publicId);
			return publicId;
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to delete lead');
		}
	}
);

export const fetchLeadStats = createAsyncThunk(
	'leads/fetchStats',
	async (ownOnly: boolean | void, { rejectWithValue }) => {
		try {
			return await leadService.getStats(!!ownOnly);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to fetch lead stats');
		}
	}
);

const leadSlice = createSlice({
	name: 'leads',
	initialState,
	reducers: {
		clearSelectedLead: (state) => {
			state.selectedLead = null;
		},
		clearError: (state) => {
			state.error = null;
		}
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchLeads.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchLeads.fulfilled, (state, action: PayloadAction<LeadPaginatedResponse>) => {
				state.loading = false;
				state.list = action.payload.items;
				state.total = action.payload.total;
			})
			.addCase(fetchLeads.rejected, (state, action: PayloadAction<any>) => {
				state.loading = false;
				state.error = action.payload;
			})
			.addCase(fetchLeadById.fulfilled, (state, action: PayloadAction<Lead>) => {
				state.selectedLead = action.payload;
			})
			.addCase(fetchLeadStats.fulfilled, (state, action: PayloadAction<LeadStats>) => {
				state.stats = action.payload;
			})
			.addCase(updateLead.fulfilled, (state, action: PayloadAction<Lead>) => {
				if (state.selectedLead?.public_id === action.payload.public_id) {
					state.selectedLead = action.payload;
				}
				const index = state.list.findIndex(l => l.public_id === action.payload.public_id);
				if (index !== -1) {
					state.list[index] = action.payload;
				}
			})
			.addCase(convertLead.fulfilled, (state, action: PayloadAction<{ lead: Lead, deal: Deal }>) => {
				if (state.selectedLead?.public_id === action.payload.lead.public_id) {
					state.selectedLead = action.payload.lead;
				}
				const index = state.list.findIndex(l => l.public_id === action.payload.lead.public_id);
				if (index !== -1) {
					state.list[index] = action.payload.lead;
				}
			})
			.addCase(deleteLead.fulfilled, (state, action: PayloadAction<string>) => {
				state.list = state.list.filter(l => l.public_id !== action.payload);
				if (state.selectedLead?.public_id === action.payload) {
					state.selectedLead = null;
				}
			});
	}
});

export const { clearSelectedLead, clearError } = leadSlice.actions;
export default leadSlice.reducer;
