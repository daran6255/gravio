import api from './api';
import type { PaginatedResponse } from '../models/common';
import type { IrisPreviewResponse, IrisActivityEntry } from '../models/iris';
import type {
	ScheduledMeetingHost,
	ScheduleMeetingRequest,
	MeetingStatus,
	OrgMemberOption,
	PublicMeetingView,
	MeetingJoinInfo,
	HostAvailabilitySettings,
	HostAvailabilitySettingsUpdate,
	HostAvailabilityShareLink,
	AvailabilityRule,
	PublicAvailabilityView,
	AvailableSlotsResponse,
	PublicBookingRequest,
	PublicBookingConfirmation,
} from '../models/booking/meeting';

const bookingService = {
	listMyMeetings: async (params: {
		status?: MeetingStatus;
		upcomingOnly?: boolean;
		startAfter?: string;
		startBefore?: string;
		search?: string;
		page?: number;
		pageSize?: number;
	} = {}): Promise<PaginatedResponse<ScheduledMeetingHost>> => {
		const { status, upcomingOnly, startAfter, startBefore, search, page = 1, pageSize = 20 } = params;
		const response = await api.get<PaginatedResponse<ScheduledMeetingHost>>('/bookings/meetings', {
			params: {
				status, upcoming_only: upcomingOnly, start_after: startAfter, start_before: startBefore,
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
	/** Resolves a join-gate token (from an email's "Join Meeting" link) to whether the
	 * video call is currently joinable, and if so, what to embed. */
	publicGetMeetingJoinInfo: async (token: string): Promise<MeetingJoinInfo> => {
		const response = await api.get<MeetingJoinInfo>(`/bookings/public/meetings/join/${token}`);
		return response.data;
	},
	/** Mints a fresh join-gate URL for the host's own meeting — used so the host's
	 * "Join Meeting" button goes through the exact same gate/embed a client or guest
	 * would, instead of opening the raw video link directly. */
	hostGetMeetingJoinLink: async (publicId: string): Promise<{ join_url: string }> => {
		const response = await api.get<{ join_url: string }>(`/bookings/meetings/${publicId}/join-link`);
		return response.data;
	},

	// --- Host availability ("book a slot with me" self-service booking) ---
	getAvailability: async (): Promise<HostAvailabilitySettings> => {
		const response = await api.get<HostAvailabilitySettings>('/bookings/availability');
		return response.data;
	},
	updateAvailability: async (payload: HostAvailabilitySettingsUpdate): Promise<HostAvailabilitySettings> => {
		const response = await api.patch<HostAvailabilitySettings>('/bookings/availability', payload);
		return response.data;
	},
	replaceAvailabilityRules: async (rules: AvailabilityRule[]): Promise<HostAvailabilitySettings> => {
		const response = await api.put<HostAvailabilitySettings>('/bookings/availability/rules', { rules });
		return response.data;
	},
	enableBookingLink: async (): Promise<HostAvailabilityShareLink> => {
		const response = await api.post<HostAvailabilityShareLink>('/bookings/availability/enable');
		return response.data;
	},
	regenerateBookingLink: async (): Promise<HostAvailabilityShareLink> => {
		const response = await api.post<HostAvailabilityShareLink>('/bookings/availability/regenerate');
		return response.data;
	},
	disableBookingLink: async (): Promise<HostAvailabilityShareLink> => {
		const response = await api.delete<HostAvailabilityShareLink>('/bookings/availability');
		return response.data;
	},

	// --- Public (no-login) self-service booking — token identifies the host ---
	publicGetAvailability: async (token: string): Promise<PublicAvailabilityView> => {
		const response = await api.get<PublicAvailabilityView>(`/bookings/public/availability/${token}`);
		return response.data;
	},
	publicGetAvailableSlots: async (token: string, date: string): Promise<AvailableSlotsResponse> => {
		const response = await api.get<AvailableSlotsResponse>(`/bookings/public/availability/${token}/slots`, {
			params: { date },
		});
		return response.data;
	},
	publicBookSlot: async (token: string, payload: PublicBookingRequest): Promise<PublicBookingConfirmation> => {
		const response = await api.post<PublicBookingConfirmation>(`/bookings/public/availability/${token}/book`, payload);
		return response.data;
	},

	// --- IRIS assist ---
	previewIrisAction: async (message: string): Promise<IrisPreviewResponse> => {
		const response = await api.post<IrisPreviewResponse>('/bookings/iris/preview', { message });
		return response.data;
	},
	executeIrisAction: async (message: string): Promise<IrisActivityEntry> => {
		const response = await api.post<IrisActivityEntry>('/bookings/iris/execute', { message });
		return response.data;
	},
	getIrisActivity: async (): Promise<IrisActivityEntry[]> => {
		const response = await api.get<IrisActivityEntry[]>('/bookings/iris/activity');
		return response.data;
	},
};

export default bookingService;
