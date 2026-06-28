import api from './api';
import type { PaginatedResponse } from '../models/common';
import type { Notification } from '../models/notification';

const notificationService = {
	listNotifications: async (page = 1, pageSize = 20, unreadOnly = false): Promise<PaginatedResponse<Notification>> => {
		const response = await api.get<PaginatedResponse<Notification>>('/notifications', {
			params: { page, page_size: pageSize, unread_only: unreadOnly },
		});
		return response.data;
	},
	getUnreadCount: async (): Promise<number> => {
		const response = await api.get<{ unread_count: number }>('/notifications/unread-count');
		return response.data.unread_count;
	},
	markRead: async (publicId: string): Promise<Notification> => {
		const response = await api.patch<Notification>(`/notifications/${publicId}/read`);
		return response.data;
	},
	markAllRead: async (): Promise<number> => {
		const response = await api.patch<{ marked_read: number }>('/notifications/mark-all-read');
		return response.data.marked_read;
	},
};

export default notificationService;
