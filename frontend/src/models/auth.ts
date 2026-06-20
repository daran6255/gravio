export interface Organization {
	public_id: string;
	name: string;
	location?: string;
	subscription_status: string;
	trial_started_at?: string;
	trial_expires_at?: string;
	plan_id?: number | null;
	plan?: any;
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
}

export interface Token {
	access_token: string;
	refresh_token: string;
	token_type: string;
}

export interface LoginResponse extends Token { }

export interface RegisterResponse extends User { }
