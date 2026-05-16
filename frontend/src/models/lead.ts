import type { Company } from './company';
import type { Contact } from './contact';

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'unqualified' | 'lost';
export type LeadSource = 'website' | 'referral' | 'campaign' | 'event' | 'cold_call' | 'social_media' | 'partner' | 'whatsapp';

export interface Lead {
	id: number;
	public_id: string;
	company_id?: number;
	contact_id?: number;
	assigned_to: number;
	title: string;
	description?: string;
	lead_source: LeadSource;
	lead_status: LeadStatus;
	lead_score: number;
	estimated_value?: number;
	currency: string;
	expected_close_date?: string;
	tags?: string[];
	qualification_notes?: Record<string, any>;
	utm_data?: Record<string, any>;
	custom_fields?: Record<string, any>;
	converted_to_deal_id?: number;
	conversion_date?: string;
	created_at: string;
	updated_at: string;
	company?: Company;
	contact?: Contact;
	assigned_user?: any;
}

export interface LeadCreate extends Omit<Lead, 'public_id' | 'created_at' | 'updated_at' | 'company' | 'contact' | 'assigned_user' | 'converted_to_deal_id' | 'conversion_date'> { }
export interface LeadUpdate extends Partial<LeadCreate> { }

export interface LeadPaginatedResponse {
	items: Lead[];
	total: number;
}

export interface LeadStats {
	total: number;
	by_status: Record<string, number>;
	by_source: Record<string, number>;
	average_score: number;
	conversion_rate: number;
	this_week: number;
}
