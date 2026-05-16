import api from './api';
import type { DSREntry, DSREntryCreate, DSRStatus, MissingDSR, PaginationResult, DSRLeaveStats } from '../models/dsr';

const dsrService = {
	getEntries: async (
		skip = 0,
		limit = 100,
		date_from?: string,
		date_to?: string,
		status?: DSRStatus
	): Promise<PaginationResult<DSREntry>> => {
		const response = await api.get('/dsr/entries/', {
			params: { skip, limit, date_from, date_to, status }
		});
		return response.data;
	},

	getMyEntries: async (
		skip = 0,
		limit = 100,
		date_from?: string,
		date_to?: string,
		status?: DSRStatus,
		search?: string
	): Promise<PaginationResult<DSREntry>> => {
		const response = await api.get('/dsr/entries/me', {
			params: { skip, limit, date_from, date_to, status, search }
		});
		return response.data;
	},

	getEntry: async (publicId: string): Promise<DSREntry> => {
		const response = await api.get(`/dsr/entries/${publicId}`);
		return response.data;
	},

	createEntry: async (data: DSREntryCreate): Promise<DSREntry> => {
		const response = await api.post('/dsr/entries/', data);
		return response.data;
	},

	submitEntry: async (publicId: string): Promise<DSREntry> => {
		const response = await api.post(`/dsr/entries/${publicId}/submit`);
		return response.data;
	},

	deleteEntry: async (publicId: string): Promise<void> => {
		await api.delete(`/dsr/entries/${publicId}`);
	},

	getCalendarStatus: async (date_from: string, date_to: string, user_id?: number): Promise<{ entries: any[], leaves: any[] }> => {
		const response = await api.get('/dsr/entries/calendar-status', {
			params: { date_from, date_to, user_id }
		});
		return response.data;
	},

	applyLeave: async (data: { start_date: string, end_date: string, leave_type: string, reason?: string }): Promise<any> => {
		const response = await api.post('/dsr/leaves/', data);
		return response.data;
	},

	getMyLeaves: async (skip = 0, limit = 50, status?: string): Promise<{ items: any[], total: number }> => {
		const response = await api.get('/dsr/leaves/my', {
			params: { skip, limit, status }
		});
		return response.data;
	},

	cancelLeave: async (publicId: string): Promise<any> => {
		const response = await api.post(`/dsr/leaves/${publicId}/cancel`);
		return response.data;
	},

	getLeaveStats: async (): Promise<DSRLeaveStats> => {
		const response = await api.get('/dsr/leaves/stats');
		return response.data;
	},

	getAllLeaves: async (
		skip = 0,
		limit = 100,
		status?: string,
		user_id?: number
	): Promise<{ items: any[], total: number }> => {
		const response = await api.get('/dsr/leaves/all', {
			params: { skip, limit, status, user_id }
		});
		return response.data;
	},

	handleLeaveRequest: async (
		publicId: string,
		data: { status: string, admin_notes?: string }
	): Promise<any> => {
		const response = await api.patch(`/dsr/leaves/${publicId}`, data);
		return response.data;
	},

	// Admin Actions
	getAdminOverview: async (
		skip = 0,
		limit = 10,
		date_from?: string,
		date_to?: string,
		search?: string,
		status?: string
	): Promise<PaginationResult<DSREntry>> => {
		const response = await api.get('/dsr/entries', {
			params: { skip, limit, date_from, date_to, search, status }
		});
		return response.data;
	},

	getMissingReports: async (date: string): Promise<MissingDSR[]> => {
		const response = await api.get('/dsr/admin/missing', {
			params: { report_date: date }
		});
		return response.data;
	},

	grantPermission: async (data: { user_public_id: string, target_date: string }): Promise<void> => {
		await api.post('/dsr/admin/grant-permission', {
			user_public_id: data.user_public_id,
			report_date: data.target_date
		});
	},

	sendReminders: async (date: string): Promise<void> => {
		await api.post('/dsr/admin/send-reminders', {
			report_date: date,
			user_public_ids: null // Remind all missing
		});
	},

	// Permission Requests
	createPermissionRequest: async (data: { report_date: string, reason: string }): Promise<any> => {
		const response = await api.post('/dsr/permissions/request', data);
		return response.data;
	},

	getPermissionRequests: async (
		skip = 0,
		limit = 100,
		user_id?: number,
		status?: string,
		search?: string
	): Promise<{ items: any[], total: number }> => {
		const response = await api.get('/dsr/permissions/requests', {
			params: { skip, limit, user_id, status, search }
		});
		return response.data;
	},

	handlePermissionRequest: async (
		publicId: string,
		data: { status: string, admin_notes?: string }
	): Promise<any> => {
		const response = await api.put(`/dsr/permissions/requests/${publicId}`, data);
		return response.data;
	},

	getPermissionStats: async (user_id?: number): Promise<any> => {
		const response = await api.get('/dsr/permissions/stats', {
			params: { user_id }
		});
		return response.data;
	},

	// Review Actions (Admin)
	getPendingApproval: async (skip = 0, limit = 100): Promise<any> => {
		const response = await api.get('/dsr/entries/pending-approval', {
			params: { skip, limit }
		});
		return response.data;
	},

	approveEntry: async (publicId: string, admin_notes?: string): Promise<any> => {
		const response = await api.post(`/dsr/entries/${publicId}/approve`, { admin_notes });
		return response.data;
	},

	rejectEntry: async (publicId: string, reason: string): Promise<any> => {
		const response = await api.post(`/dsr/entries/${publicId}/reject`, { reason });
		return response.data;
	},

	revokeEntry: async (publicId: string, reason?: string): Promise<any> => {
		const response = await api.post(`/dsr/entries/${publicId}/revoke`, { reason });
		return response.data;
	},

	getMyStats: async (): Promise<any> => {
		const response = await api.get('/dsr/entries/my-stats');
		return response.data;
	},

	getMyStatsSummary: async (): Promise<any> => {
		const response = await api.get('/dsr/entries/my-summary');
		return response.data;
	}
};

export default dsrService;
