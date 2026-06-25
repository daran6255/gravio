import api from './api';
import type { PaginatedResponse } from '../models/common';
import type { Company, CompanyCreate, CompanyUpdate } from '../models/crm/company';
import type { Contact, ContactCreate, ContactUpdate } from '../models/crm/contact';
import type { Lead, LeadCreate, LeadUpdate, LeadConvertRequest } from '../models/crm/lead';
import type { Deal, DealCreate, DealUpdate } from '../models/crm/deal';
import type { Pipeline } from '../models/crm/pipeline';
import type { CRMActivity, CRMActivityCreate, CRMActivityUpdate } from '../models/crm/crmActivity';
import type { CRMStats } from '../models/crm/crmStats';

const crmService = {
	// --- Companies ---
	listCompanies: async (page = 1, pageSize = 20, search?: string): Promise<PaginatedResponse<Company>> => {
		const response = await api.get<PaginatedResponse<Company>>('/crm/companies', {
			params: { page, page_size: pageSize, search },
		});
		return response.data;
	},
	getCompany: async (publicId: string): Promise<Company> => {
		const response = await api.get<Company>(`/crm/companies/${publicId}`);
		return response.data;
	},
	createCompany: async (payload: CompanyCreate): Promise<Company> => {
		const response = await api.post<Company>('/crm/companies', payload);
		return response.data;
	},
	updateCompany: async (publicId: string, payload: CompanyUpdate): Promise<Company> => {
		const response = await api.patch<Company>(`/crm/companies/${publicId}`, payload);
		return response.data;
	},
	deleteCompany: async (publicId: string): Promise<void> => {
		await api.delete(`/crm/companies/${publicId}`);
	},

	// --- Contacts ---
	listContacts: async (
		companyId?: number,
		page = 1,
		pageSize = 20,
		search?: string
	): Promise<PaginatedResponse<Contact>> => {
		const response = await api.get<PaginatedResponse<Contact>>('/crm/contacts', {
			params: { company_id: companyId, page, page_size: pageSize, search },
		});
		return response.data;
	},
	getContact: async (publicId: string): Promise<Contact> => {
		const response = await api.get<Contact>(`/crm/contacts/${publicId}`);
		return response.data;
	},
	createContact: async (payload: ContactCreate): Promise<Contact> => {
		const response = await api.post<Contact>('/crm/contacts', payload);
		return response.data;
	},
	updateContact: async (publicId: string, payload: ContactUpdate): Promise<Contact> => {
		const response = await api.patch<Contact>(`/crm/contacts/${publicId}`, payload);
		return response.data;
	},
	deleteContact: async (publicId: string): Promise<void> => {
		await api.delete(`/crm/contacts/${publicId}`);
	},

	// --- Leads ---
	listLeads: async (params: {
		status?: string;
		ownerId?: number;
		page?: number;
		pageSize?: number;
		search?: string;
	} = {}): Promise<PaginatedResponse<Lead>> => {
		const { status, ownerId, page = 1, pageSize = 20, search } = params;
		const response = await api.get<PaginatedResponse<Lead>>('/crm/leads', {
			params: { status, owner_id: ownerId, page, page_size: pageSize, search },
		});
		return response.data;
	},
	getLead: async (publicId: string): Promise<Lead> => {
		const response = await api.get<Lead>(`/crm/leads/${publicId}`);
		return response.data;
	},
	createLead: async (payload: LeadCreate): Promise<Lead> => {
		const response = await api.post<Lead>('/crm/leads', payload);
		return response.data;
	},
	updateLead: async (publicId: string, payload: LeadUpdate): Promise<Lead> => {
		const response = await api.patch<Lead>(`/crm/leads/${publicId}`, payload);
		return response.data;
	},
	deleteLead: async (publicId: string): Promise<void> => {
		await api.delete(`/crm/leads/${publicId}`);
	},
	convertLead: async (publicId: string, payload: LeadConvertRequest): Promise<Deal> => {
		const response = await api.post<Deal>(`/crm/leads/${publicId}/convert`, payload);
		return response.data;
	},

	// --- Deals ---
	listDeals: async (params: {
		pipelineId?: number;
		stageId?: number;
		status?: string;
		ownerId?: number;
		page?: number;
		pageSize?: number;
		search?: string;
	} = {}): Promise<PaginatedResponse<Deal>> => {
		const { pipelineId, stageId, status, ownerId, page = 1, pageSize = 20, search } = params;
		const response = await api.get<PaginatedResponse<Deal>>('/crm/deals', {
			params: { pipeline_id: pipelineId, stage_id: stageId, status, owner_id: ownerId, page, page_size: pageSize, search },
		});
		return response.data;
	},
	getDeal: async (publicId: string): Promise<Deal> => {
		const response = await api.get<Deal>(`/crm/deals/${publicId}`);
		return response.data;
	},
	createDeal: async (payload: DealCreate): Promise<Deal> => {
		const response = await api.post<Deal>('/crm/deals', payload);
		return response.data;
	},
	updateDeal: async (publicId: string, payload: DealUpdate): Promise<Deal> => {
		const response = await api.patch<Deal>(`/crm/deals/${publicId}`, payload);
		return response.data;
	},
	deleteDeal: async (publicId: string): Promise<void> => {
		await api.delete(`/crm/deals/${publicId}`);
	},

	// --- Pipelines ---
	listPipelines: async (): Promise<Pipeline[]> => {
		const response = await api.get<Pipeline[]>('/crm/pipelines');
		return response.data;
	},

	// --- Activities ---
	listActivities: async (params: {
		entityType?: string;
		entityId?: number;
		ownerId?: number;
		isCompleted?: boolean;
		page?: number;
		pageSize?: number;
	} = {}): Promise<PaginatedResponse<CRMActivity>> => {
		const { entityType, entityId, ownerId, isCompleted, page = 1, pageSize = 20 } = params;
		const response = await api.get<PaginatedResponse<CRMActivity>>('/crm/activities', {
			params: {
				entity_type: entityType,
				entity_id: entityId,
				owner_id: ownerId,
				is_completed: isCompleted,
				page,
				page_size: pageSize,
			},
		});
		return response.data;
	},
	createActivity: async (payload: CRMActivityCreate): Promise<CRMActivity> => {
		const response = await api.post<CRMActivity>('/crm/activities', payload);
		return response.data;
	},
	updateActivity: async (publicId: string, payload: CRMActivityUpdate): Promise<CRMActivity> => {
		const response = await api.patch<CRMActivity>(`/crm/activities/${publicId}`, payload);
		return response.data;
	},
	deleteActivity: async (publicId: string): Promise<void> => {
		await api.delete(`/crm/activities/${publicId}`);
	},

	// --- Dashboard ---
	getStats: async (): Promise<CRMStats> => {
		const response = await api.get<CRMStats>('/crm/dashboard/stats');
		return response.data;
	},
};

export default crmService;
