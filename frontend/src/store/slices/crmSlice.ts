import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import crmService from '../../services/crmService';
import type { Lead, LeadCreate, LeadUpdate, LeadConvertRequest } from '../../models/crm/lead';
import type { Deal } from '../../models/crm/deal';
import type { Pipeline } from '../../models/crm/pipeline';
import type { Company } from '../../models/crm/company';
import type { Contact } from '../../models/crm/contact';
import type { CRMActivity, CRMActivityCreate, CRMActivityUpdate } from '../../models/crm/crmActivity';
import type { PaginatedResponse } from '../../models/common';

interface CrmState {
	leads: Lead[];
	leadsTotal: number;
	leadsPage: number;
	leadsPageSize: number;
	leadsLoading: boolean;
	leadsError: string | null;

	pipelines: Pipeline[];
	pipelinesLoading: boolean;

	companyOptions: Company[];
	companyOptionsLoading: boolean;

	contactOptions: Contact[];
	contactOptionsLoading: boolean;

	activities: CRMActivity[];
	activitiesLoading: boolean;
	activitiesError: string | null;

	convertLoading: boolean;
	convertError: string | null;
}

const initialState: CrmState = {
	leads: [],
	leadsTotal: 0,
	leadsPage: 1,
	leadsPageSize: 20,
	leadsLoading: false,
	leadsError: null,

	pipelines: [],
	pipelinesLoading: false,

	companyOptions: [],
	companyOptionsLoading: false,

	contactOptions: [],
	contactOptionsLoading: false,

	activities: [],
	activitiesLoading: false,
	activitiesError: null,

	convertLoading: false,
	convertError: null,
};

export const fetchLeads = createAsyncThunk(
	'crm/fetchLeads',
	async (params: { page?: number; pageSize?: number; search?: string; status?: string } | undefined, { rejectWithValue }) => {
		try {
			return await crmService.listLeads(params || {});
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || error.message || 'Failed to fetch leads');
		}
	}
);

export const createLead = createAsyncThunk(
	'crm/createLead',
	async (payload: LeadCreate, { rejectWithValue }) => {
		try {
			return await crmService.createLead(payload);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || error.message || 'Failed to create lead');
		}
	}
);

export const updateLead = createAsyncThunk(
	'crm/updateLead',
	async ({ publicId, payload }: { publicId: string; payload: LeadUpdate }, { rejectWithValue }) => {
		try {
			return await crmService.updateLead(publicId, payload);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || error.message || 'Failed to update lead');
		}
	}
);

export const deleteLead = createAsyncThunk(
	'crm/deleteLead',
	async (publicId: string, { rejectWithValue }) => {
		try {
			await crmService.deleteLead(publicId);
			return publicId;
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || error.message || 'Failed to delete lead');
		}
	}
);

export const convertLead = createAsyncThunk(
	'crm/convertLead',
	async ({ publicId, payload }: { publicId: string; payload: LeadConvertRequest }, { rejectWithValue }) => {
		try {
			const deal = await crmService.convertLead(publicId, payload);
			return { publicId, deal };
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || error.message || 'Failed to convert lead');
		}
	}
);

export const fetchPipelines = createAsyncThunk(
	'crm/fetchPipelines',
	async (_, { rejectWithValue }) => {
		try {
			return await crmService.listPipelines();
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || error.message || 'Failed to fetch pipelines');
		}
	}
);

export const searchCompanyOptions = createAsyncThunk(
	'crm/searchCompanyOptions',
	async (search: string | undefined, { rejectWithValue }) => {
		try {
			const result = await crmService.listCompanies(1, 20, search);
			return result.items;
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || error.message || 'Failed to search companies');
		}
	}
);

export const searchContactOptions = createAsyncThunk(
	'crm/searchContactOptions',
	async (params: { search?: string; companyId?: number } | undefined, { rejectWithValue }) => {
		try {
			const result = await crmService.listContacts(params?.companyId, 1, 20, params?.search);
			return result.items;
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || error.message || 'Failed to search contacts');
		}
	}
);

export const fetchLeadActivities = createAsyncThunk(
	'crm/fetchLeadActivities',
	async (leadId: number, { rejectWithValue }) => {
		try {
			return await crmService.listActivities({ entityType: 'lead', entityId: leadId, pageSize: 100 });
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || error.message || 'Failed to fetch activities');
		}
	}
);

export const createActivity = createAsyncThunk(
	'crm/createActivity',
	async (payload: CRMActivityCreate, { rejectWithValue }) => {
		try {
			return await crmService.createActivity(payload);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || error.message || 'Failed to create activity');
		}
	}
);

export const updateActivity = createAsyncThunk(
	'crm/updateActivity',
	async ({ publicId, payload }: { publicId: string; payload: CRMActivityUpdate }, { rejectWithValue }) => {
		try {
			return await crmService.updateActivity(publicId, payload);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || error.message || 'Failed to update activity');
		}
	}
);

export const deleteActivity = createAsyncThunk(
	'crm/deleteActivity',
	async (publicId: string, { rejectWithValue }) => {
		try {
			await crmService.deleteActivity(publicId);
			return publicId;
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || error.message || 'Failed to delete activity');
		}
	}
);

const crmSlice = createSlice({
	name: 'crm',
	initialState,
	reducers: {
		clearLeadsError: (state) => {
			state.leadsError = null;
		},
		clearConvertError: (state) => {
			state.convertError = null;
		},
		clearActivities: (state) => {
			state.activities = [];
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchLeads.pending, (state) => {
				state.leadsLoading = true;
				state.leadsError = null;
			})
			.addCase(fetchLeads.fulfilled, (state, action: PayloadAction<PaginatedResponse<Lead>>) => {
				state.leadsLoading = false;
				state.leads = action.payload.items;
				state.leadsTotal = action.payload.total;
				state.leadsPage = action.payload.page;
				state.leadsPageSize = action.payload.page_size;
			})
			.addCase(fetchLeads.rejected, (state, action: PayloadAction<any>) => {
				state.leadsLoading = false;
				state.leadsError = action.payload;
			})
			.addCase(createLead.fulfilled, (state, action: PayloadAction<Lead>) => {
				state.leads.unshift(action.payload);
				state.leadsTotal += 1;
			})
			.addCase(updateLead.fulfilled, (state, action: PayloadAction<Lead>) => {
				const idx = state.leads.findIndex((l) => l.public_id === action.payload.public_id);
				if (idx !== -1) state.leads[idx] = action.payload;
			})
			.addCase(deleteLead.fulfilled, (state, action: PayloadAction<string>) => {
				state.leads = state.leads.filter((l) => l.public_id !== action.payload);
				state.leadsTotal = Math.max(0, state.leadsTotal - 1);
			})
			.addCase(convertLead.pending, (state) => {
				state.convertLoading = true;
				state.convertError = null;
			})
			.addCase(convertLead.fulfilled, (state, action: PayloadAction<{ publicId: string; deal: Deal }>) => {
				state.convertLoading = false;
				const idx = state.leads.findIndex((l) => l.public_id === action.payload.publicId);
				if (idx !== -1) {
					state.leads[idx] = { ...state.leads[idx], status: 'converted', deal_id: action.payload.deal.id };
				}
			})
			.addCase(convertLead.rejected, (state, action: PayloadAction<any>) => {
				state.convertLoading = false;
				state.convertError = action.payload;
			})
			.addCase(fetchPipelines.pending, (state) => {
				state.pipelinesLoading = true;
			})
			.addCase(fetchPipelines.fulfilled, (state, action: PayloadAction<Pipeline[]>) => {
				state.pipelinesLoading = false;
				state.pipelines = action.payload;
			})
			.addCase(fetchPipelines.rejected, (state) => {
				state.pipelinesLoading = false;
			})
			.addCase(searchCompanyOptions.pending, (state) => {
				state.companyOptionsLoading = true;
			})
			.addCase(searchCompanyOptions.fulfilled, (state, action: PayloadAction<Company[]>) => {
				state.companyOptionsLoading = false;
				state.companyOptions = action.payload;
			})
			.addCase(searchCompanyOptions.rejected, (state) => {
				state.companyOptionsLoading = false;
			})
			.addCase(searchContactOptions.pending, (state) => {
				state.contactOptionsLoading = true;
			})
			.addCase(searchContactOptions.fulfilled, (state, action: PayloadAction<Contact[]>) => {
				state.contactOptionsLoading = false;
				state.contactOptions = action.payload;
			})
			.addCase(searchContactOptions.rejected, (state) => {
				state.contactOptionsLoading = false;
			})
			.addCase(fetchLeadActivities.pending, (state) => {
				state.activitiesLoading = true;
				state.activitiesError = null;
			})
			.addCase(fetchLeadActivities.fulfilled, (state, action: PayloadAction<PaginatedResponse<CRMActivity>>) => {
				state.activitiesLoading = false;
				state.activities = action.payload.items;
			})
			.addCase(fetchLeadActivities.rejected, (state, action: PayloadAction<any>) => {
				state.activitiesLoading = false;
				state.activitiesError = action.payload;
			})
			.addCase(createActivity.fulfilled, (state, action: PayloadAction<CRMActivity>) => {
				state.activities.unshift(action.payload);
			})
			.addCase(updateActivity.fulfilled, (state, action: PayloadAction<CRMActivity>) => {
				const idx = state.activities.findIndex((a) => a.public_id === action.payload.public_id);
				if (idx !== -1) state.activities[idx] = action.payload;
			})
			.addCase(deleteActivity.fulfilled, (state, action: PayloadAction<string>) => {
				state.activities = state.activities.filter((a) => a.public_id !== action.payload);
			});
	},
});

export const { clearLeadsError, clearConvertError, clearActivities } = crmSlice.actions;
export default crmSlice.reducer;
