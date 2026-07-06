import api from './api';
import type {
	TimesheetCategory,
	OrgHoliday,
	TimesheetUserSettings,
	ProjectTimeLog,
	TimesheetReportRow
} from '../models/timesheet';

const timesheetService = {
	// ==========================================
	// 1. CATEGORIES SERVICES
	// ==========================================
	getMyCategories: async (): Promise<TimesheetCategory[]> => {
		const response = await api.get('/timesheets/categories/my');
		return response.data;
	},

	createCategory: async (data: { name: string; color?: string }): Promise<TimesheetCategory> => {
		const response = await api.post('/timesheets/categories', data);
		return response.data;
	},

	updateCategory: async (id: number, data: { name?: string; color?: string }): Promise<TimesheetCategory> => {
		const response = await api.patch(`/timesheets/categories/${id}`, data);
		return response.data;
	},

	deleteCategory: async (id: number): Promise<void> => {
		await api.delete(`/timesheets/categories/${id}`);
	},

	getOrgDefaultCategories: async (): Promise<TimesheetCategory[]> => {
		const response = await api.get('/timesheets/categories/org-defaults');
		return response.data;
	},

	// ==========================================
	// 2. HOLIDAYS SERVICES
	// ==========================================
	listHolidays: async (startDate?: string, endDate?: string): Promise<OrgHoliday[]> => {
		const params: Record<string, string> = {};
		if (startDate) params.start_date = startDate;
		if (endDate) params.end_date = endDate;
		const response = await api.get('/holidays/', { params });
		return response.data;
	},

	createHoliday: async (data: { name: string; holiday_date: string; type: string; country_code?: string }): Promise<OrgHoliday> => {
		const response = await api.post('/holidays/', data);
		return response.data;
	},

	updateHoliday: async (id: number, data: Partial<OrgHoliday>): Promise<OrgHoliday> => {
		const response = await api.patch(`/holidays/${id}`, data);
		return response.data;
	},

	deleteHoliday: async (id: number): Promise<void> => {
		await api.delete(`/holidays/${id}`);
	},

	checkHoliday: async (checkDate: string): Promise<{ is_holiday: boolean; holiday: OrgHoliday | null }> => {
		const response = await api.get('/holidays/check', { params: { check_date: checkDate } });
		return response.data;
	},

	// ==========================================
	// 3. USER SETTINGS SERVICES
	// ==========================================
	getUserSettings: async (userId: number): Promise<TimesheetUserSettings> => {
		const response = await api.get(`/timesheets/users/${userId}/settings`);
		return response.data;
	},

	updateUserSettings: async (userId: number, data: Partial<TimesheetUserSettings>): Promise<TimesheetUserSettings> => {
		const response = await api.patch(`/timesheets/users/${userId}/settings`, data);
		return response.data;
	},

	// ==========================================
	// 4. TIME LOGS SERVICES
	// ==========================================
	getMyTimeLogs: async (startDate: string, endDate: string): Promise<ProjectTimeLog[]> => {
		const response = await api.get('/timesheets/my', { params: { start_date: startDate, end_date: endDate } });
		return response.data;
	},

	createTimeLog: async (data: {
		project_id?: number | null;
		task_id?: number | null;
		category_id?: number | null;
		log_date: string;
		hours: number;
		notes?: string | null;
		billing_type: string;
	}): Promise<ProjectTimeLog> => {
		const response = await api.post('/timesheets/', data);
		return response.data;
	},

	updateTimeLog: async (id: number, data: {
		project_id?: number | null;
		task_id?: number | null;
		category_id?: number | null;
		log_date?: string;
		hours?: number;
		notes?: string | null;
		billing_type?: string;
	}): Promise<ProjectTimeLog> => {
		const response = await api.patch(`/timesheets/${id}`, data);
		return response.data;
	},

	deleteTimeLog: async (id: number): Promise<void> => {
		await api.delete(`/timesheets/${id}`);
	},

	submitWeek: async (startDate: string, endDate: string): Promise<{ success: boolean; message: string; submitted_count: number }> => {
		const response = await api.post('/timesheets/submit-week', { start_date: startDate, end_date: endDate });
		return response.data;
	},

	// ==========================================
	// 5. APPROVALS SERVICES
	// ==========================================
	getTeamLogs: async (params: {
		start_date: string;
		end_date: string;
		user_id?: number | null;
		project_id?: number | null;
		status?: string | null;
	}): Promise<ProjectTimeLog[]> => {
		const response = await api.get('/timesheets/team', { params });
		return response.data;
	},

	approveWeek: async (targetUserId: number, startDate: string, endDate: string): Promise<{ success: boolean; approved_count: number }> => {
		const response = await api.post(`/timesheets/users/${targetUserId}/approve`, { start_date: startDate, end_date: endDate });
		return response.data;
	},

	rejectWeek: async (
		targetUserId: number,
		startDate: string,
		endDate: string,
		rejectionNote: string
	): Promise<{ success: boolean; rejected_count: number }> => {
		const response = await api.post(`/timesheets/users/${targetUserId}/reject`, {
			date_range: { start_date: startDate, end_date: endDate },
			payload: { rejection_note: rejectionNote }
		});
		return response.data;
	},
	
	// We'll define unapproveWeek as:
	unapproveWeek: async (targetUserId: number, startDate: string, endDate: string): Promise<{ success: boolean; unapproved_count: number }> => {
		const response = await api.post(`/timesheets/users/${targetUserId}/unapprove`, { start_date: startDate, end_date: endDate });
		return response.data;
	},

	// ==========================================
	// 6. REPORTS SERVICES
	// ==========================================
	getTimesheetReport: async (params: {
		start_date: string;
		end_date: string;
		project_id?: number | null;
		user_id?: number | null;
		billing_type?: string | null;
	}): Promise<TimesheetReportRow[]> => {
		const response = await api.get('/timesheets/report', { params });
		return response.data;
	}
};

export default timesheetService;
