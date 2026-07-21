import api from './api';
import type { PaginatedResponse } from '../models/common';
import type {
	ScheduledMeetingHost,
	ScheduleMeetingRequest,
	MeetingStatus,
	OrgMemberOption,
} from '../models/booking/meeting';

const bookingService = {
	listMyMeetings: async (params: {
		status?: MeetingStatus;
		upcomingOnly?: boolean;
		search?: string;
		page?: number;
		pageSize?: number;
	} = {}): Promise<PaginatedResponse<ScheduledMeetingHost>> => {
		const { status, upcomingOnly, search, page = 1, pageSize = 20 } = params;
		const response = await api.get<PaginatedResponse<ScheduledMeetingHost>>('/bookings/meetings', {
			params: { status, upcoming_only: upcomingOnly, search: search || undefined, page, page_size: pageSize },
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
	hostRescheduleMeeting: async (publicId: string, startTime: string): Promise<ScheduledMeetingHost> => {
		const response = await api.post<ScheduledMeetingHost>(`/bookings/meetings/${publicId}/reschedule`, {
			start_time: startTime,
		});
		return response.data;
	},
};

export default bookingService;
