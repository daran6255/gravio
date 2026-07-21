import api from './api';
import type { PaginatedResponse } from '../models/common';
import type {
	BookingPage,
	BookingPageCreate,
	BookingPageUpdate,
	BookingPagePublic,
	BookingAvailabilityException,
	BookingAvailabilityExceptionCreate,
} from '../models/booking/bookingPage';
import type {
	ScheduledMeeting,
	ScheduledMeetingHost,
	AvailableSlotsResponse,
	ScheduleMeetingRequest,
	MeetingStatus,
} from '../models/booking/meeting';

const bookingService = {
	// --- Host: booking pages ---
	createBookingPage: async (payload: BookingPageCreate): Promise<BookingPage> => {
		const response = await api.post<BookingPage>('/bookings/pages', payload);
		return response.data;
	},
	listMyBookingPages: async (): Promise<BookingPage[]> => {
		const response = await api.get<BookingPage[]>('/bookings/pages/mine');
		return response.data;
	},
	getMyBookingPage: async (publicId: string): Promise<BookingPage> => {
		const response = await api.get<BookingPage>(`/bookings/pages/mine/${publicId}`);
		return response.data;
	},
	updateMyBookingPage: async (publicId: string, payload: BookingPageUpdate): Promise<BookingPage> => {
		const response = await api.patch<BookingPage>(`/bookings/pages/mine/${publicId}`, payload);
		return response.data;
	},
	listMyBookingPageExceptions: async (publicId: string): Promise<BookingAvailabilityException[]> => {
		const response = await api.get<BookingAvailabilityException[]>(`/bookings/pages/mine/${publicId}/exceptions`);
		return response.data;
	},
	createMyBookingPageException: async (
		publicId: string,
		payload: BookingAvailabilityExceptionCreate
	): Promise<BookingAvailabilityException> => {
		const response = await api.post<BookingAvailabilityException>(`/bookings/pages/mine/${publicId}/exceptions`, payload);
		return response.data;
	},
	deleteMyBookingPageException: async (publicId: string, exceptionId: number): Promise<void> => {
		await api.delete(`/bookings/pages/mine/${publicId}/exceptions/${exceptionId}`);
	},

	// --- Host: meetings ---
	listMyMeetings: async (params: {
		status?: MeetingStatus;
		upcomingOnly?: boolean;
		page?: number;
		pageSize?: number;
	} = {}): Promise<PaginatedResponse<ScheduledMeetingHost>> => {
		const { status, upcomingOnly, page = 1, pageSize = 20 } = params;
		const response = await api.get<PaginatedResponse<ScheduledMeetingHost>>('/bookings/meetings', {
			params: { status, upcoming_only: upcomingOnly, page, page_size: pageSize },
		});
		return response.data;
	},
	hostCancelMeeting: async (publicId: string, reason?: string): Promise<ScheduledMeetingHost> => {
		const response = await api.post<ScheduledMeetingHost>(`/bookings/meetings/${publicId}/cancel`, { reason });
		return response.data;
	},

	// --- Public: discovery + scheduling (no auth) ---
	getPublicBookingPage: async (slug: string): Promise<BookingPagePublic> => {
		const response = await api.get<BookingPagePublic>(`/bookings/pages/${slug}`);
		return response.data;
	},
	getAvailableSlots: async (slug: string, date: string, tz: string): Promise<AvailableSlotsResponse> => {
		const response = await api.get<AvailableSlotsResponse>(`/bookings/pages/${slug}/slots`, {
			params: { date, tz },
		});
		return response.data;
	},
	scheduleMeeting: async (slug: string, payload: ScheduleMeetingRequest): Promise<ScheduledMeeting> => {
		const response = await api.post<ScheduledMeeting>(`/bookings/pages/${slug}/schedule`, payload);
		return response.data;
	},

	// --- Public: self-serve manage (cancel/reschedule via emailed token, no auth) ---
	getMeetingByManageToken: async (manageToken: string): Promise<ScheduledMeeting> => {
		const response = await api.get<ScheduledMeeting>(`/bookings/manage/${manageToken}`);
		return response.data;
	},
	clientCancelMeeting: async (manageToken: string, reason?: string): Promise<ScheduledMeeting> => {
		const response = await api.post<ScheduledMeeting>(`/bookings/manage/${manageToken}/cancel`, { reason });
		return response.data;
	},
	clientRescheduleMeeting: async (manageToken: string, startTime: string): Promise<ScheduledMeeting> => {
		const response = await api.post<ScheduledMeeting>(`/bookings/manage/${manageToken}/reschedule`, {
			start_time: startTime,
		});
		return response.data;
	},
};

export default bookingService;
