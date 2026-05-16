import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import notificationService from '../../services/notificationService';
import { formatDistanceToNow } from 'date-fns';

export interface Notification {
	id: string; // This corresponds to the public_id from backend
	title: string;
	message: string;
	timestamp: string;
	read: boolean;
	link?: string;
	type: 'registration' | 'system' | 'update' | 'dsr_approved' | 'dsr_rejected' | 'permission_granted' | 'permission_rejected';
}

interface NotificationState {
	notifications: Notification[];
	unreadCount: number;
	lastCandidateId: string | null;
	loading: boolean;
	error: string | null;
}

const initialState: NotificationState = {
	notifications: [],
	unreadCount: 0,
	lastCandidateId: null,
	loading: false,
	error: null,
};

// Async Thunks
export const fetchNotifications = createAsyncThunk(
	'notifications/fetchNotifications',
	async (_, { rejectWithValue }) => {
		try {
			const response = await notificationService.getMyNotifications();
			return response;
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to fetch notifications');
		}
	}
);

export const markNotificationRead = createAsyncThunk(
	'notifications/markRead',
	async (id: string, { rejectWithValue }) => {
		try {
			await notificationService.markAsRead(id);
			return id;
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to mark notification as read');
		}
	}
);

export const markAllNotificationsRead = createAsyncThunk(
	'notifications/markAllRead',
	async (_, { rejectWithValue }) => {
		try {
			await notificationService.markAllAsRead();
			return true;
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.detail || 'Failed to mark all as read');
		}
	}
);

const notificationSlice = createSlice({
	name: 'notifications',
	initialState,
	reducers: {
		addNotification: (state, action: PayloadAction<Omit<Notification, 'read'>>) => {
			const newNotification: Notification = {
				...action.payload,
				read: false,
			};
			state.notifications.unshift(newNotification);
			state.unreadCount += 1;
			if (state.notifications.length > 50) {
				state.notifications.pop();
			}
		},
		setLastCandidateId: (state, action: PayloadAction<string | null>) => {
			state.lastCandidateId = action.payload;
		},
		clearAllNotifications: (state) => {
			state.notifications = [];
			state.unreadCount = 0;
		},
	},
	extraReducers: (builder) => {
		builder
			// Fetch
			.addCase(fetchNotifications.pending, (state) => {
				state.loading = true;
			})
			.addCase(fetchNotifications.fulfilled, (state, action) => {
				state.loading = false;
				state.unreadCount = action.payload.unread_count;
				state.notifications = action.payload.items.map(item => ({
					id: item.public_id,
					title: item.title,
					message: item.message,
					timestamp: formatDistanceToNow(new Date(item.created_at), { addSuffix: true }),
					read: item.is_read,
					link: item.link,
					type: item.type as any
				}));
			})
			.addCase(fetchNotifications.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload as string;
			})
			// Mark Single Read
			.addCase(markNotificationRead.fulfilled, (state, action) => {
				const notification = state.notifications.find(n => n.id === action.payload);
				if (notification && !notification.read) {
					notification.read = true;
					state.unreadCount = Math.max(0, state.unreadCount - 1);
				}
			})
			// Mark All Read
			.addCase(markAllNotificationsRead.fulfilled, (state) => {
				state.notifications.forEach(n => {
					n.read = true;
				});
				state.unreadCount = 0;
			});
	}
});

export const { addNotification, setLastCandidateId, clearAllNotifications } = notificationSlice.actions;
export default notificationSlice.reducer;
