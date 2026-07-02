import api from './api';
import type { PaginatedResponse } from '../models/common';
import type { Company, CompanyCreate, CompanyUpdate, CompanyStatus, CompanySize } from '../models/crm/company';
import type { Contact, ContactCreate, ContactUpdate } from '../models/crm/contact';
import type {
	Lead,
	LeadCreate,
	LeadCreateResponse,
	LeadUpdate,
	LeadConvertRequest,
	LeadHistoryEntry,
	LeadImportResponse,
} from '../models/crm/lead';
import type { Deal, DealCreate, DealUpdate } from '../models/crm/deal';
import type { DealTask, DealTaskCreate, DealTaskUpdate } from '../models/crm/dealTask';
import type { Reminder, ReminderCreate, ReminderUpdate, ReminderEntityType } from '../models/crm/reminder';
import type { Pipeline, PipelineCreate, PipelineStageUpsert } from '../models/crm/pipeline';
import type { CRMActivity, CRMActivityCreate, CRMActivityUpdate } from '../models/crm/crmActivity';
import type { CRMStats, CRMLeadStats, CRMCompanyStats } from '../models/crm/crmStats';
import type { CRMOwnerOption } from '../models/crm/owner';
import type { CRMFile } from '../models/crm/crmFile';

const crmService = {
	// --- Companies ---
	listCompanies: async (params: {
		page?: number;
		pageSize?: number;
		search?: string;
		status?: CompanyStatus | string;
		industry?: string;
		size?: CompanySize | string;
		ownerId?: number;
	} = {}): Promise<PaginatedResponse<Company>> => {
		const { page = 1, pageSize = 20, search, status, industry, size, ownerId } = params;
		const response = await api.get<PaginatedResponse<Company>>('/crm/companies', {
			params: { page, page_size: pageSize, search, status, industry, size, owner_id: ownerId },
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
	getCompanyStats: async (): Promise<CRMCompanyStats> => {
		const response = await api.get<CRMCompanyStats>('/crm/companies/stats');
		return response.data;
	},
	bulkUpdateCompanies: async (publicIds: string[], updates: { ownerId?: number; status?: string }): Promise<Company[]> => {
		const response = await api.patch<Company[]>('/crm/companies/bulk', {
			public_ids: publicIds,
			owner_id: updates.ownerId,
			status: updates.status,
		});
		return response.data;
	},
	bulkDeleteCompanies: async (publicIds: string[]): Promise<number> => {
		const response = await api.post<{ deleted_count: number }>('/crm/companies/bulk-delete', {
			public_ids: publicIds,
		});
		return response.data.deleted_count;
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
		priority?: string;
		source?: string;
		ownerId?: number;
		stale?: boolean;
		page?: number;
		pageSize?: number;
		search?: string;
	} = {}): Promise<PaginatedResponse<Lead>> => {
		const { status, priority, source, ownerId, stale, page = 1, pageSize = 20, search } = params;
		const response = await api.get<PaginatedResponse<Lead>>('/crm/leads', {
			params: { status, priority, source, owner_id: ownerId, stale, page, page_size: pageSize, search },
		});
		return response.data;
	},
	getLead: async (publicId: string): Promise<Lead> => {
		const response = await api.get<Lead>(`/crm/leads/${publicId}`);
		return response.data;
	},
	createLead: async (payload: LeadCreate): Promise<LeadCreateResponse> => {
		const response = await api.post<LeadCreateResponse>('/crm/leads', payload);
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
	bulkUpdateLeads: async (publicIds: string[], updates: { ownerId?: number; status?: string }): Promise<Lead[]> => {
		const response = await api.patch<Lead[]>('/crm/leads/bulk', {
			public_ids: publicIds,
			owner_id: updates.ownerId,
			status: updates.status,
		});
		return response.data;
	},
	bulkDeleteLeads: async (publicIds: string[]): Promise<number> => {
		const response = await api.post<{ deleted_count: number }>('/crm/leads/bulk-delete', {
			public_ids: publicIds,
		});
		return response.data.deleted_count;
	},
	getLeadStats: async (): Promise<CRMLeadStats> => {
		const response = await api.get<CRMLeadStats>('/crm/leads/stats');
		return response.data;
	},
	getLeadHistory: async (publicId: string, page = 1, pageSize = 50): Promise<PaginatedResponse<LeadHistoryEntry>> => {
		const response = await api.get<PaginatedResponse<LeadHistoryEntry>>(`/crm/leads/${publicId}/history`, {
			params: { page, page_size: pageSize },
		});
		return response.data;
	},
	anonymizeLead: async (publicId: string): Promise<Lead> => {
		const response = await api.post<Lead>(`/crm/leads/${publicId}/anonymize`);
		return response.data;
	},
	exportLeadsCsv: async (params: {
		status?: string; priority?: string; source?: string; ownerId?: number; search?: string;
	} = {}): Promise<void> => {
		const { status, priority, source, ownerId, search } = params;
		const response = await api.get('/crm/leads/export', {
			params: { status, priority, source, owner_id: ownerId, search },
			responseType: 'blob',
		});
		const blob = new Blob([response.data], { type: 'text/csv' });
		const downloadUrl = window.URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = downloadUrl;
		link.download = 'leads_export.csv';
		document.body.appendChild(link);
		link.click();
		link.remove();
		window.URL.revokeObjectURL(downloadUrl);
	},
	importLeadsCsv: async (file: File): Promise<LeadImportResponse> => {
		const formData = new FormData();
		formData.append('file', file);
		const response = await api.post<LeadImportResponse>('/crm/leads/import', formData, {
			headers: { 'Content-Type': 'multipart/form-data' },
		});
		return response.data;
	},

	// --- Deals ---
	listDeals: async (params: {
		pipelineId?: number;
		stageId?: number;
		status?: string;
		ownerId?: number;
		companyId?: number;
		contactId?: number;
		page?: number;
		pageSize?: number;
		search?: string;
	} = {}): Promise<PaginatedResponse<Deal>> => {
		const { pipelineId, stageId, status, ownerId, companyId, contactId, page = 1, pageSize = 20, search } = params;
		const response = await api.get<PaginatedResponse<Deal>>('/crm/deals', {
			params: {
				pipeline_id: pipelineId,
				stage_id: stageId,
				status,
				owner_id: ownerId,
				company_id: companyId,
				contact_id: contactId,
				page,
				page_size: pageSize,
				search,
			},
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
	createPipeline: async (payload: PipelineCreate): Promise<Pipeline> => {
		const response = await api.post<Pipeline>('/crm/pipelines', payload);
		return response.data;
	},
	updatePipelineStages: async (pipelineId: number, stages: PipelineStageUpsert[]): Promise<Pipeline> => {
		const response = await api.patch<Pipeline>(`/crm/pipelines/${pipelineId}/stages`, { stages });
		return response.data;
	},

	// --- Activities ---
	listActivities: async (params: {
		entityType?: string;
		entityId?: number;
		ownerId?: number;
		isCompleted?: boolean;
		type?: string;
		dateFrom?: string;
		dateTo?: string;
		page?: number;
		pageSize?: number;
	} = {}): Promise<PaginatedResponse<CRMActivity>> => {
		const { entityType, entityId, ownerId, isCompleted, type, dateFrom, dateTo, page = 1, pageSize = 20 } = params;
		const response = await api.get<PaginatedResponse<CRMActivity>>('/crm/activities', {
			params: {
				entity_type: entityType,
				entity_id: entityId,
				owner_id: ownerId,
				is_completed: isCompleted,
				type,
				date_from: dateFrom,
				date_to: dateTo,
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

	// --- Owners ---
	listOwners: async (): Promise<CRMOwnerOption[]> => {
		const response = await api.get<CRMOwnerOption[]>('/crm/owners');
		return response.data;
	},

	// --- Files / Attachments ---
	listFiles: async (entityType: string, entityId: number, page = 1, pageSize = 50): Promise<PaginatedResponse<CRMFile>> => {
		const response = await api.get<PaginatedResponse<CRMFile>>('/crm/files', {
			params: { entity_type: entityType, entity_id: entityId, page, page_size: pageSize },
		});
		return response.data;
	},
	uploadFile: async (entityType: string, entityId: number, file: File): Promise<CRMFile> => {
		const formData = new FormData();
		formData.append('entity_type', entityType);
		formData.append('entity_id', String(entityId));
		formData.append('file', file);
		const response = await api.post<CRMFile>('/crm/files/upload', formData, {
			headers: { 'Content-Type': 'multipart/form-data' },
		});
		return response.data;
	},
	deleteFile: async (publicId: string): Promise<void> => {
		await api.delete(`/crm/files/${publicId}`);
	},
	downloadFile: async (publicId: string, fileName: string): Promise<void> => {
		const response = await api.get(`/crm/files/${publicId}/download`, {
			responseType: 'blob',
		});
		const blob = new Blob([response.data], { type: response.headers['content-type'] });
		const downloadUrl = window.URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = downloadUrl;
		link.download = fileName;
		document.body.appendChild(link);
		link.click();
		link.remove();
		window.URL.revokeObjectURL(downloadUrl);
	},

	// --- Deal Tasks ---
	getDealTasks: async (dealPublicId: string): Promise<DealTask[]> => {
		const response = await api.get<DealTask[]>(`/crm/deals/${dealPublicId}/tasks`);
		return response.data;
	},
	createDealTask: async (dealPublicId: string, payload: DealTaskCreate): Promise<DealTask> => {
		const response = await api.post<DealTask>(`/crm/deals/${dealPublicId}/tasks`, payload);
		return response.data;
	},
	updateDealTask: async (taskPublicId: string, payload: DealTaskUpdate): Promise<DealTask> => {
		const response = await api.patch<DealTask>(`/crm/deal-tasks/${taskPublicId}`, payload);
		return response.data;
	},
	deleteDealTask: async (taskPublicId: string): Promise<void> => {
		await api.delete(`/crm/deal-tasks/${taskPublicId}`);
	},

	// --- Reminders ---
	listReminders: async (entityType: ReminderEntityType, entityId: number): Promise<Reminder[]> => {
		const response = await api.get<Reminder[]>('/crm/reminders', {
			params: { entity_type: entityType, entity_id: entityId },
		});
		return response.data;
	},
	listMyReminders: async (): Promise<Reminder[]> => {
		const response = await api.get<Reminder[]>('/crm/reminders/mine');
		return response.data;
	},
	listRemindersForEntities: async (entityType: ReminderEntityType, entityIds: number[]): Promise<Reminder[]> => {
		if (entityIds.length === 0) return [];
		const response = await api.get<Reminder[]>('/crm/reminders/for-entities', {
			params: { entity_type: entityType, entity_ids: entityIds.join(',') },
		});
		return response.data;
	},
	createReminder: async (payload: ReminderCreate): Promise<Reminder> => {
		const response = await api.post<Reminder>('/crm/reminders', payload);
		return response.data;
	},
	updateReminder: async (publicId: string, payload: ReminderUpdate): Promise<Reminder> => {
		const response = await api.patch<Reminder>(`/crm/reminders/${publicId}`, payload);
		return response.data;
	},
	cancelReminder: async (publicId: string): Promise<void> => {
		await api.delete(`/crm/reminders/${publicId}`);
	},
};

export default crmService;
