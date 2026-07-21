export type BookingLocationType = 'google_meet' | 'offline' | 'phone';

/** [start, end] in "HH:MM" 24h format, e.g. ["09:00", "17:00"] */
export type TimeRange = [string, string];

export type WeeklyAvailability = Partial<Record<'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun', TimeRange[]>>;

/** Matches backend's BookingPageResponse. */
export interface BookingPage {
	id: number;
	public_id: string;
	user_id: number;
	slug: string;
	title: string;
	description?: string;
	duration_minutes: number;
	is_active: boolean;
	location_type: BookingLocationType;
	offline_address?: string;
	fallback_meeting_note?: string;
	timezone: string;
	availability: WeeklyAvailability;
	buffer_before_minutes: number;
	buffer_after_minutes: number;
	min_notice_minutes: number;
	max_advance_days: number;
	max_bookings_per_day?: number;
}

/** Matches backend's BookingPageCreate. */
export interface BookingPageCreate {
	slug: string;
	title: string;
	description?: string;
	duration_minutes: number;
	location_type: BookingLocationType;
	offline_address?: string;
	fallback_meeting_note?: string;
	timezone: string;
	availability: WeeklyAvailability;
	buffer_before_minutes?: number;
	buffer_after_minutes?: number;
	min_notice_minutes?: number;
	max_advance_days?: number;
	max_bookings_per_day?: number;
}

export type BookingPageUpdate = Partial<Omit<BookingPageCreate, 'slug'>> & { is_active?: boolean };

/** Matches backend's BookingPagePublicResponse — what an unauthenticated visitor sees. */
export interface BookingPagePublic {
	slug: string;
	title: string;
	description?: string;
	duration_minutes: number;
	location_type: BookingLocationType;
	timezone: string;
	host_name: string;
}

export interface BookingAvailabilityException {
	id: number;
	date: string;
	is_blocked: boolean;
	custom_slots?: TimeRange[];
}

export interface BookingAvailabilityExceptionCreate {
	date: string;
	is_blocked?: boolean;
	custom_slots?: TimeRange[];
}
