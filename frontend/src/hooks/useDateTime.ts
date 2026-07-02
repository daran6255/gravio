import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { useAppSelector } from '../store/hooks';

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Hook for standardized date and time formatting across the application.
 * Date format: DD-MMM-YYYY (e.g., 25-Apr-2026)
 * Time format: 12-hour (e.g., 03:12 PM)
 *
 * Honors the current user's `timezone` preference (set via Account Settings)
 * when present; falls back to the browser's local timezone otherwise.
 */
export const useDateTime = () => {
	const userTimezone = useAppSelector((state) => state.auth.user?.timezone);

	const toZoned = (date: Date | string | number | null | undefined) => {
		const d = dayjs(date);
		return userTimezone ? d.tz(userTimezone) : d;
	};

	/**
	 * Formats a date into DD-MMM-YYYY
	 * @param date Date object, ISO string, or timestamp
	 * @returns Formatted date string or '-' if invalid
	 */
	const formatDate = (date: Date | string | number | null | undefined): string => {
		if (!date) return '-';

		const d = toZoned(date);
		if (!d.isValid()) return '-';

		return d.format('DD-MMM-YYYY');
	};

	/**
	 * Formats a time into 12-hour format (hh:mm a)
	 * @param date Date object, ISO string, or timestamp
	 * @returns Formatted time string or '-' if invalid
	 */
	const formatTime = (date: Date | string | number | null | undefined): string => {
		if (!date) return '-';

		const d = toZoned(date);
		if (!d.isValid()) return '-';

		return d.format('hh:mm A');
	};

	/**
	 * Formats both date and time
	 * @param date Date object, ISO string, or timestamp
	 * @returns Formatted string (e.g., 25-Apr-2026 03:12 PM)
	 */
	const formatDateTime = (date: Date | string | number | null | undefined): string => {
		if (!date) return '-';

		const d = toZoned(date);
		if (!d.isValid()) return '-';

		return d.format('DD-MMM-YYYY hh:mm A');
	};

	return {
		formatDate,
		formatTime,
		formatDateTime
	};
};

export default useDateTime;
