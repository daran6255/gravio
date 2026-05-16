import { configureStore } from '@reduxjs/toolkit';
import uiReducer from './slices/uiSlice';
import authReducer from './slices/authSlice';
import candidateReducer from './slices/candidateSlice';
import activityLogReducer from './slices/activityLogSlice';
import userReducer from './slices/userSlice';
import trainingReducer from './slices/trainingSlice';
import notificationReducer from './slices/notificationSlice';
import settingsReducer from './slices/settingsSlice';
import mockInterviewReducer from './slices/mockInterviewSlice';
import trainingPlanReducer from './slices/trainingPlanSlice';
import attendanceReducer from './slices/attendanceSlice';
import jobRoleReducer from './slices/jobRoleSlice';
import placementMappingReducer from './slices/placementMappingSlice';
import skillReducer from './slices/skillSlice';
import placementEmailReducer from './slices/placementEmailSlice';
import placementDetailReducer from './slices/placementDetailSlice';
import publicInterviewReducer from './slices/publicInterviewSlice';

import companyReducer from './slices/companySlice';
import contactReducer from './slices/contactSlice';
import leadReducer from './slices/leadSlice';
import dealReducer from './slices/dealSlice';
import crmTaskReducer from './slices/crmTaskSlice';
import crmActivityReducer from './slices/crmActivitySlice';
import dsrReducer from './slices/dsrSlice';
import dsrActivityTypeReducer from './slices/dsrActivityTypeSlice';
import holidayReducer from './slices/holidaySlice';
import healthReducer from './slices/healthSlice';
import aiReducer from './slices/aiSlice';
import aiChatReducer from './slices/aiChatSlice';

export const store = configureStore({
	reducer: {
		auth: authReducer,
		ui: uiReducer,
		training: trainingReducer,
		candidates: candidateReducer,
		activityLogs: activityLogReducer,
		users: userReducer,
		settings: settingsReducer,
		notifications: notificationReducer,
		mockInterviews: mockInterviewReducer,
		trainingPlan: trainingPlanReducer,
		attendance: attendanceReducer,
		// CRM Slices
		companies: companyReducer,
		contacts: contactReducer,
		leads: leadReducer,
		deals: dealReducer,
		crmTasks: crmTaskReducer,
		crmActivities: crmActivityReducer,
		dsr: dsrReducer,
		dsrActivityType: dsrActivityTypeReducer,
		holidays: holidayReducer,
		// System Health
		health: healthReducer,
		ai: aiReducer,
		aiChat: aiChatReducer,
		// Placement Slices
		jobRoles: jobRoleReducer,
		placementMapping: placementMappingReducer,
		skills: skillReducer,
		placementEmail: placementEmailReducer,
		placementDetail: placementDetailReducer,
		publicInterview: publicInterviewReducer,
	},
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({
			serializableCheck: false,
		}),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
