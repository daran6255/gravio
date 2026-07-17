// frontend\src\services\userService.ts
// Org Admin "Team" management — invite/list/deactivate/reactivate users in the caller's own org.
import api from './api';
import type { TeamMember, InviteUserRequest, UpdateUserRequest } from '../models/user';
import type { PaginatedResponse } from '../models/common';

const userService = {
	// Invite a teammate into the current user's organization (POST /users/invite)
	inviteUser: async (payload: InviteUserRequest): Promise<TeamMember> => {
		const response = await api.post<TeamMember>('/users/invite', payload);
		return response.data;
	},

	// Update teammate details (PUT /users/{public_id})
	updateUser: async (publicId: string, payload: UpdateUserRequest): Promise<TeamMember> => {
		const response = await api.put<TeamMember>(`/users/${publicId}`, payload);
		return response.data;
	},

	// List users in the current user's organization, paginated (GET /users)
	list: async (page = 1, pageSize = 20): Promise<PaginatedResponse<TeamMember>> => {
		const response = await api.get<PaginatedResponse<TeamMember>>('/users', {
			params: { page, page_size: pageSize },
		});
		return response.data;
	},

	// Deactivate a user in the current user's organization. If the user owns active
	// leads, the backend returns 409 unless reassignToUserId is supplied.
	deactivate: async (publicId: string, reassignToUserId?: number): Promise<TeamMember> => {
		const response = await api.post<TeamMember>(`/users/${publicId}/deactivate`, null, {
			params: reassignToUserId ? { reassign_to_user_id: reassignToUserId } : undefined,
		});
		return response.data;
	},

	// Reactivate a previously deactivated user
	reactivate: async (publicId: string): Promise<TeamMember> => {
		const response = await api.post<TeamMember>(`/users/${publicId}/reactivate`);
		return response.data;
	},

	// Delete a user (verified or unverified). If the user owns active leads, the
	// backend returns 409 unless reassignToUserId is supplied.
	deleteUser: async (publicId: string, reassignToUserId?: number): Promise<TeamMember> => {
		const response = await api.delete<TeamMember>(`/users/${publicId}`, {
			params: reassignToUserId ? { reassign_to_user_id: reassignToUserId } : undefined,
		});
		return response.data;
	},

	// Resend an invite link to an unverified user
	resendInvite: async (publicId: string): Promise<TeamMember> => {
		const response = await api.post<TeamMember>(`/users/${publicId}/resend-invite`);
		return response.data;
	},

	// Trigger password reset email to a verified/active user
	triggerPasswordReset: async (publicId: string): Promise<TeamMember> => {
		const response = await api.post<TeamMember>(`/users/${publicId}/reset-password`);
		return response.data;
	},

	// Bulk delete users
	bulkDeleteUsers: async (publicIds: string[]): Promise<{ message: string; deleted_count: number }> => {
		const response = await api.post<{ message: string; deleted_count: number }>('/users/bulk-delete', {
			public_ids: publicIds,
		});
		return response.data;
	},

	updatePlan: async (planTier: string, accountType?: string): Promise<any> => {
		const response = await api.put<any>('/users/organization/plan', null, {
			params: { plan_tier: planTier, account_type: accountType }
		});
		return response.data;
	},

	// Raises an in-app notification to Gravit Super Admins — only they can
	// actually grant the extension (via the Admin Console).
	requestTrialExtension: async (): Promise<{ success: boolean; message: string }> => {
		const response = await api.post<{ success: boolean; message: string }>('/users/organization/request-trial-extension');
		return response.data;
	},
};

export default userService;
