import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import crmService from '../../services/crmService';
import type {
	Lead,
	LeadCreate,
	LeadCreateResponse,
	LeadUpdate,
	LeadConvertRequest,
	LeadHistoryEntry,
	LeadImportResponse,
} from '../../models/crm/lead';
import type { Deal, DealCreate, DealUpdate } from '../../models/crm/deal';
import type { DealTask, DealTaskCreate, DealTaskUpdate } from '../../models/crm/dealTask';
import type { Reminder, ReminderCreate, ReminderUpdate, ReminderEntityType } from '../../models/crm/reminder';
import type { Pipeline, PipelineCreate, PipelineStageUpsert } from '../../models/crm/pipeline';
import type { Company, CompanyCreate, CompanyUpdate } from '../../models/crm/company';
import type { Contact, ContactCreate, ContactUpdate } from '../../models/crm/contact';
import type { CRMActivity, CRMActivityCreate, CRMActivityUpdate } from '../../models/crm/crmActivity';
import type { CRMStats, CRMLeadStats, CRMCompanyStats } from '../../models/crm/crmStats';
import type { CRMOwnerOption } from '../../models/crm/owner';
import type { PaginatedResponse } from '../../models/common';

/** Backend errors are shaped { success, error: { code, message, detail } } - not a top-level `detail`. */
function extractErrorMessage(error: any, fallback: string): string {
	return error?.response?.data?.error?.message || error?.response?.data?.detail || error?.message || fallback;
}

interface CrmState {
	leads: Lead[];
	leadsTotal: number;
	leadsPage: number;
	leadsPageSize: number;
	leadsLoading: boolean;
	leadsError: string | null;

	leadStats: CRMLeadStats | null;
	leadStatsLoading: boolean;
	leadStatsError: string | null;

	pipelines: Pipeline[];
	pipelinesLoading: boolean;
	pipelineMutationLoading: boolean;
	pipelineMutationError: string | null;

	deals: Deal[];
	dealsLoading: boolean;
	dealsError: string | null;

	companies: Company[];
	companiesTotal: number;
	companiesPage: number;
	companiesPageSize: number;
	companiesLoading: boolean;
	companiesError: string | null;

	companyStats: CRMCompanyStats | null;
	companyStatsLoading: boolean;
	companyStatsError: string | null;

	companiesBulkUpdateLoading: boolean;
	companiesBulkUpdateError: string | null;

	companiesBulkDeleteLoading: boolean;
	companiesBulkDeleteError: string | null;

	contacts: Contact[];
	contactsTotal: number;
	contactsPage: number;
	contactsPageSize: number;
	contactsLoading: boolean;
	contactsError: string | null;

	companyOptions: Company[];
	companyOptionsLoading: boolean;

	contactOptions: Contact[];
	contactOptionsLoading: boolean;

	linkedContacts: Contact[];
	linkedContactsLoading: boolean;

	linkedDeals: Deal[];
	linkedDealsLoading: boolean;

	activities: CRMActivity[];
	activitiesLoading: boolean;
	activitiesError: string | null;

	reminders: Reminder[];
	remindersLoading: boolean;
	reminderMutating: boolean;

	feedActivities: CRMActivity[];
	feedActivitiesTotal: number;
	feedActivitiesPage: number;
	feedActivitiesPageSize: number;
	feedActivitiesLoading: boolean;
	feedActivitiesError: string | null;

	stats: CRMStats | null;
	statsLoading: boolean;
	statsError: string | null;

	owners: CRMOwnerOption[];
	ownersLoading: boolean;

	bulkUpdateLoading: boolean;
	bulkUpdateError: string | null;

	bulkDeleteLoading: boolean;
	bulkDeleteError: string | null;

	convertLoading: boolean;
	convertError: string | null;

	leadHistory: LeadHistoryEntry[];
	leadHistoryLoading: boolean;
	leadHistoryError: string | null;

	anonymizeLoading: boolean;
	anonymizeError: string | null;

	importLoading: boolean;
	importError: string | null;
	importResult: LeadImportResponse | null;

	dealTasks: DealTask[];
	dealTasksLoading: boolean;
	dealTaskMutating: boolean;

	allDealTasks: (DealTask & { deal_title?: string; deal_public_id?: string })[];
	allDealTasksLoading: boolean;
	allDealTasksError: string | null;
}

const initialState: CrmState = {
	leads: [],
	leadsTotal: 0,
	leadsPage: 1,
	leadsPageSize: 20,
	leadsLoading: false,
	leadsError: null,

	leadStats: null,
	leadStatsLoading: false,
	leadStatsError: null,

	pipelines: [],
	pipelinesLoading: false,
	pipelineMutationLoading: false,
	pipelineMutationError: null,

	deals: [],
	dealsLoading: false,
	dealsError: null,

	companies: [],
	companiesTotal: 0,
	companiesPage: 1,
	companiesPageSize: 20,
	companiesLoading: false,
	companiesError: null,

	companyStats: null,
	companyStatsLoading: false,
	companyStatsError: null,

	companiesBulkUpdateLoading: false,
	companiesBulkUpdateError: null,

	companiesBulkDeleteLoading: false,
	companiesBulkDeleteError: null,

	contacts: [],
	contactsTotal: 0,
	contactsPage: 1,
	contactsPageSize: 20,
	contactsLoading: false,
	contactsError: null,

	companyOptions: [],
	companyOptionsLoading: false,

	contactOptions: [],
	contactOptionsLoading: false,

	linkedContacts: [],
	linkedContactsLoading: false,

	linkedDeals: [],
	linkedDealsLoading: false,

	activities: [],
	activitiesLoading: false,
	activitiesError: null,

	reminders: [],
	remindersLoading: false,
	reminderMutating: false,

	feedActivities: [],
	feedActivitiesTotal: 0,
	feedActivitiesPage: 1,
	feedActivitiesPageSize: 20,
	feedActivitiesLoading: false,
	feedActivitiesError: null,

	stats: null,
	statsLoading: false,
	statsError: null,

	owners: [],
	ownersLoading: false,

	bulkUpdateLoading: false,
	bulkUpdateError: null,

	bulkDeleteLoading: false,
	bulkDeleteError: null,

	convertLoading: false,
	convertError: null,

	leadHistory: [],
	leadHistoryLoading: false,
	leadHistoryError: null,

	anonymizeLoading: false,
	anonymizeError: null,

	importLoading: false,
	importError: null,
	importResult: null,

	dealTasks: [],
	dealTasksLoading: false,
	dealTaskMutating: false,

	allDealTasks: [],
	allDealTasksLoading: false,
	allDealTasksError: null,
};

export const fetchLeads = createAsyncThunk(
	'crm/fetchLeads',
	async (
		params: {
			page?: number;
			pageSize?: number;
			search?: string;
			status?: string;
			priority?: string;
			source?: string;
			ownerId?: number;
			stale?: boolean;
		} | undefined,
		{ rejectWithValue }
	) => {
		try {
			return await crmService.listLeads(params || {});
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to fetch leads'));
		}
	}
);

export const createLead = createAsyncThunk(
	'crm/createLead',
	async (payload: LeadCreate, { rejectWithValue }) => {
		try {
			return await crmService.createLead(payload);
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to create lead'));
		}
	}
);

export const updateLead = createAsyncThunk(
	'crm/updateLead',
	async ({ publicId, payload }: { publicId: string; payload: LeadUpdate }, { rejectWithValue }) => {
		try {
			return await crmService.updateLead(publicId, payload);
		} catch (error: any) {
			return rejectWithValue({
				message: extractErrorMessage(error, 'Failed to update lead'),
				status: error?.response?.status,
			});
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
			return rejectWithValue(extractErrorMessage(error, 'Failed to delete lead'));
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

export const bulkUpdateLeads = createAsyncThunk(
	'crm/bulkUpdateLeads',
	async (params: { publicIds: string[]; ownerId?: number; status?: string }, { rejectWithValue }) => {
		try {
			return await crmService.bulkUpdateLeads(params.publicIds, { ownerId: params.ownerId, status: params.status });
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to update leads'));
		}
	}
);

export const bulkDeleteLeads = createAsyncThunk(
	'crm/bulkDeleteLeads',
	async (publicIds: string[], { rejectWithValue }) => {
		try {
			await crmService.bulkDeleteLeads(publicIds);
			return publicIds;
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to delete leads'));
		}
	}
);

export const fetchLeadHistory = createAsyncThunk(
	'crm/fetchLeadHistory',
	async (publicId: string, { rejectWithValue }) => {
		try {
			return await crmService.getLeadHistory(publicId);
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to fetch lead history'));
		}
	}
);

export const anonymizeLead = createAsyncThunk(
	'crm/anonymizeLead',
	async (publicId: string, { rejectWithValue }) => {
		try {
			return await crmService.anonymizeLead(publicId);
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to anonymize lead'));
		}
	}
);

export const importLeadsCsv = createAsyncThunk(
	'crm/importLeadsCsv',
	async (file: File, { rejectWithValue }) => {
		try {
			return await crmService.importLeadsCsv(file);
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to import leads'));
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

export const createPipeline = createAsyncThunk(
	'crm/createPipeline',
	async (payload: PipelineCreate, { rejectWithValue }) => {
		try {
			return await crmService.createPipeline(payload);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || error.message || 'Failed to create pipeline');
		}
	}
);

export const updatePipelineStages = createAsyncThunk(
	'crm/updatePipelineStages',
	async ({ pipelineId, stages }: { pipelineId: number; stages: PipelineStageUpsert[] }, { rejectWithValue }) => {
		try {
			return await crmService.updatePipelineStages(pipelineId, stages);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || error.message || 'Failed to update pipeline stages');
		}
	}
);

export const fetchDeals = createAsyncThunk(
	'crm/fetchDeals',
	async (params: { pipelineId?: number; search?: string; ownerId?: number } | undefined, { rejectWithValue }) => {
		try {
			return await crmService.listDeals({ ...params, pageSize: 200 });
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || error.message || 'Failed to fetch deals');
		}
	}
);

export const createDeal = createAsyncThunk(
	'crm/createDeal',
	async (payload: DealCreate, { rejectWithValue }) => {
		try {
			return await crmService.createDeal(payload);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || error.message || 'Failed to create deal');
		}
	}
);

export const updateDeal = createAsyncThunk(
	'crm/updateDeal',
	async ({ publicId, payload }: { publicId: string; payload: DealUpdate }, { rejectWithValue }) => {
		try {
			return await crmService.updateDeal(publicId, payload);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || error.message || 'Failed to update deal');
		}
	}
);

export const deleteDeal = createAsyncThunk(
	'crm/deleteDeal',
	async (publicId: string, { rejectWithValue }) => {
		try {
			await crmService.deleteDeal(publicId);
			return publicId;
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || error.message || 'Failed to delete deal');
		}
	}
);

export const searchCompanyOptions = createAsyncThunk(
	'crm/searchCompanyOptions',
	async (search: string | undefined, { rejectWithValue }) => {
		try {
			const result = await crmService.listCompanies({ page: 1, pageSize: 20, search });
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

export const fetchCompanies = createAsyncThunk(
	'crm/fetchCompanies',
	async (
		params: {
			page?: number;
			pageSize?: number;
			search?: string;
			status?: string;
			industry?: string;
			size?: string;
			ownerId?: number;
		} | undefined,
		{ rejectWithValue }
	) => {
		try {
			return await crmService.listCompanies(params || {});
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || error.message || 'Failed to fetch companies');
		}
	}
);

export const fetchCompanyStats = createAsyncThunk(
	'crm/fetchCompanyStats',
	async (_: void | undefined, { rejectWithValue }) => {
		try {
			return await crmService.getCompanyStats();
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to fetch company stats'));
		}
	}
);

export const bulkUpdateCompanies = createAsyncThunk(
	'crm/bulkUpdateCompanies',
	async (params: { publicIds: string[]; ownerId?: number; status?: string }, { rejectWithValue }) => {
		try {
			return await crmService.bulkUpdateCompanies(params.publicIds, { ownerId: params.ownerId, status: params.status });
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to update companies'));
		}
	}
);

export const bulkDeleteCompanies = createAsyncThunk(
	'crm/bulkDeleteCompanies',
	async (publicIds: string[], { rejectWithValue }) => {
		try {
			await crmService.bulkDeleteCompanies(publicIds);
			return publicIds;
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to delete companies'));
		}
	}
);

export const createCompany = createAsyncThunk(
	'crm/createCompany',
	async (payload: CompanyCreate, { rejectWithValue }) => {
		try {
			return await crmService.createCompany(payload);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || error.message || 'Failed to create company');
		}
	}
);

export const updateCompany = createAsyncThunk(
	'crm/updateCompany',
	async ({ publicId, payload }: { publicId: string; payload: CompanyUpdate }, { rejectWithValue }) => {
		try {
			return await crmService.updateCompany(publicId, payload);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || error.message || 'Failed to update company');
		}
	}
);

export const deleteCompany = createAsyncThunk(
	'crm/deleteCompany',
	async (publicId: string, { rejectWithValue }) => {
		try {
			await crmService.deleteCompany(publicId);
			return publicId;
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || error.message || 'Failed to delete company');
		}
	}
);

export const fetchContacts = createAsyncThunk(
	'crm/fetchContacts',
	async (params: { companyId?: number; page?: number; pageSize?: number; search?: string } | undefined, { rejectWithValue }) => {
		try {
			const { companyId, page = 1, pageSize = 20, search } = params || {};
			return await crmService.listContacts(companyId, page, pageSize, search);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || error.message || 'Failed to fetch contacts');
		}
	}
);

export const createContact = createAsyncThunk(
	'crm/createContact',
	async (payload: ContactCreate, { rejectWithValue }) => {
		try {
			return await crmService.createContact(payload);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || error.message || 'Failed to create contact');
		}
	}
);

export const updateContact = createAsyncThunk(
	'crm/updateContact',
	async ({ publicId, payload }: { publicId: string; payload: ContactUpdate }, { rejectWithValue }) => {
		try {
			return await crmService.updateContact(publicId, payload);
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || error.message || 'Failed to update contact');
		}
	}
);

export const deleteContact = createAsyncThunk(
	'crm/deleteContact',
	async (publicId: string, { rejectWithValue }) => {
		try {
			await crmService.deleteContact(publicId);
			return publicId;
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || error.message || 'Failed to delete contact');
		}
	}
);

export const fetchLinkedContacts = createAsyncThunk(
	'crm/fetchLinkedContacts',
	async (companyId: number, { rejectWithValue }) => {
		try {
			const result = await crmService.listContacts(companyId, 1, 50);
			return result.items;
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || error.message || 'Failed to fetch linked contacts');
		}
	}
);

export const fetchLinkedDeals = createAsyncThunk(
	'crm/fetchLinkedDeals',
	async (params: { companyId?: number; contactId?: number }, { rejectWithValue }) => {
		try {
			const result = await crmService.listDeals({ companyId: params.companyId, contactId: params.contactId, pageSize: 50 });
			return result.items;
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || error.message || 'Failed to fetch linked deals');
		}
	}
);

export const fetchEntityActivities = createAsyncThunk(
	'crm/fetchEntityActivities',
	async ({ entityType, entityId }: { entityType: string; entityId: number }, { rejectWithValue }) => {
		try {
			return await crmService.listActivities({ entityType, entityId, pageSize: 100 });
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

export const fetchActivityFeed = createAsyncThunk(
	'crm/fetchActivityFeed',
	async (
		params: { type?: string; ownerId?: number; dateFrom?: string; dateTo?: string; page?: number; pageSize?: number } | undefined,
		{ rejectWithValue }
	) => {
		try {
			return await crmService.listActivities(params || {});
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || error.message || 'Failed to fetch activity feed');
		}
	}
);

export const fetchStats = createAsyncThunk(
	'crm/fetchStats',
	async (_, { rejectWithValue }) => {
		try {
			return await crmService.getStats();
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || error.message || 'Failed to fetch dashboard stats');
		}
	}
);

export const fetchLeadStats = createAsyncThunk(
	'crm/fetchLeadStats',
	async (_, { rejectWithValue }) => {
		try {
			return await crmService.getLeadStats();
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || error.message || 'Failed to fetch lead stats');
		}
	}
);

export const fetchOwners = createAsyncThunk(
	'crm/fetchOwners',
	async (_, { rejectWithValue }) => {
		try {
			return await crmService.listOwners();
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || error.message || 'Failed to fetch owners');
		}
	}
);

export const fetchDealTasks = createAsyncThunk(
	'crm/fetchDealTasks',
	async (dealPublicId: string, { rejectWithValue }) => {
		try {
			return await crmService.getDealTasks(dealPublicId);
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to fetch deal tasks'));
		}
	}
);

export const createDealTask = createAsyncThunk(
	'crm/createDealTask',
	async ({ dealPublicId, payload }: { dealPublicId: string; payload: DealTaskCreate }, { rejectWithValue }) => {
		try {
			return await crmService.createDealTask(dealPublicId, payload);
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to create task'));
		}
	}
);

export const updateDealTask = createAsyncThunk(
	'crm/updateDealTask',
	async ({ taskPublicId, payload }: { taskPublicId: string; payload: DealTaskUpdate }, { rejectWithValue }) => {
		try {
			return await crmService.updateDealTask(taskPublicId, payload);
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to update task'));
		}
	}
);

export const deleteDealTask = createAsyncThunk(
	'crm/deleteDealTask',
	async (taskPublicId: string, { rejectWithValue }) => {
		try {
			await crmService.deleteDealTask(taskPublicId);
			return taskPublicId;
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to delete task'));
		}
	}
);

export const fetchReminders = createAsyncThunk(
	'crm/fetchReminders',
	async ({ entityType, entityId }: { entityType: ReminderEntityType; entityId: number }, { rejectWithValue }) => {
		try {
			return await crmService.listReminders(entityType, entityId);
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to fetch reminders'));
		}
	}
);

export const createReminder = createAsyncThunk(
	'crm/createReminder',
	async (payload: ReminderCreate, { rejectWithValue }) => {
		try {
			return await crmService.createReminder(payload);
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to set reminder'));
		}
	}
);

export const updateReminder = createAsyncThunk(
	'crm/updateReminder',
	async ({ publicId, payload }: { publicId: string; payload: ReminderUpdate }, { rejectWithValue }) => {
		try {
			return await crmService.updateReminder(publicId, payload);
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to update reminder'));
		}
	}
);

export const cancelReminder = createAsyncThunk(
	'crm/cancelReminder',
	async (publicId: string, { rejectWithValue }) => {
		try {
			await crmService.cancelReminder(publicId);
			return publicId;
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to cancel reminder'));
		}
	}
);

export const fetchAllDealTasks = createAsyncThunk(
	'crm/fetchAllDealTasks',
	async (deals: Deal[], { rejectWithValue }) => {
		try {
			const tasksPromises = deals.map(async (deal) => {
				const tasks = await crmService.getDealTasks(deal.public_id);
				return tasks.map((t) => ({
					...t,
					deal_title: deal.title,
					deal_public_id: deal.public_id,
				}));
			});
			const results = await Promise.all(tasksPromises);
			return results.flat();
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to fetch all deal tasks'));
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
		clearLinkedRecords: (state) => {
			state.linkedContacts = [];
			state.linkedDeals = [];
		},
		clearReminders: (state) => {
			state.reminders = [];
		},
		clearImportResult: (state) => {
			state.importResult = null;
			state.importError = null;
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
			.addCase(createLead.fulfilled, (state, action: PayloadAction<LeadCreateResponse>) => {
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
			.addCase(bulkUpdateLeads.pending, (state) => {
				state.bulkUpdateLoading = true;
				state.bulkUpdateError = null;
			})
			.addCase(bulkUpdateLeads.fulfilled, (state, action: PayloadAction<Lead[]>) => {
				state.bulkUpdateLoading = false;
				for (const updated of action.payload) {
					const idx = state.leads.findIndex((l) => l.public_id === updated.public_id);
					if (idx !== -1) state.leads[idx] = updated;
				}
			})
			.addCase(bulkUpdateLeads.rejected, (state, action: PayloadAction<any>) => {
				state.bulkUpdateLoading = false;
				state.bulkUpdateError = action.payload;
			})
			.addCase(bulkDeleteLeads.pending, (state) => {
				state.bulkDeleteLoading = true;
				state.bulkDeleteError = null;
			})
			.addCase(bulkDeleteLeads.fulfilled, (state, action: PayloadAction<string[]>) => {
				state.bulkDeleteLoading = false;
				state.leads = state.leads.filter((l) => !action.payload.includes(l.public_id));
				state.leadsTotal = Math.max(0, state.leadsTotal - action.payload.length);
			})
			.addCase(bulkDeleteLeads.rejected, (state, action: PayloadAction<any>) => {
				state.bulkDeleteLoading = false;
				state.bulkDeleteError = action.payload;
			})
			.addCase(fetchLeadHistory.pending, (state) => {
				state.leadHistoryLoading = true;
				state.leadHistoryError = null;
			})
			.addCase(fetchLeadHistory.fulfilled, (state, action: PayloadAction<PaginatedResponse<LeadHistoryEntry>>) => {
				state.leadHistoryLoading = false;
				state.leadHistory = action.payload.items;
			})
			.addCase(fetchLeadHistory.rejected, (state, action: PayloadAction<any>) => {
				state.leadHistoryLoading = false;
				state.leadHistoryError = action.payload;
			})
			.addCase(anonymizeLead.pending, (state) => {
				state.anonymizeLoading = true;
				state.anonymizeError = null;
			})
			.addCase(anonymizeLead.fulfilled, (state, action: PayloadAction<Lead>) => {
				state.anonymizeLoading = false;
				const idx = state.leads.findIndex((l) => l.public_id === action.payload.public_id);
				if (idx !== -1) state.leads[idx] = action.payload;
			})
			.addCase(anonymizeLead.rejected, (state, action: PayloadAction<any>) => {
				state.anonymizeLoading = false;
				state.anonymizeError = action.payload;
			})
			.addCase(importLeadsCsv.pending, (state) => {
				state.importLoading = true;
				state.importError = null;
				state.importResult = null;
			})
			.addCase(importLeadsCsv.fulfilled, (state, action: PayloadAction<LeadImportResponse>) => {
				state.importLoading = false;
				state.importResult = action.payload;
			})
			.addCase(importLeadsCsv.rejected, (state, action: PayloadAction<any>) => {
				state.importLoading = false;
				state.importError = action.payload;
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
			.addCase(createPipeline.pending, (state) => {
				state.pipelineMutationLoading = true;
				state.pipelineMutationError = null;
			})
			.addCase(createPipeline.fulfilled, (state, action: PayloadAction<Pipeline>) => {
				state.pipelineMutationLoading = false;
				state.pipelines.push(action.payload);
			})
			.addCase(createPipeline.rejected, (state, action: PayloadAction<any>) => {
				state.pipelineMutationLoading = false;
				state.pipelineMutationError = action.payload;
			})
			.addCase(updatePipelineStages.pending, (state) => {
				state.pipelineMutationLoading = true;
				state.pipelineMutationError = null;
			})
			.addCase(updatePipelineStages.fulfilled, (state, action: PayloadAction<Pipeline>) => {
				state.pipelineMutationLoading = false;
				const idx = state.pipelines.findIndex((p) => p.id === action.payload.id);
				if (idx !== -1) state.pipelines[idx] = action.payload;
			})
			.addCase(updatePipelineStages.rejected, (state, action: PayloadAction<any>) => {
				state.pipelineMutationLoading = false;
				state.pipelineMutationError = action.payload;
			})
			.addCase(fetchDeals.pending, (state) => {
				state.dealsLoading = true;
				state.dealsError = null;
			})
			.addCase(fetchDeals.fulfilled, (state, action: PayloadAction<PaginatedResponse<Deal>>) => {
				state.dealsLoading = false;
				state.deals = action.payload.items;
			})
			.addCase(fetchDeals.rejected, (state, action: PayloadAction<any>) => {
				state.dealsLoading = false;
				state.dealsError = action.payload;
			})
			.addCase(createDeal.fulfilled, (state, action: PayloadAction<Deal>) => {
				state.deals.unshift(action.payload);
			})
			.addCase(updateDeal.fulfilled, (state, action: PayloadAction<Deal>) => {
				const idx = state.deals.findIndex((d) => d.public_id === action.payload.public_id);
				if (idx !== -1) state.deals[idx] = action.payload;
			})
			.addCase(deleteDeal.fulfilled, (state, action: PayloadAction<string>) => {
				state.deals = state.deals.filter((d) => d.public_id !== action.payload);
			})
			.addCase(fetchCompanies.pending, (state) => {
				state.companiesLoading = true;
				state.companiesError = null;
			})
			.addCase(fetchCompanies.fulfilled, (state, action: PayloadAction<PaginatedResponse<Company>>) => {
				state.companiesLoading = false;
				state.companies = action.payload.items;
				state.companiesTotal = action.payload.total;
				state.companiesPage = action.payload.page;
				state.companiesPageSize = action.payload.page_size;
			})
			.addCase(fetchCompanies.rejected, (state, action: PayloadAction<any>) => {
				state.companiesLoading = false;
				state.companiesError = action.payload;
			})
			.addCase(createCompany.fulfilled, (state, action: PayloadAction<Company>) => {
				state.companies.unshift(action.payload);
				state.companiesTotal += 1;
			})
			.addCase(updateCompany.fulfilled, (state, action: PayloadAction<Company>) => {
				const idx = state.companies.findIndex((c) => c.public_id === action.payload.public_id);
				if (idx !== -1) state.companies[idx] = action.payload;
			})
			.addCase(deleteCompany.fulfilled, (state, action: PayloadAction<string>) => {
				state.companies = state.companies.filter((c) => c.public_id !== action.payload);
				state.companiesTotal = Math.max(0, state.companiesTotal - 1);
			})
			.addCase(fetchCompanyStats.pending, (state) => {
				state.companyStatsLoading = true;
				state.companyStatsError = null;
			})
			.addCase(fetchCompanyStats.fulfilled, (state, action: PayloadAction<CRMCompanyStats>) => {
				state.companyStatsLoading = false;
				state.companyStats = action.payload;
			})
			.addCase(fetchCompanyStats.rejected, (state, action: PayloadAction<any>) => {
				state.companyStatsLoading = false;
				state.companyStatsError = action.payload;
			})
			.addCase(bulkUpdateCompanies.pending, (state) => {
				state.companiesBulkUpdateLoading = true;
				state.companiesBulkUpdateError = null;
			})
			.addCase(bulkUpdateCompanies.fulfilled, (state, action: PayloadAction<Company[]>) => {
				state.companiesBulkUpdateLoading = false;
				for (const updated of action.payload) {
					const idx = state.companies.findIndex((c) => c.public_id === updated.public_id);
					if (idx !== -1) state.companies[idx] = updated;
				}
			})
			.addCase(bulkUpdateCompanies.rejected, (state, action: PayloadAction<any>) => {
				state.companiesBulkUpdateLoading = false;
				state.companiesBulkUpdateError = action.payload;
			})
			.addCase(bulkDeleteCompanies.pending, (state) => {
				state.companiesBulkDeleteLoading = true;
				state.companiesBulkDeleteError = null;
			})
			.addCase(bulkDeleteCompanies.fulfilled, (state, action: PayloadAction<string[]>) => {
				state.companiesBulkDeleteLoading = false;
				const deleted = new Set(action.payload);
				state.companies = state.companies.filter((c) => !deleted.has(c.public_id));
				state.companiesTotal = Math.max(0, state.companiesTotal - deleted.size);
			})
			.addCase(bulkDeleteCompanies.rejected, (state, action: PayloadAction<any>) => {
				state.companiesBulkDeleteLoading = false;
				state.companiesBulkDeleteError = action.payload;
			})
			.addCase(fetchContacts.pending, (state) => {
				state.contactsLoading = true;
				state.contactsError = null;
			})
			.addCase(fetchContacts.fulfilled, (state, action: PayloadAction<PaginatedResponse<Contact>>) => {
				state.contactsLoading = false;
				state.contacts = action.payload.items;
				state.contactsTotal = action.payload.total;
				state.contactsPage = action.payload.page;
				state.contactsPageSize = action.payload.page_size;
			})
			.addCase(fetchContacts.rejected, (state, action: PayloadAction<any>) => {
				state.contactsLoading = false;
				state.contactsError = action.payload;
			})
			.addCase(createContact.fulfilled, (state, action: PayloadAction<Contact>) => {
				state.contacts.unshift(action.payload);
				state.contactsTotal += 1;
			})
			.addCase(updateContact.fulfilled, (state, action: PayloadAction<Contact>) => {
				const idx = state.contacts.findIndex((c) => c.public_id === action.payload.public_id);
				if (idx !== -1) state.contacts[idx] = action.payload;
			})
			.addCase(deleteContact.fulfilled, (state, action: PayloadAction<string>) => {
				state.contacts = state.contacts.filter((c) => c.public_id !== action.payload);
				state.contactsTotal = Math.max(0, state.contactsTotal - 1);
			})
			.addCase(fetchLinkedContacts.pending, (state) => {
				state.linkedContactsLoading = true;
			})
			.addCase(fetchLinkedContacts.fulfilled, (state, action: PayloadAction<Contact[]>) => {
				state.linkedContactsLoading = false;
				state.linkedContacts = action.payload;
			})
			.addCase(fetchLinkedContacts.rejected, (state) => {
				state.linkedContactsLoading = false;
			})
			.addCase(fetchLinkedDeals.pending, (state) => {
				state.linkedDealsLoading = true;
			})
			.addCase(fetchLinkedDeals.fulfilled, (state, action: PayloadAction<Deal[]>) => {
				state.linkedDealsLoading = false;
				state.linkedDeals = action.payload;
			})
			.addCase(fetchLinkedDeals.rejected, (state) => {
				state.linkedDealsLoading = false;
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
			.addCase(fetchEntityActivities.pending, (state) => {
				state.activitiesLoading = true;
				state.activitiesError = null;
			})
			.addCase(fetchEntityActivities.fulfilled, (state, action: PayloadAction<PaginatedResponse<CRMActivity>>) => {
				state.activitiesLoading = false;
				state.activities = action.payload.items;
			})
			.addCase(fetchEntityActivities.rejected, (state, action: PayloadAction<any>) => {
				state.activitiesLoading = false;
				state.activitiesError = action.payload;
			})
			.addCase(createActivity.fulfilled, (state, action: PayloadAction<CRMActivity>) => {
				state.activities.unshift(action.payload);
			})
			.addCase(updateActivity.fulfilled, (state, action: PayloadAction<CRMActivity>) => {
				const idx = state.activities.findIndex((a) => a.public_id === action.payload.public_id);
				if (idx !== -1) state.activities[idx] = action.payload;
				const feedIdx = state.feedActivities.findIndex((a) => a.public_id === action.payload.public_id);
				if (feedIdx !== -1) state.feedActivities[feedIdx] = action.payload;
			})
			.addCase(deleteActivity.fulfilled, (state, action: PayloadAction<string>) => {
				state.activities = state.activities.filter((a) => a.public_id !== action.payload);
				state.feedActivities = state.feedActivities.filter((a) => a.public_id !== action.payload);
			})
			.addCase(fetchActivityFeed.pending, (state) => {
				state.feedActivitiesLoading = true;
				state.feedActivitiesError = null;
			})
			.addCase(fetchActivityFeed.fulfilled, (state, action: PayloadAction<PaginatedResponse<CRMActivity>>) => {
				state.feedActivitiesLoading = false;
				state.feedActivities = action.payload.items;
				state.feedActivitiesTotal = action.payload.total;
				state.feedActivitiesPage = action.payload.page;
				state.feedActivitiesPageSize = action.payload.page_size;
			})
			.addCase(fetchActivityFeed.rejected, (state, action: PayloadAction<any>) => {
				state.feedActivitiesLoading = false;
				state.feedActivitiesError = action.payload;
			})
			.addCase(fetchStats.pending, (state) => {
				state.statsLoading = true;
				state.statsError = null;
			})
			.addCase(fetchStats.fulfilled, (state, action: PayloadAction<CRMStats>) => {
				state.statsLoading = false;
				state.stats = action.payload;
			})
			.addCase(fetchStats.rejected, (state, action: PayloadAction<any>) => {
				state.statsLoading = false;
				state.statsError = action.payload;
			})
			.addCase(fetchLeadStats.pending, (state) => {
				state.leadStatsLoading = true;
				state.leadStatsError = null;
			})
			.addCase(fetchLeadStats.fulfilled, (state, action: PayloadAction<CRMLeadStats>) => {
				state.leadStatsLoading = false;
				state.leadStats = action.payload;
			})
			.addCase(fetchLeadStats.rejected, (state, action: PayloadAction<any>) => {
				state.leadStatsLoading = false;
				state.leadStatsError = action.payload;
			})
			.addCase(fetchOwners.pending, (state) => {
				state.ownersLoading = true;
			})
			.addCase(fetchOwners.fulfilled, (state, action: PayloadAction<CRMOwnerOption[]>) => {
				state.ownersLoading = false;
				state.owners = action.payload;
			})
			.addCase(fetchOwners.rejected, (state) => {
				state.ownersLoading = false;
			})
			.addCase(fetchDealTasks.pending, (state) => {
				state.dealTasksLoading = true;
			})
			.addCase(fetchDealTasks.fulfilled, (state, action: PayloadAction<DealTask[]>) => {
				state.dealTasksLoading = false;
				state.dealTasks = action.payload;
			})
			.addCase(fetchDealTasks.rejected, (state) => {
				state.dealTasksLoading = false;
			})
			.addCase(createDealTask.pending, (state) => { state.dealTaskMutating = true; })
			.addCase(createDealTask.fulfilled, (state, action: PayloadAction<DealTask>) => {
				state.dealTaskMutating = false;
				state.dealTasks = [...state.dealTasks, action.payload];
			})
			.addCase(createDealTask.rejected, (state) => { state.dealTaskMutating = false; })
			.addCase(updateDealTask.pending, (state) => { state.dealTaskMutating = true; })
			.addCase(updateDealTask.fulfilled, (state, action: PayloadAction<DealTask>) => {
				state.dealTaskMutating = false;
				state.dealTasks = state.dealTasks.map((t) =>
					t.public_id === action.payload.public_id ? action.payload : t
				);
				state.allDealTasks = state.allDealTasks.map((t) =>
					t.public_id === action.payload.public_id ? { ...t, ...action.payload } : t
				);
			})
			.addCase(updateDealTask.rejected, (state) => { state.dealTaskMutating = false; })
			.addCase(deleteDealTask.fulfilled, (state, action: PayloadAction<string>) => {
				state.dealTasks = state.dealTasks.filter((t) => t.public_id !== action.payload);
				state.allDealTasks = state.allDealTasks.filter((t) => t.public_id !== action.payload);
			})
			.addCase(fetchReminders.pending, (state) => {
				state.remindersLoading = true;
			})
			.addCase(fetchReminders.fulfilled, (state, action: PayloadAction<Reminder[]>) => {
				state.remindersLoading = false;
				state.reminders = action.payload;
			})
			.addCase(fetchReminders.rejected, (state) => {
				state.remindersLoading = false;
			})
			.addCase(createReminder.pending, (state) => { state.reminderMutating = true; })
			.addCase(createReminder.fulfilled, (state, action: PayloadAction<Reminder>) => {
				state.reminderMutating = false;
				state.reminders = [...state.reminders, action.payload];
			})
			.addCase(createReminder.rejected, (state) => { state.reminderMutating = false; })
			.addCase(updateReminder.pending, (state) => { state.reminderMutating = true; })
			.addCase(updateReminder.fulfilled, (state, action: PayloadAction<Reminder>) => {
				state.reminderMutating = false;
				state.reminders = state.reminders.map((r) =>
					r.public_id === action.payload.public_id ? action.payload : r
				);
			})
			.addCase(updateReminder.rejected, (state) => { state.reminderMutating = false; })
			.addCase(cancelReminder.fulfilled, (state, action: PayloadAction<string>) => {
				state.reminders = state.reminders.filter((r) => r.public_id !== action.payload);
			})
			.addCase(fetchAllDealTasks.pending, (state) => {
				state.allDealTasksLoading = true;
				state.allDealTasksError = null;
			})
			.addCase(fetchAllDealTasks.fulfilled, (state, action: PayloadAction<(DealTask & { deal_title?: string; deal_public_id?: string })[]>) => {
				state.allDealTasksLoading = false;
				state.allDealTasks = action.payload;
			})
			.addCase(fetchAllDealTasks.rejected, (state, action: PayloadAction<any>) => {
				state.allDealTasksLoading = false;
				state.allDealTasksError = action.payload;
			});
	},
});

export const { clearLeadsError, clearConvertError, clearActivities, clearLinkedRecords, clearReminders, clearImportResult } = crmSlice.actions;
export default crmSlice.reducer;
