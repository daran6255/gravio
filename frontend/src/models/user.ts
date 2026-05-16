// frontend\src\models\user.ts
export interface User {
	id: number;
	public_id: string; // Added for DSR and other modules
	username: string;
	email: string;
	full_name: string;
	is_active: boolean;
	is_verified: boolean;
	is_superuser?: boolean;
	role: 'admin' | 'manager' | 'sourcing' | 'placement' | 'trainer' | 'counselor' | 'project_coordinator' | 'developer' | 'marketing';
	mobile?: string;
	created_at?: string;
	updated_at?: string;
}

export interface UserCreate {
	email: string;
	username: string;
	full_name: string;
	password: string;
	is_active: boolean;
	is_verified: boolean;
	role: string;
	mobile?: string;
}

export interface UserUpdate {
	email?: string;
	username?: string;
	full_name?: string;
	password?: string;
	is_active?: boolean;
	is_verified?: boolean;
	role?: string;
	mobile?: string;
}