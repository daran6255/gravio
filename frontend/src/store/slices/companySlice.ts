import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import companyService from '../../services/companyService';
import type { Company, CompanyCreate, CompanyUpdate, CompanyStats, CompanyPaginatedResponse } from '../../models/company';

interface CompanyState {
	list: Company[];
	total: number;
	selectedCompany: Company | null;
	stats: CompanyStats | null;
	loading: boolean;
	error: string | null;
}

const initialState: CompanyState = {
	list: [],
	total: 0,
	selectedCompany: null,
	stats: null,
	loading: false,
	error: null,
};

export const fetchCompanies = createAsyncThunk(
	'companies/fetchAll',
	async (params: {
		skip?: number;
		limit?: number;
		search?: string;
		status?: string;
		industry?: string;
		sortBy?: string;
		sortOrder?: 'asc' | 'desc';
	} | void, { rejectWithValue }) => {
		try {
			const { skip, limit, search, status, industry, sortBy, sortOrder } = params || {};
			return await companyService.getAll(skip, limit, search, status, industry, sortBy, sortOrder);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to fetch companies');
		}
	}
);

export const fetchCompanyById = createAsyncThunk(
	'companies/fetchById',
	async (publicId: string, { rejectWithValue }) => {
		try {
			return await companyService.getById(publicId);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to fetch company');
		}
	}
);

export const createCompany = createAsyncThunk(
	'companies/create',
	async (company: CompanyCreate, { rejectWithValue }) => {
		try {
			return await companyService.create(company);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to create company');
		}
	}
);

export const updateCompany = createAsyncThunk(
	'companies/update',
	async ({ publicId, company }: { publicId: string, company: CompanyUpdate }, { rejectWithValue }) => {
		try {
			return await companyService.update(publicId, company);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to update company');
		}
	}
);

export const deleteCompany = createAsyncThunk(
	'companies/delete',
	async (publicId: string, { rejectWithValue }) => {
		try {
			await companyService.delete(publicId);
			return publicId;
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to delete company');
		}
	}
);

export const fetchCompanyStats = createAsyncThunk(
	'companies/fetchStats',
	async (_, { rejectWithValue }) => {
		try {
			return await companyService.getStats();
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to fetch company stats');
		}
	}
);

const companySlice = createSlice({
	name: 'companies',
	initialState,
	reducers: {
		clearSelectedCompany: (state) => {
			state.selectedCompany = null;
		},
		clearError: (state) => {
			state.error = null;
		}
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchCompanies.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchCompanies.fulfilled, (state, action: PayloadAction<CompanyPaginatedResponse>) => {
				state.loading = false;
				state.list = action.payload.items;
				state.total = action.payload.total;
			})
			.addCase(fetchCompanies.rejected, (state, action: PayloadAction<any>) => {
				state.loading = false;
				state.error = action.payload;
			})
			.addCase(fetchCompanyById.fulfilled, (state, action: PayloadAction<Company>) => {
				state.selectedCompany = action.payload;
			})
			.addCase(fetchCompanyStats.fulfilled, (state, action: PayloadAction<CompanyStats>) => {
				state.stats = action.payload;
			})
			.addCase(updateCompany.fulfilled, (state, action: PayloadAction<Company>) => {
				if (state.selectedCompany?.public_id === action.payload.public_id) {
					state.selectedCompany = action.payload;
				}
				const index = state.list.findIndex(c => c.public_id === action.payload.public_id);
				if (index !== -1) {
					state.list[index] = action.payload;
				}
			})
			.addCase(deleteCompany.fulfilled, (state, action: PayloadAction<string>) => {
				state.list = state.list.filter(c => c.public_id !== action.payload);
				if (state.selectedCompany?.public_id === action.payload) {
					state.selectedCompany = null;
				}
			});
	}
});

export const { clearSelectedCompany, clearError } = companySlice.actions;
export default companySlice.reducer;
