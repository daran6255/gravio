export type MeetingStatus = 'scheduled' | 'completed' | 'cancelled';
export type CancelledBy = 'host' | 'client' | 'system';
export type MeetingLocationType = 'google_meet' | 'offline' | 'phone';

/** Matches backend's ScheduledMeetingResponse. */
export interface ScheduledMeeting {
	id: number;
	public_id: string;
	lead_id?: number;
	client_name: string;
	client_email: string;
	meeting_title?: string;
	meeting_notes?: string;
	location_type: MeetingLocationType;
	location_detail?: string;
	participant_user_ids: number[];
	guest_emails: string[];
	start_time: string;
	end_time: string;
	host_timezone: string;
	attendee_timezone: string;
	status: MeetingStatus;
	cancelled_by?: CancelledBy;
	cancellation_reason?: string;
}

/** There's only one response shape now (no separate public/host split) — kept as
 * a distinct name since components already import it that way. */
export type ScheduledMeetingHost = ScheduledMeeting;

/** Matches backend's OrgMemberOption — a teammate selectable in the "invite a
 * teammate" picker on the New Meeting form. */
export interface OrgMemberOption {
	id: number;
	full_name?: string;
	email: string;
}

/** Matches backend's ScheduleMeetingRequest — a host scheduling a meeting directly
 * with a client, at an exact start/end time and a location they type in themselves. */
export interface ScheduleMeetingRequest {
	start_time: string;
	end_time: string;
	client_name: string;
	client_email: string;
	host_timezone: string;
	attendee_timezone: string;
	meeting_title?: string;
	meeting_notes?: string;
	location_type: MeetingLocationType;
	location_detail?: string;
	participant_user_ids?: number[];
	guest_emails?: string[];
	idempotency_key: string;
}

/** Kept as a distinct name for the same reason as ScheduledMeetingHost above. */
export type HostScheduleMeetingRequest = ScheduleMeetingRequest;
