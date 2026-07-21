import { configureStore } from '@reduxjs/toolkit';
import uiReducer from './slices/uiSlice';
import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import healthReducer from './slices/healthSlice';
import orgAdminReducer from './slices/orgAdminSlice';
import crmReducer from './slices/crmSlice';
import notificationsReducer from './slices/notificationSlice';
import projectsReducer from './slices/projectsSlice';
import timesheetReducer from './slices/timesheetSlice';
import hrReducer from './slices/hrSlice';

export const store = configureStore({
	reducer: {
		auth: authReducer,
		ui: uiReducer,
		users: userReducer,
		health: healthReducer,
		orgAdmin: orgAdminReducer,
		crm: crmReducer,
		notifications: notificationsReducer,
		projects: projectsReducer,
		timesheets: timesheetReducer,
		hr: hrReducer,
	},
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({
			serializableCheck: false,
		}),
	// Unbounded devtools history buffers a full state-tree snapshot per dispatched
	// action for the whole tab session; over a long dev session with periodic
	// polling (e.g. NotificationBell) and large slices (e.g. crmSlice), that grows
	// until Chrome kills the renderer with "Aw, Snap! Out of Memory". Cap it.
	devTools: import.meta.env.DEV && { maxAge: 25, trace: false },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
