export type LeadSource = 'website' | 'referral' | 'cold_call' | 'linkedin' | 'ad' | 'event' | 'other';
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'unqualified' | 'converted';
export type LeadPriority = 'low' | 'medium' | 'high' | 'urgent';

/** Matches backend's CRMLeadResponse exactly. */
export interface Lead {
	id: number;
	public_id: string;
	title: string;
	contact_id?: number;
	company_id?: number;
	source?: LeadSource;
	status: LeadStatus;
	priority: LeadPriority;
	owner_id?: number;
	estimated_value?: number;
	currency: string;
	description?: string;
	converted_at?: string;
	deal_id?: number;
	custom_fields?: Record<string, any>;
	created_at: string;
	updated_at: string;
}

/** Matches backend's CRMLeadCreate. */
export interface LeadCreate {
	title: string;
	contact_id?: number;
	company_id?: number;
	source?: LeadSource;
	status?: LeadStatus;
	priority?: LeadPriority;
	owner_id?: number;
	estimated_value?: number;
	currency?: string;
	description?: string;
	custom_fields?: Record<string, any>;
}

export interface LeadUpdate extends Partial<LeadCreate> { }

/** Matches backend's CRMLeadConvertRequest. */
export interface LeadConvertRequest {
	pipeline_id: number;
	stage_id: number;
	deal_title?: string;
	value?: number;
	close_date?: string;
}
