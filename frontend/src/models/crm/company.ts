export type CompanySize = 'startup' | 'small' | 'medium' | 'enterprise';
export type CompanyStatus = 'prospect' | 'customer' | 'churned' | 'partner';

export interface CompanyAddress {
	location?: string;
	street?: string;
	city?: string;
	state?: string;
	country?: string;
	zip?: string;
}

/** Matches backend's CRMCompanyResponse exactly. */
export interface Company {
	id: number;
	public_id: string;
	name: string;
	industry?: string;
	website?: string;
	phone?: string;
	email?: string;
	address?: CompanyAddress;
	size?: CompanySize;
	status: CompanyStatus;
	owner_id?: number;
	tags?: string[];
	custom_fields?: Record<string, any>;
	created_at: string;
	updated_at: string;
}

/** Matches backend's CRMCompanyCreate. */
export interface CompanyCreate {
	name: string;
	industry?: string;
	website?: string;
	phone?: string;
	email?: string;
	address?: CompanyAddress;
	size?: CompanySize;
	status?: CompanyStatus;
	owner_id?: number;
	tags?: string[];
	custom_fields?: Record<string, any>;
}

export interface CompanyUpdate extends Partial<CompanyCreate> { }
