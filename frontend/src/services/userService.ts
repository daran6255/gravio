// frontend\src\services\userService.ts
// Org Admin "Team" management — invite/list/deactivate/reactivate users in the caller's own org.
import api from './api';
import type { TeamMember, InviteUserRequest } from '../models/user';
import type { PaginatedResponse } from '../models/common';

const userService = {
	// Invite a teammate into the current user's organization (POST /users/invite)
	inviteUser: async (payload: InviteUserRequest): Promise<TeamMember> => {
		const response = await api.post<TeamMember>('/users/invite', payload);
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
};

export default userService;
