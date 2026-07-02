import dayjs from 'dayjs';
import type { ReminderStatus } from '../models/crm/reminder';

export type ReminderPreset = '15_min' | '1_hour' | '1_day' | 'on_due_date' | 'custom';

export interface ReminderPresetOption {
	value: ReminderPreset;
	label: string;
}

export const REMINDER_PRESET_OPTIONS: ReminderPresetOption[] = [
	{ value: '15_min', label: '15 minutes before' },
	{ value: '1_hour', label: '1 hour before' },
	{ value: '1_day', label: '1 day before' },
	{ value: 'on_due_date', label: 'On the due date' },
	{ value: 'custom', label: 'Custom date & time' },
];

const DEFAULT_HOUR = 9;

/** True when a date string has no time component (e.g. a Deal Task's due_date, 'YYYY-MM-DD'). */
function isDateOnly(value: string): boolean {
	return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

/**
 * Computes the absolute remind_at ISO timestamp from a preset and a base due
 * date/time. Returns null for 'custom' — the caller supplies the picked
 * datetime directly in that case. Date-only base values (e.g. a Deal Task's
 * due_date) default to 9:00 AM local time before applying the offset.
 */
export function computeRemindAt(preset: ReminderPreset, baseDate: string | Date): string | null {
	if (preset === 'custom') return null;

	let base = dayjs(baseDate);
	if (typeof baseDate === 'string' && isDateOnly(baseDate)) {
		base = base.hour(DEFAULT_HOUR).minute(0).second(0).millisecond(0);
	}

	switch (preset) {
		case '15_min':
			return base.subtract(15, 'minute').toISOString();
		case '1_hour':
			return base.subtract(1, 'hour').toISOString();
		case '1_day':
			return base.subtract(1, 'day').toISOString();
		case 'on_due_date':
			return base.toISOString();
		default:
			return null;
	}
}

/** Formats a reminder's remind_at for display in lists (e.g. "Tomorrow at 9:00 AM", "Jul 5, 2026 3:00 PM"). */
export function formatReminderTime(remindAt: string): string {
	const target = dayjs(remindAt);
	const now = dayjs();

	if (target.isSame(now, 'day')) {
		return `Today at ${target.format('h:mm A')}`;
	}
	if (target.isSame(now.add(1, 'day'), 'day')) {
		return `Tomorrow at ${target.format('h:mm A')}`;
	}
	if (target.isSame(now.subtract(1, 'day'), 'day')) {
		return `Yesterday at ${target.format('h:mm A')}`;
	}
	return target.format('MMM D, YYYY h:mm A');
}

/** True if remind_at is in the past and status is still pending — used for "overdue"
 * badge styling client-side, in between the notification bell's 60s polls. */
export function isReminderOverdue(remindAt: string, status: ReminderStatus): boolean {
	if (status !== 'pending') return false;
	return dayjs(remindAt).isBefore(dayjs());
}
