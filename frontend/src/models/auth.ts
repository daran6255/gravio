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
}

export interface Token {
	access_token: string;
	refresh_token: string;
	token_type: string;
}

export interface LoginResponse extends Token { }

export interface RegisterResponse extends User { }
