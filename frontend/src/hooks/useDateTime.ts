import { format, isValid, parseISO } from 'date-fns';

/**
 * Hook for standardized date and time formatting across the application.
 * Date format: DD-MMM-YYYY (e.g., 25-Apr-2026)
 * Time format: 12-hour IST (e.g., 03:12 PM)
 */
export const useDateTime = () => {
	
	/**
	 * Formats a date into DD-MMM-YYYY
	 * @param date Date object, ISO string, or timestamp
	 * @returns Formatted date string or '-' if invalid
	 */
	const formatDate = (date: Date | string | number | null | undefined): string => {
		if (!date) return '-';
		
		const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date);
		
		if (!isValid(dateObj)) return '-';
		
		return format(dateObj, 'dd-MMM-yyyy');
	};

	/**
	 * Formats a time into 12-hour format (hh:mm a)
	 * @param date Date object, ISO string, or timestamp
	 * @returns Formatted time string or '-' if invalid
	 */
	const formatTime = (date: Date | string | number | null | undefined): string => {
		if (!date) return '-';
		
		const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date);
		
		if (!isValid(dateObj)) return '-';
		
		return format(dateObj, 'hh:mm a');
	};

	/**
	 * Formats both date and time
	 * @param date Date object, ISO string, or timestamp
	 * @returns Formatted string (e.g., 25-Apr-2026 03:12 PM)
	 */
	const formatDateTime = (date: Date | string | number | null | undefined): string => {
		if (!date) return '-';
		
		const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date);
		
		if (!isValid(dateObj)) return '-';
		
		return format(dateObj, 'dd-MMM-yyyy hh:mm a');
	};

	return {
		formatDate,
		formatTime,
		formatDateTime
	};
};

export default useDateTime;
