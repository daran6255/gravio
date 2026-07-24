// Mirrors MEETING_PAST_GRACE_MINUTES in backend/app/schemas/booking.py — the backend
// is the source of truth for this rule; this just avoids a round-trip failure for
// the common case of picking/clicking/dragging clearly too far into the past.
export const MEETING_PAST_GRACE_MINUTES = 15;

export type MeetingStatus = 'scheduled' | 'completed' | 'cancelled';
export type CancelledBy = 'host' | 'client' | 'system';
export type MeetingLocationType = 'google_meet' | 'offline' | 'phone';

export type RecurrenceRule = 'daily' | 'weekly' | 'biweekly' | 'monthly';

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
	outcome_notes?: string;
	recurrence_rule?: RecurrenceRule;
	recurrence_end_date?: string;
	recurrence_group_id?: string;
	/** Only populated by the manager/admin team-meetings endpoint. */
	host_name?: string;
	host_email?: string;
	/** Only meaningful on the create response for a recurring series. */
	occurrences_created?: number;
}

/** There's only one response shape now (no separate public/host split) — kept as
 * a distinct name since components already import it that way. */
export type ScheduledMeetingHost = ScheduledMeeting;

/** Matches backend's PublicMeetingView — the slim, no-login view of a meeting via
 * its manage-link token. */
export interface PublicMeetingView {
	public_id: string;
	meeting_title?: string;
	host_name: string;
	start_time: string;
	end_time: string;
	attendee_timezone: string;
	location_type: MeetingLocationType;
	location_detail?: string;
	status: MeetingStatus;
	recurrence_group_id?: string;
}

/** Matches backend's OrgMemberOption — a teammate selectable in the "invite a
 * teammate" picker on the New Meeting form. */
export interface OrgMemberOption {
	id: number;
	full_name?: string;
	email: string;
}

// ---------------------------------------------------------------------------
// Public self-service booking ("book a slot with me")
// ---------------------------------------------------------------------------

/** One weekly recurring availability window. weekday: 0=Monday .. 6=Sunday
 * (matches Python's date.weekday(), same convention used by the backend). */
export interface AvailabilityRule {
	weekday: number;
	/** "HH:MM" (24h), e.g. "09:00" */
	start_time: string;
	end_time: string;
}

/** Matches backend's HostAvailabilitySettingsResponse (GET /bookings/availability). */
export interface HostAvailabilitySettings {
	is_enabled: boolean;
	share_token?: string;
	meeting_type_name: string;
	duration_minutes: number;
	buffer_minutes: number;
	min_notice_hours: number;
	booking_window_days: number;
	timezone: string;
	location_type: MeetingLocationType;
	location_detail?: string;
	rules: AvailabilityRule[];
}

/** Matches backend's HostAvailabilitySettingsUpdate. */
export interface HostAvailabilitySettingsUpdate {
	meeting_type_name?: string;
	duration_minutes?: number;
	buffer_minutes?: number;
	min_notice_hours?: number;
	booking_window_days?: number;
	timezone?: string;
	location_type?: MeetingLocationType;
	location_detail?: string;
}

/** Matches backend's HostAvailabilityShareLinkResponse. */
export interface HostAvailabilityShareLink {
	is_enabled: boolean;
	share_token?: string;
}

/** Matches backend's PublicAvailabilityView — what an unauthenticated visitor sees
 * before picking a slot. */
export interface PublicAvailabilityView {
	host_name: string;
	meeting_type_name: string;
	duration_minutes: number;
	location_type: MeetingLocationType;
	timezone: string;
	booking_window_days: number;
	min_notice_hours: number;
}

/** Matches backend's AvailableSlotsResponse — slots are UTC ISO start times. */
export interface AvailableSlotsResponse {
	date: string;
	slots: string[];
}

/** Matches backend's PublicBookingRequest. */
export interface PublicBookingRequest {
	start_time: string;
	client_name: string;
	client_email: string;
	attendee_timezone: string;
	notes?: string;
	idempotency_key: string;
}

/** Matches backend's PublicBookingConfirmation. */
export interface PublicBookingConfirmation {
	meeting: PublicMeetingView;
	manage_link: string;
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
	recurrence_rule?: RecurrenceRule;
	recurrence_end_date?: string;
}

/** Kept as a distinct name for the same reason as ScheduledMeetingHost above. */
export type HostScheduleMeetingRequest = ScheduleMeetingRequest;

/** Why a join-gate link isn't (yet/anymore) usable — matches the `reason` values
 * backend's get_meeting_join_info can return. */
export type MeetingJoinReason = 'not_started' | 'ended' | 'cancelled' | 'no_video_link';

/** Matches backend's MeetingJoinInfo — what a join-token holder learns about a
 * meeting's video call: just enough to embed it or explain why not. */
export interface MeetingJoinInfo {
	joinable: boolean;
	reason?: MeetingJoinReason;
	meeting_title?: string;
	host_name?: string;
	start_time: string;
	end_time: string;
	/** Only set when joinable — pieces needed to embed via the Jitsi IFrame External API. */
	jitsi_domain?: string;
	jitsi_room?: string;
}
