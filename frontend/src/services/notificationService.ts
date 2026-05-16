import api from './api';

export interface BackendNotification {
	public_id: string;
	title: string;
	message: string;
	type: string;
	link?: string;
	is_read: boolean;
	created_at: string;
}

export interface NotificationListResponse {
	items: BackendNotification[];
	unread_count: number;
}

const notificationService = {
	getMyNotifications: async (unreadOnly = false, limit = 50): Promise<NotificationListResponse> => {
		const response = await api.get<NotificationListResponse>('/notifications/my', {
			params: { unread_only: unreadOnly, limit }
		});
		return response.data;
	},

	markAsRead: async (publicId: string): Promise<{ status: string }> => {
		const response = await api.put<{ status: string }>(`/notifications/${publicId}/read`);
		return response.data;
	},

	markAllAsRead: async (): Promise<{ status: string; marked_count: number }> => {
		const response = await api.put<{ status: string; marked_count: number }>('/notifications/read-all');
		return response.data;
	}
};

export default notificationService;
