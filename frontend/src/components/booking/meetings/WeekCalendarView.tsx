import React, { useMemo, useState } from 'react';
import { Box, Stack, Typography, IconButton, Button, Popover, Divider, Tooltip, useTheme } from '@mui/material';
import { ChevronLeft, ChevronRight, VideocamOutlined, BlockOutlined, LockOpenOutlined } from '@mui/icons-material';
import dayjs, { type Dayjs } from 'dayjs';
import StatusBadge from '../../common/badge/StatusBadge';
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
}

function timeStrToMinutes(t: string): number {
	const [h, m] = t.split(':').map(Number);
	return h * 60 + m;
}

const WeekCalendarView: React.FC<WeekCalendarViewProps> = ({
	bookingPage, meetings, exceptions, onSlotClick, onToggleBlockDay, onReschedule, onCancel,
}) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const [weekStart, setWeekStart] = useState<Dayjs>(dayjs().startOf('day').subtract(dayjs().day(), 'day'));
	const [popoverAnchor, setPopoverAnchor] = useState<HTMLElement | null>(null);
	const [popoverMeeting, setPopoverMeeting] = useState<ScheduledMeetingHost | null>(null);

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
								const height = Math.max(20, timeToY(end.hour() * 60 + end.minute()) - top);
								return (
									<Box
										key={m.public_id}
										onClick={(e) => { e.stopPropagation(); setPopoverAnchor(e.currentTarget); setPopoverMeeting(m); }}
										sx={{
											position: 'absolute', left: 2, right: 2, top, height,
											bgcolor: 'primary.main', color: '#fff', borderRadius: 1.5, px: 0.75, py: 0.25,
											overflow: 'hidden', cursor: 'pointer', boxShadow: '0 2px 8px rgba(139,124,246,0.4)',
											border: '1px solid rgba(255,255,255,0.2)', zIndex: 1,
											transition: 'transform 0.15s ease',
											'&:hover': { transform: 'scale(1.02)', zIndex: 3 },
										}}
									>
										<Typography variant="caption" sx={{ fontWeight: 700, display: 'block', lineHeight: 1.2, fontSize: '0.68rem' }} noWrap>
											{start.format('h:mm A')}
										</Typography>
										<Typography variant="caption" sx={{ display: 'block', lineHeight: 1.2, fontSize: '0.68rem' }} noWrap>
											{m.client_name}
										</Typography>
									</Box>
								);
							})}
						</Box>
					);
				})}
			</Box>

			<Popover
				open={!!popoverAnchor}
				anchorEl={popoverAnchor}
				onClose={() => setPopoverAnchor(null)}
				anchorOrigin={{ vertical: 'center', horizontal: 'right' }}
			>
				{popoverMeeting && (
					<Box sx={{ p: 2, width: 260 }}>
						<Typography variant="body2" fontWeight={700}>{popoverMeeting.client_name}</Typography>
						<Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>{popoverMeeting.client_email}</Typography>
						<Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
							{dayjs(popoverMeeting.start_time).format('dddd, MMM D · h:mm A')} – {dayjs(popoverMeeting.end_time).format('h:mm A')}
						</Typography>
						<StatusBadge type="googleSync" status={popoverMeeting.calendar_sync_status} label={SYNC_LABEL[popoverMeeting.calendar_sync_status] || popoverMeeting.calendar_sync_status} />
						<Divider sx={{ my: 1.5 }} />
						<Stack spacing={1}>
							{popoverMeeting.google_meet_link && (
								<Button size="small" variant="outlined" startIcon={<VideocamOutlined sx={{ fontSize: 15 }} />} component="a" href={popoverMeeting.google_meet_link} target="_blank" rel="noreferrer" sx={{ textTransform: 'none' }}>
									Join Meeting
								</Button>
							)}
							<Stack direction="row" spacing={1}>
								<Button size="small" fullWidth onClick={() => { onReschedule(popoverMeeting); setPopoverAnchor(null); }} sx={{ textTransform: 'none' }}>
									Reschedule
								</Button>
								<Button size="small" fullWidth color="error" onClick={() => { onCancel(popoverMeeting); setPopoverAnchor(null); }} sx={{ textTransform: 'none' }}>
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
