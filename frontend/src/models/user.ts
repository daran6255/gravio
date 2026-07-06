export type UserRole =
	| 'admin'
	| 'manager'
	| 'sourcing'
	| 'placement'
	| 'trainer'
	| 'counselor'
	| 'project_coordinator'
	| 'developer'
	| 'marketing';

export const USER_ROLES: UserRole[] = [
	'admin',
	'manager',
	'sourcing',
	'placement',
	'trainer',
	'counselor',
	'project_coordinator',
	'developer',
	'marketing',
];

/** A row in the Org Admin's Team list — matches backend's UserListItem exactly. */
export interface TeamMember {
	public_id: string;
	username: string;
	email: string;
	full_name?: string;
	role: UserRole;
	is_active: boolean;
	is_verified: boolean;
	reporting_manager_id?: number | null;
	created_at: string;
}

/** Invite a teammate — matches backend's InviteUserRequest exactly. No password is ever collected. */
export interface InviteUserRequest {
	username: string;
	email: string;
	full_name: string;
	role: UserRole;
}

export interface UpdateUserRequest {
	username?: string;
	email?: string;
	full_name?: string;
	role?: UserRole;
	reporting_manager_id?: number | null;
}
