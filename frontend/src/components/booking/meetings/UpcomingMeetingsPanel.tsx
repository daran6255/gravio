import React, { useMemo } from 'react';
import { Box, Stack, Typography, IconButton, Tooltip, Chip, Divider, useTheme, alpha } from '@mui/material';
import { VideocamOutlined, EditOutlined, CloseOutlined, EventBusyOutlined, ScheduleOutlined } from '@mui/icons-material';
import dayjs, { type Dayjs } from 'dayjs';
import EnterpriseAvatar from '../../common/avatar/Avatar';
import type { ScheduledMeetingHost } from '../../../models/booking/meeting';

interface UpcomingMeetingsPanelProps {
	meetings: ScheduledMeetingHost[];
	onReschedule: (meeting: ScheduledMeetingHost) => void;
	onCancel: (meeting: ScheduledMeetingHost) => void;
}

function formatDuration(totalMinutes: number): string {
	const h = Math.floor(totalMinutes / 60);
	const m = Math.round(totalMinutes % 60);
	if (h <= 0) return `${m}m`;
	return m ? `${h}h ${m}m` : `${h}h`;
}

/** Short, situational label for a still-ahead meeting: "In progress", "In 25m",
 * "Tomorrow", or a plain weekday for anything further out. */
function meetingWhenLabel(m: ScheduledMeetingHost, now: Dayjs): string {
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

function dayGroupLabel(dateStr: string, now: Dayjs): string {
	const d = dayjs(dateStr);
	if (d.isSame(now, 'day')) return 'Today';
	if (d.isSame(now.add(1, 'day'), 'day')) return 'Tomorrow';
	return d.format('dddd, MMM D');
}

const UpcomingMeetingsPanel: React.FC<UpcomingMeetingsPanelProps> = ({ meetings, onReschedule, onCancel }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const now = dayjs();

	const cardSx = {
		p: { xs: 2.5, sm: 3 }, borderRadius: '20px', height: '100%',
		bgcolor: 'background.paper',
		border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.04)',
		boxShadow: isDark ? '0 1px 2px rgba(0,0,0,0.4), 0 8px 20px rgba(0,0,0,0.2)' : '0 1px 2px rgba(15,23,42,0.04), 0 8px 20px rgba(15,23,42,0.05)',
	};

	const upcoming = useMemo(() => {
		// From the start of today onward — not just "hasn't ended yet" — so a meeting
		// scheduled earlier today still shows up here (and stays reschedulable/
		// cancellable) instead of disappearing the moment it ends.
		const startOfToday = dayjs().startOf('day');
		return meetings
			.filter((m) => m.status === 'scheduled' && !dayjs(m.start_time).isBefore(startOfToday))
			.sort((a, b) => dayjs(a.start_time).diff(dayjs(b.start_time)));
	}, [meetings]);

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

	return (
		<Box sx={cardSx}>
			<Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
				<Typography variant="subtitle2" fontWeight={800}>Upcoming Meetings</Typography>
				<Chip label={upcoming.length} size="small" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }} />
			</Stack>

			<Stack direction="row" spacing={1.25} sx={{ mb: 2.5 }}>
				<Box sx={{ flex: 1, p: 1.25, borderRadius: '12px', bgcolor: 'action.hover' }}>
					<Typography variant="h6" fontWeight={800} lineHeight={1.2}>{todayCount}</Typography>
					<Typography variant="caption" color="text.secondary">Today</Typography>
				</Box>
				<Box sx={{ flex: 1, p: 1.25, borderRadius: '12px', bgcolor: 'action.hover' }}>
					<Typography variant="h6" fontWeight={800} lineHeight={1.2}>{weekStats.count}</Typography>
					<Typography variant="caption" color="text.secondary">This Week</Typography>
				</Box>
				<Box sx={{ flex: 1, p: 1.25, borderRadius: '12px', bgcolor: 'action.hover' }}>
					<Typography variant="h6" fontWeight={800} lineHeight={1.2}>{weekStats.hours}</Typography>
					<Typography variant="caption" color="text.secondary">Booked</Typography>
				</Box>
			</Stack>

			{nextMeeting && (
				<Stack
					direction="row" spacing={1.25} alignItems="center"
					sx={{
						mb: 2.5, p: 1.25, borderRadius: '14px',
						bgcolor: alpha(theme.palette.primary.main, isDark ? 0.14 : 0.08),
						border: '1px solid', borderColor: alpha(theme.palette.primary.main, isDark ? 0.3 : 0.18),
					}}
				>
					<EnterpriseAvatar name={nextMeeting.client_name} size={36} />
					<Box sx={{ minWidth: 0, flex: 1 }}>
						<Typography variant="body2" fontWeight={700} noWrap>{nextMeeting.client_name}</Typography>
						<Typography variant="caption" color="text.secondary" noWrap>
							{dayjs(nextMeeting.start_time).format('ddd, MMM D · h:mm A')}
						</Typography>
					</Box>
					<Chip
						icon={<ScheduleOutlined sx={{ fontSize: 14 }} />}
						label={meetingWhenLabel(nextMeeting, now)}
						size="small" color="primary"
						sx={{ fontWeight: 700, fontSize: '0.7rem' }}
					/>
				</Stack>
			)}

			{groups.length === 0 ? (
				<Stack spacing={1} alignItems="center" sx={{ py: 4, textAlign: 'center' }}>
					<EventBusyOutlined sx={{ fontSize: 28, color: 'text.disabled' }} />
					<Typography variant="caption" color="text.secondary">No upcoming meetings scheduled.</Typography>
				</Stack>
			) : (
				<Stack sx={{ maxHeight: 460, overflowY: 'auto' }}>
					{groups.map(([dateKey, dayMeetings], groupIdx) => (
						<Box key={dateKey} sx={{ mb: groupIdx < groups.length - 1 ? 1 : 0 }}>
							<Typography
								variant="caption"
								sx={{ display: 'block', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.04em', mt: groupIdx > 0 ? 1.5 : 0, mb: 0.5 }}
							>
								{dayGroupLabel(dateKey, now)}
							</Typography>
							<Stack divider={<Divider />}>
								{dayMeetings.map((m) => (
									<Stack key={m.public_id} direction="row" spacing={1.25} alignItems="center" sx={{ py: 1.25 }}>
										<EnterpriseAvatar name={m.client_name} size={32} />
										<Box sx={{ minWidth: 0, flex: 1 }}>
											<Typography variant="body2" fontWeight={700} noWrap>{m.client_name}</Typography>
											<Stack direction="row" spacing={0.75} alignItems="center">
												<Typography variant="caption" color="text.secondary" noWrap>
													{dayjs(m.start_time).format('h:mm A')}
												</Typography>
												{dayjs(m.start_time).isSame(now, 'day') && (
													<Typography
														variant="caption"
														sx={{
															fontWeight: 700, fontSize: '0.68rem',
															color: now.isAfter(dayjs(m.start_time)) && now.isBefore(dayjs(m.end_time)) ? 'success.main' : 'primary.main',
														}}
													>
														· {meetingWhenLabel(m, now)}
													</Typography>
												)}
											</Stack>
										</Box>
										<Stack direction="row" spacing={0.25}>
											{m.location_type === 'google_meet' && m.location_detail && (
												<Tooltip title="Join meeting">
													<IconButton size="small" component="a" href={m.location_detail} target="_blank" rel="noreferrer">
														<VideocamOutlined sx={{ fontSize: 16 }} />
													</IconButton>
												</Tooltip>
											)}
											<Tooltip title="Reschedule">
												<IconButton size="small" onClick={() => onReschedule(m)}>
													<EditOutlined sx={{ fontSize: 16 }} />
												</IconButton>
											</Tooltip>
											<Tooltip title="Cancel">
												<IconButton size="small" color="error" onClick={() => onCancel(m)}>
													<CloseOutlined sx={{ fontSize: 16 }} />
												</IconButton>
											</Tooltip>
										</Stack>
									</Stack>
								))}
							</Stack>
						</Box>
					))}
				</Stack>
			)}
		</Box>
	);
};

export default UpcomingMeetingsPanel;
