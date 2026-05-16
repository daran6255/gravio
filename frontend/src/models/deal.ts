import type { Company } from './company';
import type { Contact } from './contact';

export type DealStage = 'discovery' | 'qualification' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
export type DealType = 'new_business' | 'upsell' | 'renewal' | 'cross_sell';

export interface Deal {
	id: number;
	public_id: string;
	company_id?: number;
	contact_id?: number;
	original_lead_id?: number;
	assigned_to: number;
	title: string;
	description?: string;
	deal_stage: DealStage;
	deal_type: DealType;
	deal_value: number;
	currency: string;
	win_probability: number;
	expected_close_date?: string;
	actual_close_date?: string;
	loss_reason?: string;
	tags?: string[];
	custom_fields?: Record<string, any>;
	created_at: string;
	updated_at: string;
	company?: Company;
	contact?: Contact;
	assigned_user?: any;
}

export interface DealCreate extends Omit<Deal, 'public_id' | 'created_at' | 'updated_at' | 'company' | 'contact' | 'assigned_user' | 'actual_close_date'> { }
export interface DealUpdate extends Partial<DealCreate> { }

export interface DealPaginatedResponse {
	items: Deal[];
	total: number;
}

export interface DealPipelineSummary {
	stages: Record<string, { count: number; total_value: number }>;
	total_value: number;
	total_count: number;
}
