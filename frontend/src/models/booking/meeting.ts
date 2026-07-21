export type MeetingStatus = 'scheduled' | 'completed' | 'cancelled';
export type CalendarSyncStatus = 'not_applicable' | 'pending' | 'synced' | 'failed';
export type CancelledBy = 'host' | 'client' | 'system';

/** Matches backend's ScheduledMeetingResponse — the public-safe shape. */
export interface ScheduledMeeting {
	id: number;
	public_id: string;
	client_name: string;
	client_email: string;
	meeting_title?: string;
	meeting_notes?: string;
	start_time: string;
	end_time: string;
	host_timezone: string;
	attendee_timezone: string;
	status: MeetingStatus;
	calendar_sync_status: CalendarSyncStatus;
	google_meet_link?: string;
	cancelled_by?: CancelledBy;
	cancellation_reason?: string;
}

/** Matches backend's ScheduledMeetingHostResponse — adds host-only fields. */
export interface ScheduledMeetingHost extends ScheduledMeeting {
	booking_page_id: number;
	lead_id?: number;
	google_event_id?: string;
	calendar_sync_attempts: number;
	calendar_sync_last_error?: string;
	participant_user_ids: number[];
	guest_emails: string[];
}

/** Matches backend's OrgMemberOption — a teammate selectable in the "invite a
 * teammate" picker on the New Meeting form. */
export interface OrgMemberOption {
	id: number;
	full_name?: string;
	email: string;
}

export interface AvailableSlot {
	start_time: string;
	end_time: string;
}

export interface AvailableSlotsResponse {
	date: string;
	timezone: string;
	slots: AvailableSlot[];
}

/** Matches backend's ScheduleMeetingRequest. */
export interface ScheduleMeetingRequest {
	start_time: string;
	client_name: string;
	client_email: string;
	attendee_timezone: string;
	meeting_notes?: string;
	idempotency_key: string;
}

/** Matches backend's HostScheduleMeetingRequest — a host booking a meeting directly. */
export interface HostScheduleMeetingRequest extends ScheduleMeetingRequest {
	booking_page_public_id: string;
	meeting_title?: string;
	participant_user_ids?: number[];
	guest_emails?: string[];
}
