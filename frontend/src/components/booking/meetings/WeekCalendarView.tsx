import React, { useMemo, useState } from 'react';
import { Box, Stack, Typography, IconButton, Button, Popover, Divider, Tooltip, useTheme, alpha } from '@mui/material';
import { ChevronLeft, ChevronRight, VideocamOutlined, BlockOutlined, LockOpenOutlined, Close as CloseIcon, EditOutlined, CloseOutlined, CalendarMonthOutlined } from '@mui/icons-material';
import dayjs, { type Dayjs } from 'dayjs';
import StatusBadge from '../../common/badge/StatusBadge';
import EnterpriseAvatar from '../../common/avatar/Avatar';
import type { BookingPage, BookingAvailabilityException, WeeklyAvailability } from '../../../models/booking/bookingPage';
import type { ScheduledMeetingHost } from '../../../models/booking/meeting';

const DAY_KEYS: (keyof WeeklyAvailability)[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const HOUR_HEIGHT = 52;

const SYNC_LABEL: Record<string, string> = {
	not_applicable: 'Manual Link',
	pending: 'Syncing to Google…',
	synced: 'Synced',
	failed: 'Sync Failed',
};

interface WeekCalendarViewProps {
	bookingPage: BookingPage | null;
	meetings: ScheduledMeetingHost[];
	exceptions: BookingAvailabilityException[];
	onSlotClick: (dateStr: string, timeStr: string) => void;
	onToggleBlockDay: (dateStr: string, currentlyBlocked: boolean) => void;
	onReschedule: (meeting: ScheduledMeetingHost) => void;
	onCancel: (meeting: ScheduledMeetingHost) => void;
	/** Drag a meeting card onto a new day/time — receives the ISO start time for the drop slot. */
	onMoveMeeting: (meeting: ScheduledMeetingHost, newStartTimeISO: string) => void;
}

function timeStrToMinutes(t: string): number {
	const [h, m] = t.split(':').map(Number);
	return h * 60 + m;
}

/** Everything needed to render both the dragged card's ghost and the drop-target preview,
 * kept as one object so drag-start/drag-over/drop/drag-end all agree on a single source of truth. */
interface DragState {
	meeting: ScheduledMeetingHost;
	durationMinutes: number;
	overDateStr: string | null;
	overMinutes: number | null;
}

const WeekCalendarView: React.FC<WeekCalendarViewProps> = ({
	bookingPage, meetings, exceptions, onSlotClick, onToggleBlockDay, onReschedule, onCancel, onMoveMeeting,
}) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const [weekStart, setWeekStart] = useState<Dayjs>(dayjs().startOf('day').subtract(dayjs().day(), 'day'));
	const [popoverAnchor, setPopoverAnchor] = useState<HTMLElement | null>(null);
	const [popoverMeeting, setPopoverMeeting] = useState<ScheduledMeetingHost | null>(null);
	const [dragState, setDragState] = useState<DragState | null>(null);

	const cardSx = {
		p: { xs: 2.5, sm: 3 }, borderRadius: '20px',
		bgcolor: 'background.paper',
		border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.04)',
		boxShadow: isDark ? '0 1px 2px rgba(0,0,0,0.4), 0 8px 20px rgba(0,0,0,0.2)' : '0 1px 2px rgba(15,23,42,0.04), 0 8px 20px rgba(15,23,42,0.05)',
	};

	const availability = bookingPage?.availability || {};

	const { startHour, endHour } = useMemo(() => {
		const allRanges = Object.values(availability).flat();
		if (allRanges.length === 0) return { startHour: 7, endHour: 20 };
		const starts = allRanges.map((r) => Number(r[0].split(':')[0]));
		const ends = allRanges.map((r) => Number(r[1].split(':')[0]) + (Number(r[1].split(':')[1]) > 0 ? 1 : 0));
		return {
			startHour: Math.max(0, Math.min(...starts) - 1),
			endHour: Math.min(24, Math.max(...ends) + 1),
		};
	}, [availability]);

	const hours = useMemo(() => Array.from({ length: endHour - startHour }, (_, i) => startHour + i), [startHour, endHour]);
	const gridHeight = hours.length * HOUR_HEIGHT;

	const timeToY = (minutesSinceMidnight: number) => ((minutesSinceMidnight - startHour * 60) / 60) * HOUR_HEIGHT;

	const days = useMemo(() => Array.from({ length: 7 }, (_, i) => weekStart.add(i, 'day')), [weekStart]);

	const meetingsByDate = useMemo(() => {
		const map = new Map<string, ScheduledMeetingHost[]>();
		for (const m of meetings) {
			if (m.status !== 'scheduled') continue;
			const key = dayjs(m.start_time).format('YYYY-MM-DD');
			if (!map.has(key)) map.set(key, []);
			map.get(key)!.push(m);
		}
		return map;
	}, [meetings]);

	const exceptionByDate = useMemo(() => new Map(exceptions.map((e) => [e.date, e])), [exceptions]);

	const now = dayjs();
	const weekLabel = `${weekStart.format('MMM D')} – ${weekStart.add(6, 'day').format('MMM D, YYYY')}`;

	const handleDayColumnClick = (day: Dayjs, e: React.MouseEvent<HTMLDivElement>) => {
		if (day.isBefore(now, 'day')) return;
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
		const dateStr = day.format('YYYY-MM-DD');
		const isPast = day.isBefore(now, 'day');
		const isBlocked = !!exceptionByDate.get(dateStr)?.is_blocked;
		// Don't call preventDefault for a day we won't accept a drop on — the browser then shows
		// its own "not allowed" cursor for free, and onDrop simply never fires here.
		if (isPast || isBlocked) return;
		e.preventDefault();
		e.dataTransfer.dropEffect = 'move';
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

	return (
		<Box sx={cardSx}>
			{/* Controls */}
			<Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={1.5} sx={{ mb: 2 }}>
				<Stack direction="row" spacing={1} alignItems="center">
					<IconButton size="small" onClick={() => setWeekStart((w) => w.subtract(7, 'day'))}><ChevronLeft /></IconButton>
					<Button size="small" variant="outlined" onClick={() => setWeekStart(dayjs().startOf('day').subtract(dayjs().day(), 'day'))} sx={{ textTransform: 'none', borderRadius: 2 }}>
						Today
					</Button>
					<IconButton size="small" onClick={() => setWeekStart((w) => w.add(7, 'day'))}><ChevronRight /></IconButton>
					<Typography variant="body2" fontWeight={700} sx={{ ml: 1 }}>{weekLabel}</Typography>
				</Stack>
				<Stack direction="row" spacing={2}>
					<Stack direction="row" spacing={0.75} alignItems="center">
						<Box sx={{ width: 10, height: 10, borderRadius: 0.5, bgcolor: 'primary.main' }} />
						<Typography variant="caption" color="text.secondary">Scheduled</Typography>
					</Stack>
					<Stack direction="row" spacing={0.75} alignItems="center">
						<Box sx={{ width: 10, height: 10, borderRadius: 0.5, bgcolor: 'success.main', opacity: 0.3 }} />
						<Typography variant="caption" color="text.secondary">Available hours</Typography>
					</Stack>
					<Stack direction="row" spacing={0.75} alignItems="center">
						<Box sx={{ width: 10, height: 10, borderRadius: 0.5, bgcolor: 'error.main' }} />
						<Typography variant="caption" color="text.secondary">Blocked</Typography>
					</Stack>
				</Stack>
			</Stack>

			{/* Grid */}
			<Box sx={{ display: 'grid', gridTemplateColumns: '52px repeat(7, 1fr)', overflowX: 'auto' }}>
				{/* Header row */}
				<Box />
				{days.map((day) => {
					const isToday = day.isSame(now, 'day');
					return (
						<Box key={day.format('YYYY-MM-DD')} sx={{ textAlign: 'center', pb: 1, position: 'relative' }}>
							<Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.65rem' }}>
								{day.format('ddd')}
							</Typography>
							<Box
								sx={{
									width: 30, height: 30, borderRadius: '50%', mx: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center',
									bgcolor: isToday ? 'primary.main' : 'transparent', color: isToday ? '#fff' : 'text.primary', fontWeight: 700, fontSize: '0.9rem',
								}}
							>
								{day.format('D')}
							</Box>
							<Tooltip title={exceptionByDate.get(day.format('YYYY-MM-DD'))?.is_blocked ? 'Unblock this day' : 'Block this day'}>
								<span>
									<IconButton
										size="small"
										disabled={day.isBefore(now, 'day') || !bookingPage}
										onClick={() => onToggleBlockDay(day.format('YYYY-MM-DD'), !!exceptionByDate.get(day.format('YYYY-MM-DD'))?.is_blocked)}
										sx={{ position: 'absolute', top: 0, right: 4, opacity: 0.5, '&:hover': { opacity: 1 } }}
									>
										{exceptionByDate.get(day.format('YYYY-MM-DD'))?.is_blocked
											? <LockOpenOutlined sx={{ fontSize: 14 }} />
											: <BlockOutlined sx={{ fontSize: 14 }} />}
									</IconButton>
								</span>
							</Tooltip>
						</Box>
					);
				})}

				{/* Time gutter */}
				<Box sx={{ position: 'relative', height: gridHeight }}>
					{hours.map((h) => (
						<Typography
							key={h}
							variant="caption"
							sx={{ position: 'absolute', top: (h - startHour) * HOUR_HEIGHT - 7, right: 8, color: 'text.secondary', fontSize: '0.65rem' }}
						>
							{dayjs().hour(h).minute(0).format('h A')}
						</Typography>
					))}
				</Box>

				{/* Day columns */}
				{days.map((day) => {
					const dateStr = day.format('YYYY-MM-DD');
					const dayKey = DAY_KEYS[day.day()];
					const exception = exceptionByDate.get(dateStr);
					const isBlocked = !!exception?.is_blocked;
					const ranges = exception?.custom_slots ?? availability[dayKey] ?? [];
					const dayMeetings = meetingsByDate.get(dateStr) || [];
					const isPast = day.isBefore(now, 'day');

					return (
						<Box
							key={dateStr}
							onClick={(e) => !isBlocked && !isPast && handleDayColumnClick(day, e)}
							onDragOver={(e) => handleDayColumnDragOver(day, e)}
							onDrop={(e) => handleDayColumnDrop(day, e)}
							sx={{
								position: 'relative', height: gridHeight, borderLeft: '1px solid', borderColor: 'divider',
								cursor: isBlocked || isPast ? 'default' : 'pointer', opacity: isPast ? 0.5 : 1,
							}}
						>
							{/* Hour gridlines */}
							{hours.map((h) => (
								<Box key={h} sx={{ position: 'absolute', top: (h - startHour) * HOUR_HEIGHT, left: 0, right: 0, borderTop: '1px solid', borderColor: 'divider' }} />
							))}

							{/* Available-hours shading */}
							{!isBlocked && ranges.map((r, i) => (
								<Box
									key={i}
									sx={{
										position: 'absolute', left: 2, right: 2,
										top: timeToY(timeStrToMinutes(r[0])), height: Math.max(4, timeToY(timeStrToMinutes(r[1])) - timeToY(timeStrToMinutes(r[0]))),
										bgcolor: 'success.main', opacity: isDark ? 0.06 : 0.05, borderRadius: 1, pointerEvents: 'none',
									}}
								/>
							))}

							{/* Blocked overlay */}
							{isBlocked && (
								<Box
									sx={{
										position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
										background: `repeating-linear-gradient(135deg, ${isDark ? 'rgba(239,68,68,0.08)' : 'rgba(239,68,68,0.06)'} 0px, ${isDark ? 'rgba(239,68,68,0.08)' : 'rgba(239,68,68,0.06)'} 8px, transparent 8px, transparent 16px)`,
										pointerEvents: 'none',
									}}
								>
									<Typography variant="caption" sx={{ color: 'error.main', fontWeight: 800, bgcolor: 'background.paper', px: 1, borderRadius: 1 }}>
										BLOCKED
									</Typography>
								</Box>
							)}

							{/* Current time indicator */}
							{day.isSame(now, 'day') && now.hour() >= startHour && now.hour() < endHour && (
								<Box sx={{ position: 'absolute', left: 0, right: 0, top: timeToY(now.hour() * 60 + now.minute()), height: 2, bgcolor: 'error.main', zIndex: 2 }}>
									<Box sx={{ position: 'absolute', left: -4, top: -3, width: 8, height: 8, borderRadius: '50%', bgcolor: 'error.main' }} />
								</Box>
							)}

							{/* Meeting blocks */}
							{dayMeetings.map((m) => {
								const start = dayjs(m.start_time);
								const end = dayjs(m.end_time);
								const top = timeToY(start.hour() * 60 + start.minute());
								const rawHeight = timeToY(end.hour() * 60 + end.minute()) - top;
								const height = Math.max(22, rawHeight - 2);
								const compact = height < 38;
								const isBeingDragged = dragState?.meeting.public_id === m.public_id;
								return (
									<Box
										key={m.public_id}
										draggable
										onDragStart={(e) => handleMeetingDragStart(e, m)}
										onDragEnd={handleMeetingDragEnd}
										onClick={(e) => { e.stopPropagation(); setPopoverAnchor(e.currentTarget); setPopoverMeeting(m); }}
										sx={{
											position: 'absolute', left: 3, right: 3, top: top + 1, height,
											display: 'flex',
											flexDirection: compact ? 'row' : 'column',
											alignItems: compact ? 'center' : 'flex-start',
											justifyContent: compact ? 'flex-start' : 'center',
											gap: compact ? 0.5 : 0,
											bgcolor: 'primary.main',
											backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0) 60%)',
											color: '#fff', borderRadius: '8px', pl: 1, pr: 0.75, py: compact ? 0 : 0.5,
											overflow: 'hidden', cursor: 'grab',
											borderLeft: '3px solid rgba(255,255,255,0.55)',
											boxShadow: '0 1px 2px rgba(15,23,42,0.15), 0 4px 10px rgba(139,124,246,0.35)',
											zIndex: 1,
											opacity: isBeingDragged ? 0.35 : 1,
											transition: 'box-shadow 0.15s ease, filter 0.15s ease, opacity 0.15s ease',
											'&:hover': {
												filter: 'brightness(1.06)',
												boxShadow: '0 2px 6px rgba(15,23,42,0.2), 0 8px 20px rgba(139,124,246,0.5)',
												zIndex: 3,
											},
										}}
									>
										<Typography variant="caption" sx={{ fontWeight: 700, lineHeight: 1.2, fontSize: '0.7rem', flexShrink: 0 }} noWrap>
											{start.format('h:mm A')}
										</Typography>
										<Typography variant="caption" sx={{ lineHeight: 1.2, fontSize: '0.7rem', opacity: 0.92, minWidth: 0 }} noWrap>
											{compact ? `· ${m.client_name}` : m.client_name}
										</Typography>
									</Box>
								);
							})}

							{/* Drop-target preview — where the dragged meeting would land in this column */}
							{dragState && dragState.overDateStr === dateStr && dragState.overMinutes !== null && (
								<Box
									sx={{
										position: 'absolute', left: 3, right: 3,
										top: timeToY(dragState.overMinutes) + 1,
										height: Math.max(22, (dragState.durationMinutes / 60) * HOUR_HEIGHT - 2),
										borderRadius: '8px', border: '2px dashed', borderColor: 'primary.main',
										bgcolor: alpha(theme.palette.primary.main, 0.12),
										zIndex: 2, pointerEvents: 'none',
										display: 'flex', alignItems: 'center', px: 1,
									}}
								>
									<Typography variant="caption" fontWeight={700} color="primary.main" noWrap>
										{dayjs().startOf('day').add(dragState.overMinutes, 'minute').format('h:mm A')}
									</Typography>
								</Box>
							)}
						</Box>
					);
				})}
			</Box>

			<Popover
				open={!!popoverAnchor}
				anchorEl={popoverAnchor}
				onClose={() => setPopoverAnchor(null)}
				anchorOrigin={{ vertical: 'center', horizontal: 'right' }}
				transformOrigin={{ vertical: 'center', horizontal: 'left' }}
				slotProps={{
					paper: {
						sx: {
							borderRadius: '18px',
							border: '1px solid', borderColor: 'divider',
							boxShadow: isDark ? '0 12px 32px rgba(0,0,0,0.45)' : '0 12px 32px rgba(15,23,42,0.16)',
							mt: 1,
						},
					},
				}}
			>
				{popoverMeeting && (
					<Box sx={{ width: 300 }}>
						<Box sx={{ p: 2.5, pb: 2 }}>
							<Stack direction="row" alignItems="flex-start" justifyContent="space-between">
								<Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
									<EnterpriseAvatar name={popoverMeeting.client_name} size={40} />
									<Box sx={{ minWidth: 0 }}>
										<Typography variant="subtitle2" fontWeight={800} noWrap>{popoverMeeting.client_name}</Typography>
										<Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
											{popoverMeeting.client_email}
										</Typography>
									</Box>
								</Stack>
								<IconButton size="small" onClick={() => setPopoverAnchor(null)} sx={{ mt: -0.5, mr: -0.5 }}>
									<CloseIcon sx={{ fontSize: 16 }} />
								</IconButton>
							</Stack>

							<Stack direction="row" spacing={1.25} alignItems="center" sx={{ mt: 2, p: 1.25, borderRadius: '12px', bgcolor: 'action.hover' }}>
								<CalendarMonthOutlined sx={{ fontSize: 18, color: 'text.secondary' }} />
								<Box sx={{ minWidth: 0 }}>
									<Typography variant="caption" fontWeight={700} sx={{ display: 'block' }} noWrap>
										{dayjs(popoverMeeting.start_time).format('dddd, MMM D')}
									</Typography>
									<Typography variant="caption" color="text.secondary" noWrap>
										{dayjs(popoverMeeting.start_time).format('h:mm A')} – {dayjs(popoverMeeting.end_time).format('h:mm A')}
									</Typography>
								</Box>
							</Stack>

							<Box sx={{ mt: 1.5 }}>
								<StatusBadge type="googleSync" status={popoverMeeting.calendar_sync_status} label={SYNC_LABEL[popoverMeeting.calendar_sync_status] || popoverMeeting.calendar_sync_status} />
							</Box>
						</Box>

						<Divider />

						<Stack spacing={1} sx={{ p: 2 }}>
							{popoverMeeting.google_meet_link && (
								<Button
									fullWidth variant="contained"
									startIcon={<VideocamOutlined sx={{ fontSize: 16 }} />}
									component="a" href={popoverMeeting.google_meet_link} target="_blank" rel="noreferrer"
									sx={{
										textTransform: 'none', fontWeight: 700, borderRadius: 2.5,
										background: (t) => t.gradients.brandDiagonal,
										boxShadow: (t) => `0 4px 12px 0 ${t.palette.primary.main}4d`,
										'&:hover': { background: (t) => t.gradients.brandDiagonalHover },
									}}
								>
									Join Meeting
								</Button>
							)}
							<Stack direction="row" spacing={1}>
								<Button
									fullWidth size="small" variant="outlined"
									startIcon={<EditOutlined sx={{ fontSize: 15 }} />}
									onClick={() => { onReschedule(popoverMeeting); setPopoverAnchor(null); }}
									sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2.5 }}
								>
									Reschedule
								</Button>
								<Button
									fullWidth size="small" variant="outlined" color="error"
									startIcon={<CloseOutlined sx={{ fontSize: 15 }} />}
									onClick={() => { onCancel(popoverMeeting); setPopoverAnchor(null); }}
									sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2.5 }}
								>
									Cancel
								</Button>
							</Stack>
						</Stack>
					</Box>
				)}
			</Popover>
		</Box>
	);
};

export default WeekCalendarView;
