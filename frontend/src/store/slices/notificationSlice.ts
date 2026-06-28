import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import notificationService from '../../services/notificationService';
import type { Notification } from '../../models/notification';
import type { PaginatedResponse } from '../../models/common';

interface NotificationState {
	notifications: Notification[];
	notificationsLoading: boolean;
	notificationsError: string | null;
	unreadCount: number;
}

const initialState: NotificationState = {
	notifications: [],
	notificationsLoading: false,
	notificationsError: null,
	unreadCount: 0,
};

export const fetchNotifications = createAsyncThunk(
	'notifications/fetchNotifications',
	async (params: { page?: number; pageSize?: number; unreadOnly?: boolean } | undefined, { rejectWithValue }) => {
		try {
			const { page = 1, pageSize = 20, unreadOnly = false } = params || {};
			return await notificationService.listNotifications(page, pageSize, unreadOnly);
		} catch (error: any) {
			return rejectWithValue(error?.response?.data?.error?.message || error?.message || 'Failed to fetch notifications');
		}
	}
);

export const fetchUnreadCount = createAsyncThunk(
	'notifications/fetchUnreadCount',
	async (_, { rejectWithValue }) => {
		try {
			return await notificationService.getUnreadCount();
		} catch (error: any) {
			return rejectWithValue(error?.response?.data?.error?.message || error?.message || 'Failed to fetch unread count');
		}
	}
);

export const markNotificationRead = createAsyncThunk(
	'notifications/markNotificationRead',
	async (publicId: string, { rejectWithValue }) => {
		try {
			return await notificationService.markRead(publicId);
		} catch (error: any) {
			return rejectWithValue(error?.response?.data?.error?.message || error?.message || 'Failed to mark notification as read');
		}
	}
);

export const markAllNotificationsRead = createAsyncThunk(
	'notifications/markAllNotificationsRead',
	async (_, { rejectWithValue }) => {
		try {
			await notificationService.markAllRead();
		} catch (error: any) {
			return rejectWithValue(error?.response?.data?.error?.message || error?.message || 'Failed to mark all as read');
		}
	}
);

const notificationSlice = createSlice({
	name: 'notifications',
	initialState,
	reducers: {},
	extraReducers: (builder) => {
		builder
			.addCase(fetchNotifications.pending, (state) => {
				state.notificationsLoading = true;
				state.notificationsError = null;
			})
			.addCase(fetchNotifications.fulfilled, (state, action: PayloadAction<PaginatedResponse<Notification>>) => {
				state.notificationsLoading = false;
				state.notifications = action.payload.items;
			})
			.addCase(fetchNotifications.rejected, (state, action: PayloadAction<any>) => {
				state.notificationsLoading = false;
				state.notificationsError = action.payload;
			})
			.addCase(fetchUnreadCount.fulfilled, (state, action: PayloadAction<number>) => {
				state.unreadCount = action.payload;
			})
			.addCase(markNotificationRead.fulfilled, (state, action: PayloadAction<Notification>) => {
				const idx = state.notifications.findIndex((n) => n.public_id === action.payload.public_id);
				if (idx !== -1) state.notifications[idx] = action.payload;
				state.unreadCount = Math.max(0, state.unreadCount - 1);
			})
			.addCase(markAllNotificationsRead.fulfilled, (state) => {
				state.notifications = state.notifications.map((n) => ({ ...n, is_read: true }));
				state.unreadCount = 0;
			});
	},
});

export default notificationSlice.reducer;
