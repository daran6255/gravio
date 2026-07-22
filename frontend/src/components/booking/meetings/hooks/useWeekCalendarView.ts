import { useMemo, useState } from 'react';
import dayjs, { type Dayjs } from 'dayjs';
import type { ScheduledMeetingHost } from '../../../../models/booking/meeting';

export const HOUR_HEIGHT = 52;

/** Everything needed to render both the dragged card's ghost and the drop-target preview,
 * kept as one object so drag-start/drag-over/drop/drag-end all agree on a single source of truth. */
interface DragState {
	meeting: ScheduledMeetingHost;
	durationMinutes: number;
	overDateStr: string | null;
	overMinutes: number | null;
}

interface UseWeekCalendarViewParams {
	meetings: ScheduledMeetingHost[];
	onSlotClick: (dateStr: string, timeStr: string) => void;
	onMoveMeeting: (meeting: ScheduledMeetingHost, newStartTimeISO: string) => void;
}

export const useWeekCalendarView = ({ meetings, onSlotClick, onMoveMeeting }: UseWeekCalendarViewParams) => {
	const [weekStart, setWeekStart] = useState<Dayjs>(dayjs().startOf('day').subtract(dayjs().day(), 'day'));
	const [popoverAnchor, setPopoverAnchor] = useState<HTMLElement | null>(null);
	const [popoverMeeting, setPopoverMeeting] = useState<ScheduledMeetingHost | null>(null);
	const [dragState, setDragState] = useState<DragState | null>(null);

	// Full day, midnight to midnight — the grid scrolls internally (see WeekCalendarView)
	// instead of expanding the page to fit every hour.
	const startHour = 0;
	const endHour = 24;

	const hours = useMemo(() => Array.from({ length: endHour - startHour }, (_, i) => startHour + i), [startHour, endHour]);
	const gridHeight = hours.length * HOUR_HEIGHT;

	const timeToY = (minutesSinceMidnight: number) => ((minutesSinceMidnight - startHour * 60) / 60) * HOUR_HEIGHT;

	const days = useMemo(() => Array.from({ length: 7 }, (_, i) => weekStart.add(i, 'day')), [weekStart]);

	// Every status shows on the grid (scheduled, completed, cancelled) so the week
	// view doubles as a full record of what happened in a slot, not just what's booked.
	const meetingsByDate = useMemo(() => {
		const map = new Map<string, ScheduledMeetingHost[]>();
		for (const m of meetings) {
			const key = dayjs(m.start_time).format('YYYY-MM-DD');
			if (!map.has(key)) map.set(key, []);
			map.get(key)!.push(m);
		}
		return map;
	}, [meetings]);

	const now = dayjs();
	const weekLabel = `${weekStart.format('MMM D')} – ${weekStart.add(6, 'day').format('MMM D, YYYY')}`;

	const goToPreviousWeek = () => setWeekStart((w) => w.subtract(7, 'day'));
	const goToNextWeek = () => setWeekStart((w) => w.add(7, 'day'));
	const goToToday = () => setWeekStart(dayjs().startOf('day').subtract(dayjs().day(), 'day'));

	const handleDayColumnClick = (day: Dayjs, e: React.MouseEvent<HTMLDivElement>) => {
		const rect = e.currentTarget.getBoundingClientRect();
		const offsetY = e.clientY - rect.top;
		const rawMinutes = startHour * 60 + (offsetY / HOUR_HEIGHT) * 60;
		const rounded = Math.round(rawMinutes / 15) * 15;
		const h = Math.floor(rounded / 60);
		const m = rounded % 60;
		onSlotClick(day.format('YYYY-MM-DD'), `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
	};

	const slotMinutesFromPointer = (e: React.DragEvent<HTMLDivElement>) => {
		const rect = e.currentTarget.getBoundingClientRect();
		const offsetY = e.clientY - rect.top;
		const rawMinutes = startHour * 60 + (offsetY / HOUR_HEIGHT) * 60;
		return Math.max(0, Math.round(rawMinutes / 15) * 15);
	};

	const handleMeetingDragStart = (e: React.DragEvent<HTMLDivElement>, m: ScheduledMeetingHost) => {
		e.stopPropagation();
		e.dataTransfer.effectAllowed = 'move';
		e.dataTransfer.setData('text/plain', m.public_id);
		setDragState({
			meeting: m,
			durationMinutes: dayjs(m.end_time).diff(dayjs(m.start_time), 'minute'),
			overDateStr: null,
			overMinutes: null,
		});
	};

	const handleMeetingDragEnd = () => setDragState(null);

	const handleDayColumnDragOver = (day: Dayjs, e: React.DragEvent<HTMLDivElement>) => {
		if (!dragState) return;
		e.preventDefault();
		e.dataTransfer.dropEffect = 'move';
		const dateStr = day.format('YYYY-MM-DD');
		const minutes = slotMinutesFromPointer(e);
		if (dragState.overDateStr !== dateStr || dragState.overMinutes !== minutes) {
			setDragState((prev) => (prev ? { ...prev, overDateStr: dateStr, overMinutes: minutes } : prev));
		}
	};

	const handleDayColumnDrop = (day: Dayjs, e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
		if (!dragState) return;
		const minutes = slotMinutesFromPointer(e);
		const newStart = day.startOf('day').add(minutes, 'minute');
		const { meeting } = dragState;
		setDragState(null);
		if (newStart.isSame(dayjs(meeting.start_time))) return;
		onMoveMeeting(meeting, newStart.toISOString());
	};

	const openPopover = (anchor: HTMLElement, meeting: ScheduledMeetingHost) => {
		setPopoverAnchor(anchor);
		setPopoverMeeting(meeting);
	};

	const closePopover = () => setPopoverAnchor(null);

	return {
		weekLabel,
		goToPreviousWeek,
		goToNextWeek,
		goToToday,
		startHour,
		endHour,
		hours,
		gridHeight,
		timeToY,
		days,
		meetingsByDate,
		now,
		dragState,
		handleDayColumnClick,
		handleMeetingDragStart,
		handleMeetingDragEnd,
		handleDayColumnDragOver,
		handleDayColumnDrop,
		popoverAnchor,
		popoverMeeting,
		openPopover,
		closePopover,
	};
};
