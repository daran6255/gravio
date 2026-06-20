import { configureStore } from '@reduxjs/toolkit';
import uiReducer from './slices/uiSlice';
import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import healthReducer from './slices/healthSlice';
import orgAdminReducer from './slices/orgAdminSlice';

export const store = configureStore({
	reducer: {
		auth: authReducer,
		ui: uiReducer,
		users: userReducer,
		health: healthReducer,
		orgAdmin: orgAdminReducer,
	},
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({
			serializableCheck: false,
		}),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
