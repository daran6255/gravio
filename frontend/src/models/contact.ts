import type { Company } from './company';

export type ContactSource = 'linkedin' | 'website' | 'referral' | 'cold_call' | 'event' | 'other' | 'whatsapp';

export interface Contact {
	id: number;
	public_id: string;
	company_id?: number;
	first_name: string;
	last_name: string;
	email?: string;
	phone?: string;
	mobile?: string;
	designation?: string;
	department?: string;
	is_primary: boolean;
	is_decision_maker: boolean;
	linkedin_url?: string;
	contact_source?: ContactSource;
	contact_preferences?: Record<string, any>;
	address?: Record<string, any>;
	custom_fields?: Record<string, any>;
	created_at: string;
	updated_at: string;
	company?: Company;
	full_name?: string;
}

export interface ContactCreate extends Omit<Contact, 'id' | 'public_id' | 'created_at' | 'updated_at' | 'company'> { }
export interface ContactUpdate extends Partial<ContactCreate> { }

export interface ContactPaginatedResponse {
	items: Contact[];
	total: number;
}
