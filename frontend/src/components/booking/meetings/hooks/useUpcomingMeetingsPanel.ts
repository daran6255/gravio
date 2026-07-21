import { useMemo } from 'react';
import dayjs, { type Dayjs } from 'dayjs';
import type { ScheduledMeetingHost } from '../../../../models/booking/meeting';

export function formatDuration(totalMinutes: number): string {
	const h = Math.floor(totalMinutes / 60);
	const m = Math.round(totalMinutes % 60);
	if (h <= 0) return `${m}m`;
	return m ? `${h}h ${m}m` : `${h}h`;
}

/** Short, situational label for a still-ahead meeting: "In progress", "In 25m",
 * "Tomorrow", or a plain weekday for anything further out. */
export function meetingWhenLabel(m: ScheduledMeetingHost, now: Dayjs): string {
	const start = dayjs(m.start_time);
	const end = dayjs(m.end_time);
	if (now.isAfter(start) && now.isBefore(end)) return 'In progress';
	if (start.isSame(now, 'day')) {
		const diff = start.diff(now, 'minute');
		return diff > 0 ? `In ${formatDuration(diff)}` : 'Just ended';
	}
	if (start.isSame(now.add(1, 'day'), 'day')) return 'Tomorrow';
	return start.format('ddd, MMM D');
}

export function dayGroupLabel(dateStr: string, now: Dayjs): string {
	const d = dayjs(dateStr);
	if (d.isSame(now, 'day')) return 'Today';
	if (d.isSame(now.add(1, 'day'), 'day')) return 'Tomorrow';
	return d.format('dddd, MMM D');
}

interface UseUpcomingMeetingsPanelParams {
	meetings: ScheduledMeetingHost[];
}

export const useUpcomingMeetingsPanel = ({ meetings }: UseUpcomingMeetingsPanelParams) => {
	const now = dayjs();

	// Not memoized: the surrounding `nextMeeting`/`todayCount` already depend on
	// `now` (a fresh value every render) and recompute unconditionally, so
	// memoizing just this one on [meetings] bought nothing but a compiler conflict.
	// From the start of today onward — not just "hasn't ended yet" — so a meeting
	// scheduled earlier today still shows up here (and stays reschedulable/
	// cancellable) instead of disappearing the moment it ends.
	const startOfToday = dayjs().startOf('day');
	const upcoming = meetings
		.filter((m) => m.status === 'scheduled' && !dayjs(m.start_time).isBefore(startOfToday))
		.sort((a, b) => dayjs(a.start_time).diff(dayjs(b.start_time)));

	// Genuinely still ahead (hasn't ended yet) — unlike `upcoming` above, a meeting
	// that already happened earlier today must never be shown as "Next up".
	// Not memoized: depends on `now`, which is a fresh value every render anyway.
	const nextMeeting = upcoming.find((m) => dayjs(m.end_time).isAfter(now));

	// Scoped to the full meetings list (not `upcoming`) so a meeting scheduled for
	// today still counts here even after it's already started/ended — "Today" is a
	// calendar-day stat, not a "still has time left" one.
	const todayCount = meetings.filter((m) => m.status === 'scheduled' && dayjs(m.start_time).isSame(now, 'day')).length;

	const weekStats = useMemo(() => {
		const startOfWeek = dayjs().startOf('week');
		const endOfWeek = dayjs().endOf('week');
		let count = 0;
		let minutes = 0;
		for (const m of meetings) {
			if (m.status !== 'scheduled') continue;
			const start = dayjs(m.start_time);
			if (start.isBefore(startOfWeek) || start.isAfter(endOfWeek)) continue;
			count += 1;
			minutes += dayjs(m.end_time).diff(start, 'minute');
		}
		return { count, hours: formatDuration(minutes) };
	}, [meetings]);

	const groups = useMemo(() => {
		const map = new Map<string, ScheduledMeetingHost[]>();
		for (const m of upcoming) {
			const key = dayjs(m.start_time).format('YYYY-MM-DD');
			if (!map.has(key)) map.set(key, []);
			map.get(key)!.push(m);
		}
		return Array.from(map.entries());
	}, [upcoming]);

	return { now, upcoming, nextMeeting, todayCount, weekStats, groups };
};
