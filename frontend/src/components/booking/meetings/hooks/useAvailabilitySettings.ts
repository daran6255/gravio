import { useEffect, useMemo, useState } from 'react';
import bookingService from '../../../../services/bookingService';
import useToast from '../../../../hooks/useToast';
import type { HostAvailabilitySettings, MeetingLocationType, AvailabilityRule } from '../../../../models/booking/meeting';

export const WEEKDAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface DayRow {
	weekday: number;
	enabled: boolean;
	startTime: string;
	endTime: string;
}

const DEFAULT_DAY_ROWS: DayRow[] = Array.from({ length: 7 }, (_, weekday) => ({
	weekday,
	// Monday-Friday on by default (9-5) -- the common case, easy to turn off/adjust.
	enabled: weekday < 5,
	startTime: '09:00',
	endTime: '17:00',
}));

export const shareUrlFor = (token: string) => `${window.location.origin}/book?token=${token}`;

export const useAvailabilitySettings = () => {
	const toast = useToast();
	const [settings, setSettings] = useState<HostAvailabilitySettings | null>(null);
	const [loading, setLoading] = useState(true);
	const [savingSettings, setSavingSettings] = useState(false);
	const [savingRules, setSavingRules] = useState(false);
	const [togglingLink, setTogglingLink] = useState(false);

	const [dayRows, setDayRows] = useState<DayRow[]>(DEFAULT_DAY_ROWS);

	// Draft settings fields -- kept separate from `settings` so edits aren't saved
	// until the user hits Save, and a failed save doesn't leave the form half-reset.
	const [meetingTypeName, setMeetingTypeName] = useState('Meeting');
	const [durationMinutes, setDurationMinutes] = useState(30);
	const [bufferMinutes, setBufferMinutes] = useState(0);
	const [minNoticeHours, setMinNoticeHours] = useState(4);
	const [bookingWindowDays, setBookingWindowDays] = useState(30);
	const [locationType, setLocationType] = useState<MeetingLocationType>('google_meet');
	const [locationDetail, setLocationDetail] = useState('');

	const load = () => {
		setLoading(true);
		bookingService.getAvailability()
			.then((data) => {
				setSettings(data);
				setMeetingTypeName(data.meeting_type_name);
				setDurationMinutes(data.duration_minutes);
				setBufferMinutes(data.buffer_minutes);
				setMinNoticeHours(data.min_notice_hours);
				setBookingWindowDays(data.booking_window_days);
				setLocationType(data.location_type);
				setLocationDetail(data.location_detail || '');

				const byWeekday = new Map(data.rules.map((r) => [r.weekday, r]));
				setDayRows(
					DEFAULT_DAY_ROWS.map((d) => {
						const existing = byWeekday.get(d.weekday);
						return existing
							? { weekday: d.weekday, enabled: true, startTime: existing.start_time.slice(0, 5), endTime: existing.end_time.slice(0, 5) }
							: { ...d, enabled: false };
					})
				);
			})
			.catch(() => toast.error("Couldn't load your booking page settings"))
			.finally(() => setLoading(false));
	};

	useEffect(load, []);

	const toggleDay = (weekday: number, enabled: boolean) => {
		setDayRows((prev) => prev.map((d) => (d.weekday === weekday ? { ...d, enabled } : d)));
	};

	const setDayTime = (weekday: number, field: 'startTime' | 'endTime', value: string) => {
		setDayRows((prev) => prev.map((d) => (d.weekday === weekday ? { ...d, [field]: value } : d)));
	};

	const hasInvalidDay = useMemo(
		() => dayRows.some((d) => d.enabled && d.startTime >= d.endTime),
		[dayRows]
	);

	const handleSaveSettings = async () => {
		setSavingSettings(true);
		try {
			const updated = await bookingService.updateAvailability({
				meeting_type_name: meetingTypeName.trim() || 'Meeting',
				duration_minutes: durationMinutes,
				buffer_minutes: bufferMinutes,
				min_notice_hours: minNoticeHours,
				booking_window_days: bookingWindowDays,
				location_type: locationType,
				location_detail: locationDetail.trim() || undefined,
			});
			setSettings(updated);
			toast.success('Booking page settings saved');
		} catch (err: any) {
			toast.error(err?.response?.data?.error?.message || 'Failed to save settings');
		} finally {
			setSavingSettings(false);
		}
	};

	const handleSaveRules = async () => {
		if (hasInvalidDay) {
			toast.error('Fix the highlighted day -- end time must be after start time.');
			return;
		}
		setSavingRules(true);
		try {
			const rules: AvailabilityRule[] = dayRows
				.filter((d) => d.enabled)
				.map((d) => ({ weekday: d.weekday, start_time: d.startTime, end_time: d.endTime }));
			const updated = await bookingService.replaceAvailabilityRules(rules);
			setSettings(updated);
			toast.success('Weekly schedule saved');
		} catch (err: any) {
			toast.error(err?.response?.data?.error?.message || 'Failed to save weekly schedule');
		} finally {
			setSavingRules(false);
		}
	};

	const handleToggleEnabled = async (checked: boolean) => {
		setTogglingLink(true);
		try {
			const result = checked ? await bookingService.enableBookingLink() : await bookingService.disableBookingLink();
			setSettings((prev) => (prev ? { ...prev, ...result } : prev));
			toast.success(checked ? 'Your booking page is live' : 'Booking page disabled');
		} catch {
			toast.error('Failed to update your booking page');
		} finally {
			setTogglingLink(false);
		}
	};

	const handleRegenerateLink = async () => {
		setTogglingLink(true);
		try {
			const result = await bookingService.regenerateBookingLink();
			setSettings((prev) => (prev ? { ...prev, ...result } : prev));
			toast.success('New link generated -- the old link no longer works');
		} catch {
			toast.error('Failed to regenerate your link');
		} finally {
			setTogglingLink(false);
		}
	};

	const handleCopyLink = async () => {
		if (!settings?.share_token) return;
		try {
			await navigator.clipboard.writeText(shareUrlFor(settings.share_token));
			toast.success('Link copied to clipboard');
		} catch {
			toast.error('Failed to copy link');
		}
	};

	return {
		settings,
		loading,
		savingSettings,
		savingRules,
		togglingLink,
		dayRows,
		toggleDay,
		setDayTime,
		hasInvalidDay,
		meetingTypeName, setMeetingTypeName,
		durationMinutes, setDurationMinutes,
		bufferMinutes, setBufferMinutes,
		minNoticeHours, setMinNoticeHours,
		bookingWindowDays, setBookingWindowDays,
		locationType, setLocationType,
		locationDetail, setLocationDetail,
		handleSaveSettings,
		handleSaveRules,
		handleToggleEnabled,
		handleRegenerateLink,
		handleCopyLink,
	};
};

export default useAvailabilitySettings;
