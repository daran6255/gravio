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

	// Deactivate a user in the current user's organization
	deactivate: async (publicId: string): Promise<TeamMember> => {
		const response = await api.post<TeamMember>(`/users/${publicId}/deactivate`);
		return response.data;
	},

	// Reactivate a previously deactivated user
	reactivate: async (publicId: string): Promise<TeamMember> => {
		const response = await api.post<TeamMember>(`/users/${publicId}/reactivate`);
		return response.data;
	},

	// Delete a user (verified or unverified)
	deleteUser: async (publicId: string): Promise<TeamMember> => {
		const response = await api.delete<TeamMember>(`/users/${publicId}`);
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

	// Update organization plan tier
	updatePlan: async (planTier: string): Promise<any> => {
		const response = await api.put<any>('/users/organization/plan', null, {
			params: { plan_tier: planTier }
		});
		return response.data;
	},
};

export default userService;
