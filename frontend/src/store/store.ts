import { configureStore } from '@reduxjs/toolkit';
import uiReducer from './slices/uiSlice';
import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import settingsReducer from './slices/settingsSlice';
import healthReducer from './slices/healthSlice';
import aiReducer from './slices/aiSlice';
import aiChatReducer from './slices/aiChatSlice';

export const store = configureStore({
	reducer: {
		auth: authReducer,
		ui: uiReducer,
		users: userReducer,
		settings: settingsReducer,
		health: healthReducer,
		ai: aiReducer,
		aiChat: aiChatReducer,
	},
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({
			serializableCheck: false,
		}),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
