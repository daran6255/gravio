export type ContactSocialLinks = {
	linkedin?: string;
	twitter?: string;
};

/** Matches backend's CRMContactResponse exactly. */
export interface Contact {
	id: number;
	public_id: string;
	first_name: string;
	last_name?: string;
	email?: string;
	phone?: string;
	mobile?: string;
	job_title?: string;
	department?: string;
	company_id?: number;
	owner_id?: number;
	is_primary: boolean;
	tags?: string[];
	social_links?: ContactSocialLinks;
	custom_fields?: Record<string, any>;
	created_at: string;
	updated_at: string;
}

/** Matches backend's CRMContactCreate. */
export interface ContactCreate {
	first_name: string;
	last_name?: string;
	email?: string;
	phone?: string;
	mobile?: string;
	job_title?: string;
	department?: string;
	company_id?: number;
	owner_id?: number;
	is_primary?: boolean;
	tags?: string[];
	social_links?: ContactSocialLinks;
	custom_fields?: Record<string, any>;
}

export interface ContactUpdate extends Partial<ContactCreate> { }
