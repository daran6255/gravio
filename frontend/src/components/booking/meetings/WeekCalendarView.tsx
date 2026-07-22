import React, { useState } from 'react';
import { Box, Stack, Typography, IconButton, Button, Popover, Divider, useTheme, alpha } from '@mui/material';
import { ChevronLeft, ChevronRight, VideocamOutlined, PlaceOutlined, PhoneOutlined, Close as CloseIcon, EditOutlined, CloseOutlined, CalendarMonthOutlined, CheckCircleOutline, EventBusyOutlined } from '@mui/icons-material';
import dayjs from 'dayjs';
import EnterpriseAvatar from '../../common/avatar/Avatar';
import { responsiveStyles } from '../../../theme';
import bookingService from '../../../services/bookingService';
import useToast from '../../../hooks/useToast';
import { useWeekCalendarView, HOUR_HEIGHT } from './hooks/useWeekCalendarView';
import { MEETING_PAST_GRACE_MINUTES, type ScheduledMeetingHost, type MeetingLocationType, type MeetingStatus } from '../../../models/booking/meeting';

const LOCATION_INFO: Record<MeetingLocationType, { icon: React.ReactElement<{ sx?: object }>; label: string }> = {
	google_meet: { icon: <VideocamOutlined sx={{ fontSize: 18 }} />, label: 'Video call' },
	offline: { icon: <PlaceOutlined sx={{ fontSize: 18 }} />, label: 'In person' },
	phone: { icon: <PhoneOutlined sx={{ fontSize: 18 }} />, label: 'Phone call' },
};

const STATUS_LABEL: Record<MeetingStatus, string> = {
	scheduled: 'Scheduled',
	completed: 'Completed',
	cancelled: 'Cancelled',
};

interface WeekCalendarViewProps {
	meetings: ScheduledMeetingHost[];
	onSlotClick: (dateStr: string, timeStr: string) => void;
	onReschedule: (meeting: ScheduledMeetingHost) => void;
	onCancel: (meeting: ScheduledMeetingHost) => void;
	onComplete: (meeting: ScheduledMeetingHost) => void;
	/** Drag a meeting card onto a new day/time — receives the ISO start time for the drop slot. */
	onMoveMeeting: (meeting: ScheduledMeetingHost, newStartTimeISO: string) => void;
}

const WeekCalendarView: React.FC<WeekCalendarViewProps> = ({
	meetings, onSlotClick, onReschedule, onCancel, onComplete, onMoveMeeting,
}) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const toast = useToast();
	const [joinLoading, setJoinLoading] = useState(false);
	const {
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
	} = useWeekCalendarView({ meetings, onSlotClick, onMoveMeeting });

	// Goes through the same join gate a client/guest gets by email (see
	// bookingService.hostGetMeetingJoinLink) instead of opening the raw video link
	// directly — one enforcement point for the active-window rule and the
	// branding-free embed, regardless of who's joining.
	const handleJoinMeeting = async (meeting: ScheduledMeetingHost) => {
		setJoinLoading(true);
		try {
			const { join_url } = await bookingService.hostGetMeetingJoinLink(meeting.public_id);
			window.open(join_url, '_blank', 'noopener,noreferrer');
		} catch {
			toast.error("Couldn't open the video call — try again in a moment.");
		} finally {
			setJoinLoading(false);
		}
	};

	const cardSx = {
		p: { xs: 2.5, sm: 3 }, borderRadius: '20px',
		bgcolor: 'background.paper',
		border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.04)',
		boxShadow: isDark ? '0 1px 2px rgba(0,0,0,0.4), 0 8px 20px rgba(0,0,0,0.2)' : '0 1px 2px rgba(15,23,42,0.04), 0 8px 20px rgba(15,23,42,0.05)',
	};

	// Scheduled keeps the brand gradient (it's the only status you can still act on);
	// completed and cancelled recede into muted, non-brand tints so a glance at the
	// grid tells you what's still active vs. just historical record.
	const getCardVisuals = (status: MeetingStatus) => {
		if (status === 'cancelled') {
			return {
				background: isDark ? 'rgba(148,163,184,0.16)' : 'rgba(100,116,139,0.12)',
				color: theme.palette.text.secondary,
				border: `1px dashed ${alpha(theme.palette.text.secondary, 0.4)}`,
				boxShadow: 'none',
				strike: true,
			};
		}
		if (status === 'completed') {
			return {
				background: alpha(theme.palette.info.main, isDark ? 0.22 : 0.14),
				color: isDark ? theme.palette.info.light : theme.palette.info.dark,
				border: `1px solid ${alpha(theme.palette.info.main, 0.35)}`,
				boxShadow: 'none',
				strike: false,
			};
		}
		return {
			background: theme.gradients.brandDiagonal,
			color: '#fff',
			border: '1px solid rgba(255,255,255,0.22)',
			boxShadow: '0 1px 3px rgba(15,23,42,0.18), 0 3px 10px rgba(139,124,246,0.38)',
			strike: false,
		};
	};

	const legendItems: { color: string; label: string }[] = [
		{ color: alpha(theme.palette.success.main, isDark ? 0.4 : 0.35), label: 'Open — click to book' },
		{ color: theme.palette.primary.main, label: 'Scheduled' },
		{ color: theme.palette.info.main, label: 'Completed' },
		{ color: theme.palette.text.secondary, label: 'Cancelled' },
		{ color: alpha(theme.palette.text.secondary, 0.3), label: 'Past, nothing logged' },
	];

	return (
		<Box sx={cardSx}>
			{/* Controls */}
			<Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={1.5} sx={{ mb: 2 }}>
				<Stack direction="row" spacing={1} alignItems="center">
					<IconButton size="small" onClick={goToPreviousWeek}><ChevronLeft /></IconButton>
					<Button size="small" variant="outlined" onClick={goToToday} sx={{ textTransform: 'none', borderRadius: 2 }}>
						Today
					</Button>
					<IconButton size="small" onClick={goToNextWeek}><ChevronRight /></IconButton>
					<Typography variant="body2" fontWeight={700} sx={{ ml: 1 }}>{weekLabel}</Typography>
				</Stack>
				<Stack direction="row" spacing={1.5} flexWrap="wrap" rowGap={0.5}>
					{legendItems.map((item) => (
						<Stack key={item.label} direction="row" spacing={0.6} alignItems="center">
							<Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: item.color, flexShrink: 0 }} />
							<Typography variant="caption" color="text.secondary" noWrap>{item.label}</Typography>
						</Stack>
					))}
				</Stack>
			</Stack>

			{/* Grid — horizontally scrollable below its comfortable minimum width instead
			    of squeezing 7 day columns unreadably thin on narrower screens. The hour
			    body covers the full day (12 AM–12 AM), so it scrolls vertically inside a
			    viewport-bound container instead of stretching the whole page to fit 24 hours. */}
			<Box sx={responsiveStyles.scrollX}>
			<Box sx={{ minWidth: 740 }}>
				{/* Header row */}
				<Box sx={{ display: 'grid', gridTemplateColumns: '52px repeat(7, minmax(96px, 1fr))' }}>
					<Box />
					{days.map((day) => {
						const isToday = day.isSame(now, 'day');
						return (
							<Box key={day.format('YYYY-MM-DD')} sx={{ textAlign: 'center', pb: 1 }}>
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
							</Box>
						);
					})}
				</Box>

				{/* Scrollable hour body — bounded to fit the viewport instead of growing the page */}
				<Box sx={{ maxHeight: { xs: 'calc(100dvh - 420px)', sm: 'calc(100vh - 460px)' }, minHeight: 320, overflowY: 'auto' }}>
				<Box sx={{ display: 'grid', gridTemplateColumns: '52px repeat(7, minmax(96px, 1fr))' }}>
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

				{/* Day columns — past dates are view-only (clicking shows a toast instead of
				    opening New Meeting; see isSlotBookable in useWeekCalendarView), so a
				    past day reads as neutral history rather than "open to book". */}
				{days.map((day) => {
					const dateStr = day.format('YYYY-MM-DD');
					const dayMeetings = meetingsByDate.get(dateStr) || [];
					const isPast = day.isBefore(now, 'day');
					const hasNoMeetings = dayMeetings.length === 0;
					const isToday = day.isSame(now, 'day');
					// The bookable cutoff within today (now minus the grace window) — the
					// portion of today's column before this reads as past/neutral too,
					// instead of the whole current day glowing green regardless of the hour.
					const todayCutoff = now.subtract(MEETING_PAST_GRACE_MINUTES, 'minute');
					const todayCutoffMinutes = isToday ? Math.max(0, todayCutoff.hour() * 60 + todayCutoff.minute()) : 0;

					return (
						<Box
							key={dateStr}
							onClick={(e) => handleDayColumnClick(day, e)}
							onDragOver={(e) => handleDayColumnDragOver(day, e)}
							onDrop={(e) => handleDayColumnDrop(day, e)}
							sx={{
								position: 'relative', height: gridHeight, borderLeft: '1px solid', borderColor: 'divider',
								cursor: isPast ? 'not-allowed' : 'pointer',
								// Open/bookable time reads green; past time reads neutral grey.
								bgcolor: isPast
									? alpha(theme.palette.text.secondary, isDark ? 0.05 : 0.04)
									: alpha(theme.palette.success.main, isDark ? 0.07 : 0.055),
							}}
						>
							{/* Past day with nothing logged — make the empty slot legible instead
							    of leaving an unexplained blank column. */}
							{isPast && hasNoMeetings && (
								<Box sx={{ position: 'absolute', top: 8, left: 0, right: 0, textAlign: 'center', pointerEvents: 'none' }}>
									<Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 700, fontSize: '0.62rem' }} noWrap>
										No meetings
									</Typography>
								</Box>
							)}

							{/* Already-elapsed hours of today — covers the green "open" wash up to
							    the bookable cutoff so only genuinely bookable time reads as open. */}
							{isToday && todayCutoffMinutes > 0 && (
								<Box
									sx={{
										position: 'absolute', top: 0, left: 0, right: 0,
										height: timeToY(todayCutoffMinutes),
										bgcolor: alpha(theme.palette.text.secondary, isDark ? 0.05 : 0.04),
										pointerEvents: 'none',
									}}
								/>
							)}

							{/* Hour gridlines */}
							{hours.map((h) => (
								<Box key={h} sx={{ position: 'absolute', top: (h - startHour) * HOUR_HEIGHT, left: 0, right: 0, borderTop: '1px solid', borderColor: 'divider' }} />
							))}

							{/* Current time indicator */}
							{day.isSame(now, 'day') && now.hour() >= startHour && now.hour() < endHour && (
								<Box sx={{ position: 'absolute', left: 0, right: 0, top: timeToY(now.hour() * 60 + now.minute()), height: 2, bgcolor: 'error.main', zIndex: 2 }}>
									<Box sx={{ position: 'absolute', left: -4, top: -3, width: 8, height: 8, borderRadius: '50%', bgcolor: 'error.main' }} />
								</Box>
							)}

							{/* Meeting blocks — scheduled, completed, and cancelled all render here so the
							    grid doubles as a record of what happened in a slot, not just what's booked */}
							{dayMeetings.map((m) => {
								const start = dayjs(m.start_time);
								const end = dayjs(m.end_time);
								const top = timeToY(start.hour() * 60 + start.minute());
								const rawHeight = timeToY(end.hour() * 60 + end.minute()) - top;
								const height = Math.max(22, rawHeight - 2);
								const compact = height < 38;
								const roomy = height >= 56;
								const isBeingDragged = dragState?.meeting.public_id === m.public_id;
								const isDraggable = m.status === 'scheduled';
								const locationIcon = React.cloneElement(LOCATION_INFO[m.location_type].icon, { sx: { fontSize: 12 } });
								const visuals = getCardVisuals(m.status);
								return (
									<Box
										key={m.public_id}
										draggable={isDraggable}
										onDragStart={isDraggable ? (e) => handleMeetingDragStart(e, m) : undefined}
										onDragEnd={isDraggable ? handleMeetingDragEnd : undefined}
										onClick={(e) => { e.stopPropagation(); openPopover(e.currentTarget, m); }}
										sx={{
											position: 'absolute', left: 3, right: 3, top: top + 1, height,
											display: 'flex',
											flexDirection: compact ? 'row' : 'column',
											alignItems: compact ? 'center' : 'flex-start',
											justifyContent: compact ? 'flex-start' : 'center',
											gap: compact ? 0.6 : 0.15,
											background: visuals.background,
											color: visuals.color, borderRadius: '10px', pl: 1.1, pr: 0.85, py: compact ? 0 : 0.6,
											overflow: 'hidden', cursor: isDraggable ? 'grab' : 'pointer',
											border: visuals.border,
											boxShadow: visuals.boxShadow,
											zIndex: 1,
											opacity: isBeingDragged ? 0.35 : 1,
											transition: 'transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease',
											'&:hover': {
												transform: 'translateY(-1px)',
												zIndex: 3,
											},
										}}
									>
										<Stack direction="row" spacing={0.5} alignItems="center" sx={{ minWidth: 0, flexShrink: 0 }}>
											{!compact && locationIcon}
											<Typography
												variant="caption"
												sx={{ fontWeight: 800, lineHeight: 1.25, fontSize: '0.7rem', flexShrink: 0, textDecoration: visuals.strike ? 'line-through' : 'none' }}
												noWrap
											>
												{start.format('h:mm A')}
											</Typography>
										</Stack>
										<Typography
											variant="caption"
											sx={{ lineHeight: 1.25, fontSize: '0.72rem', fontWeight: 600, opacity: 0.96, minWidth: 0, textDecoration: visuals.strike ? 'line-through' : 'none' }}
											noWrap
										>
											{compact ? `· ${m.client_name}` : m.client_name}
										</Typography>
										{roomy && (
											<Typography variant="caption" sx={{ lineHeight: 1.2, fontSize: '0.62rem', opacity: 0.8, minWidth: 0 }} noWrap>
												{m.status === 'scheduled' ? LOCATION_INFO[m.location_type].label : STATUS_LABEL[m.status]}
											</Typography>
										)}
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
			</Box>
			</Box>
			</Box>

			<Popover
				open={!!popoverAnchor}
				anchorEl={popoverAnchor}
				onClose={closePopover}
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
										<Stack direction="row" spacing={0.75} alignItems="center">
											<Typography variant="subtitle2" fontWeight={800} noWrap>{popoverMeeting.client_name}</Typography>
											{popoverMeeting.status !== 'scheduled' && (
												<Box
													sx={{
														px: 0.75, py: 0.15, borderRadius: '6px', flexShrink: 0,
														bgcolor: getCardVisuals(popoverMeeting.status).background,
														color: getCardVisuals(popoverMeeting.status).color,
													}}
												>
													<Typography variant="caption" sx={{ fontWeight: 800, fontSize: '0.6rem', textTransform: 'uppercase' }}>
														{STATUS_LABEL[popoverMeeting.status]}
													</Typography>
												</Box>
											)}
										</Stack>
										<Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
											{popoverMeeting.client_email}
										</Typography>
									</Box>
								</Stack>
								<IconButton size="small" onClick={closePopover} sx={{ mt: -0.5, mr: -0.5 }}>
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

							<Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1.5 }}>
								{LOCATION_INFO[popoverMeeting.location_type].icon}
								<Typography variant="caption" color="text.secondary" noWrap>
									{popoverMeeting.location_detail || LOCATION_INFO[popoverMeeting.location_type].label}
								</Typography>
							</Stack>

							{popoverMeeting.status === 'cancelled' && popoverMeeting.cancellation_reason && (
								<Stack direction="row" spacing={1} alignItems="flex-start" sx={{ mt: 1.5 }}>
									<EventBusyOutlined sx={{ fontSize: 16, color: 'text.secondary', mt: 0.15 }} />
									<Typography variant="caption" color="text.secondary">
										{popoverMeeting.cancellation_reason}
									</Typography>
								</Stack>
							)}
							{popoverMeeting.status === 'completed' && popoverMeeting.outcome_notes && (
								<Stack direction="row" spacing={1} alignItems="flex-start" sx={{ mt: 1.5 }}>
									<CheckCircleOutline sx={{ fontSize: 16, color: 'text.secondary', mt: 0.15 }} />
									<Typography variant="caption" color="text.secondary">
										{popoverMeeting.outcome_notes}
									</Typography>
								</Stack>
							)}
						</Box>

						{popoverMeeting.status === 'scheduled' && <Divider />}

						{popoverMeeting.status === 'scheduled' && (
						<Stack spacing={1} sx={{ p: 2 }}>
							{popoverMeeting.location_type === 'google_meet' && popoverMeeting.location_detail && (
								<Button
									fullWidth variant="contained"
									startIcon={<VideocamOutlined sx={{ fontSize: 16 }} />}
									onClick={() => handleJoinMeeting(popoverMeeting)}
									disabled={joinLoading}
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
							{dayjs(popoverMeeting.start_time).isBefore(now) && (
								<Button
									fullWidth size="small" variant="outlined" color="success"
									startIcon={<CheckCircleOutline sx={{ fontSize: 15 }} />}
									onClick={() => { onComplete(popoverMeeting); closePopover(); }}
									sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2.5 }}
								>
									Mark Completed
								</Button>
							)}
							<Stack direction="row" spacing={1}>
								<Button
									fullWidth size="small" variant="outlined"
									startIcon={<EditOutlined sx={{ fontSize: 15 }} />}
									onClick={() => { onReschedule(popoverMeeting); closePopover(); }}
									sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2.5 }}
								>
									Reschedule
								</Button>
								<Button
									fullWidth size="small" variant="outlined" color="error"
									startIcon={<CloseOutlined sx={{ fontSize: 15 }} />}
									onClick={() => { onCancel(popoverMeeting); closePopover(); }}
									sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2.5 }}
								>
									Cancel
								</Button>
							</Stack>
						</Stack>
						)}
					</Box>
				)}
			</Popover>
		</Box>
	);
};

export default WeekCalendarView;
