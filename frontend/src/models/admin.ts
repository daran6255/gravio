import type { Organization, User } from './auth';

/** Matches backend's CreateOrganizationRequest exactly. No password is ever collected here —
 *  the provisioned admin sets their own password via the emailed Accept Invite link. */
export interface CreateOrganizationRequest {
	organization: {
		name: string;
		location?: string;
	};
	admin: {
		username: string;
		email: string;
		full_name: string;
	};
}

export interface CreateOrganizationResponse {
	success: boolean;
	message: string;
	organization: Organization;
	admin_user: User;
}

export interface AdminStats {
	total_organizations: number;
	active_trials: number;
	total_users: number;
	avg_users_per_org: number;
	inactive_organizations: number;
	expired_trials: number;
	paid_organizations: number;
	paid_users: number;
	team_organizations: number;
	individual_organizations: number;
}
