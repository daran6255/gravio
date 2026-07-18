export interface OrganizationPlan {
	tier: 'free' | 'basic' | 'pro' | 'enterprise';
	name: string;
	enabled_modules: string[];
	ai_monthly_limit: number;
	user_limit?: number | null;
}

export interface Organization {
	public_id: string;
	name: string;
	location?: string;
	is_active?: boolean;
	subscription_status: string;
	trial_started_at?: string;
	trial_expires_at?: string;
	plan_id?: number | null;
	plan?: OrganizationPlan | null;
	user_count?: number;
	user_limit?: number | null;
	plan_name?: string;
	others?: Record<string, any> | null;
	account_type?: 'organization' | 'individual';
}

export interface BillingAddress {
	line1?: string | null;
	line2?: string | null;
	city?: string | null;
	state?: string | null;
	postal_code?: string | null;
	country?: string | null;
}

export interface User {
	id: number;
	public_id: string;
	email: string;
	username: string;
	full_name?: string;
	is_active: boolean;
	is_verified: boolean;
	is_superuser?: boolean;
	role: string;
	created_at: string;
	updated_at: string;
	organization_id?: number | null;
	organization?: Organization | null;
	timezone?: string | null;
	currency?: string | null;
	dob?: string | null;
	phone?: string | null;
	avatar?: string | null;
	job_title?: string | null;
	billing_address?: BillingAddress | null;
	billing_reminder?: boolean;
	reporting_manager_id?: number | null;
}

export interface Token {
	access_token: string;
	refresh_token: string;
	token_type: string;
}

export interface LoginResponse extends Token { }

export interface RegisterResponse extends User { }
