import api from './api';
import type { PaginatedResponse } from '../models/common';
import type {
	ScheduledMeetingHost,
	ScheduleMeetingRequest,
	MeetingStatus,
	OrgMemberOption,
	PublicMeetingView,
} from '../models/booking/meeting';

const bookingService = {
	listMyMeetings: async (params: {
		status?: MeetingStatus;
		upcomingOnly?: boolean;
		startBefore?: string;
		search?: string;
		page?: number;
		pageSize?: number;
	} = {}): Promise<PaginatedResponse<ScheduledMeetingHost>> => {
		const { status, upcomingOnly, startBefore, search, page = 1, pageSize = 20 } = params;
		const response = await api.get<PaginatedResponse<ScheduledMeetingHost>>('/bookings/meetings', {
			params: {
				status, upcoming_only: upcomingOnly, start_before: startBefore,
				search: search || undefined, page, page_size: pageSize,
			},
		});
		return response.data;
	},
	listTeamMeetings: async (params: {
		status?: MeetingStatus;
		search?: string;
		page?: number;
		pageSize?: number;
	} = {}): Promise<PaginatedResponse<ScheduledMeetingHost>> => {
		const { status, search, page = 1, pageSize = 20 } = params;
		const response = await api.get<PaginatedResponse<ScheduledMeetingHost>>('/bookings/meetings/team', {
			params: { status, search: search || undefined, page, page_size: pageSize },
		});
		return response.data;
	},
	hostCreateMeeting: async (payload: ScheduleMeetingRequest): Promise<ScheduledMeetingHost> => {
		const response = await api.post<ScheduledMeetingHost>('/bookings/meetings', payload);
		return response.data;
	},
	listOrgMembers: async (): Promise<OrgMemberOption[]> => {
		const response = await api.get<OrgMemberOption[]>('/bookings/org-members');
		return response.data;
	},
	hostCancelMeeting: async (publicId: string, reason?: string): Promise<ScheduledMeetingHost> => {
		const response = await api.post<ScheduledMeetingHost>(`/bookings/meetings/${publicId}/cancel`, { reason });
		return response.data;
	},
	hostCancelMeetingSeries: async (publicId: string, reason?: string): Promise<ScheduledMeetingHost> => {
		const response = await api.post<ScheduledMeetingHost>(`/bookings/meetings/${publicId}/cancel-series`, { reason });
		return response.data;
	},
	hostRescheduleMeeting: async (publicId: string, startTime: string): Promise<ScheduledMeetingHost> => {
		const response = await api.post<ScheduledMeetingHost>(`/bookings/meetings/${publicId}/reschedule`, {
			start_time: startTime,
		});
		return response.data;
	},
	hostCompleteMeeting: async (publicId: string, outcomeNotes?: string): Promise<ScheduledMeetingHost> => {
		const response = await api.post<ScheduledMeetingHost>(`/bookings/meetings/${publicId}/complete`, {
			outcome_notes: outcomeNotes,
		});
		return response.data;
	},
	publicGetMeeting: async (token: string): Promise<PublicMeetingView> => {
		const response = await api.get<PublicMeetingView>(`/bookings/public/meetings/${token}`);
		return response.data;
	},
	publicRescheduleMeeting: async (token: string, startTime: string): Promise<PublicMeetingView> => {
		const response = await api.post<PublicMeetingView>(`/bookings/public/meetings/${token}/reschedule`, {
			start_time: startTime,
		});
		return response.data;
	},
	publicCancelMeeting: async (token: string, reason?: string): Promise<PublicMeetingView> => {
		const response = await api.post<PublicMeetingView>(`/bookings/public/meetings/${token}/cancel`, { reason });
		return response.data;
	},
};

export default bookingService;
