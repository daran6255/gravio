import React from 'react';
import { Box, Stack, Typography, IconButton, Button, Popover, Divider, useTheme, alpha } from '@mui/material';
import { ChevronLeft, ChevronRight, VideocamOutlined, PlaceOutlined, PhoneOutlined, Close as CloseIcon, EditOutlined, CloseOutlined, CalendarMonthOutlined, CheckCircleOutline } from '@mui/icons-material';
import dayjs from 'dayjs';
import EnterpriseAvatar from '../../common/avatar/Avatar';
import { responsiveStyles } from '../../../theme';
import { useWeekCalendarView, HOUR_HEIGHT } from './hooks/useWeekCalendarView';
import type { ScheduledMeetingHost, MeetingLocationType } from '../../../models/booking/meeting';

const LOCATION_INFO: Record<MeetingLocationType, { icon: React.ReactElement<{ sx?: object }>; label: string }> = {
	google_meet: { icon: <VideocamOutlined sx={{ fontSize: 18 }} />, label: 'Video call' },
	offline: { icon: <PlaceOutlined sx={{ fontSize: 18 }} />, label: 'In person' },
	phone: { icon: <PhoneOutlined sx={{ fontSize: 18 }} />, label: 'Phone call' },
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

	const cardSx = {
		p: { xs: 2.5, sm: 3 }, borderRadius: '20px',
		bgcolor: 'background.paper',
		border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.04)',
		boxShadow: isDark ? '0 1px 2px rgba(0,0,0,0.4), 0 8px 20px rgba(0,0,0,0.2)' : '0 1px 2px rgba(15,23,42,0.04), 0 8px 20px rgba(15,23,42,0.05)',
	};

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
				<Typography variant="caption" color="text.secondary">Click any slot to schedule a meeting, or drag a meeting to move it.</Typography>
			</Stack>

			{/* Grid — horizontally scrollable below its comfortable minimum width instead
			    of squeezing 7 day columns unreadably thin on narrower screens */}
			<Box sx={responsiveStyles.scrollX}>
			<Box sx={{ display: 'grid', gridTemplateColumns: '52px repeat(7, minmax(96px, 1fr))', minWidth: 740 }}>
				{/* Header row */}
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
					const dayMeetings = meetingsByDate.get(dateStr) || [];
					const isPast = day.isBefore(now, 'day');

					return (
						<Box
							key={dateStr}
							onClick={(e) => handleDayColumnClick(day, e)}
							onDragOver={(e) => handleDayColumnDragOver(day, e)}
							onDrop={(e) => handleDayColumnDrop(day, e)}
							sx={{
								position: 'relative', height: gridHeight, borderLeft: '1px solid', borderColor: 'divider',
								cursor: 'pointer', opacity: isPast ? 0.5 : 1,
							}}
						>
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

							{/* Meeting blocks */}
							{dayMeetings.map((m) => {
								const start = dayjs(m.start_time);
								const end = dayjs(m.end_time);
								const top = timeToY(start.hour() * 60 + start.minute());
								const rawHeight = timeToY(end.hour() * 60 + end.minute()) - top;
								const height = Math.max(22, rawHeight - 2);
								const compact = height < 38;
								const roomy = height >= 56;
								const isBeingDragged = dragState?.meeting.public_id === m.public_id;
								const locationIcon = React.cloneElement(LOCATION_INFO[m.location_type].icon, { sx: { fontSize: 12 } });
								return (
									<Box
										key={m.public_id}
										draggable
										onDragStart={(e) => handleMeetingDragStart(e, m)}
										onDragEnd={handleMeetingDragEnd}
										onClick={(e) => { e.stopPropagation(); openPopover(e.currentTarget, m); }}
										sx={{
											position: 'absolute', left: 3, right: 3, top: top + 1, height,
											display: 'flex',
											flexDirection: compact ? 'row' : 'column',
											alignItems: compact ? 'center' : 'flex-start',
											justifyContent: compact ? 'flex-start' : 'center',
											gap: compact ? 0.6 : 0.15,
											background: (t) => t.gradients.brandDiagonal,
											color: '#fff', borderRadius: '10px', pl: 1.1, pr: 0.85, py: compact ? 0 : 0.6,
											overflow: 'hidden', cursor: 'grab',
											border: '1px solid rgba(255,255,255,0.22)',
											boxShadow: '0 1px 3px rgba(15,23,42,0.18), 0 3px 10px rgba(139,124,246,0.38)',
											zIndex: 1,
											opacity: isBeingDragged ? 0.35 : 1,
											transition: 'transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease',
											'&:hover': {
												transform: 'translateY(-1px)',
												boxShadow: '0 3px 6px rgba(15,23,42,0.22), 0 8px 18px rgba(139,124,246,0.5)',
												zIndex: 3,
											},
										}}
									>
										<Stack direction="row" spacing={0.5} alignItems="center" sx={{ minWidth: 0, flexShrink: 0 }}>
											{!compact && locationIcon}
											<Typography variant="caption" sx={{ fontWeight: 800, lineHeight: 1.25, fontSize: '0.7rem', flexShrink: 0 }} noWrap>
												{start.format('h:mm A')}
											</Typography>
										</Stack>
										<Typography variant="caption" sx={{ lineHeight: 1.25, fontSize: '0.72rem', fontWeight: 600, opacity: 0.96, minWidth: 0 }} noWrap>
											{compact ? `· ${m.client_name}` : m.client_name}
										</Typography>
										{roomy && (
											<Typography variant="caption" sx={{ lineHeight: 1.2, fontSize: '0.62rem', opacity: 0.8, minWidth: 0 }} noWrap>
												{LOCATION_INFO[m.location_type].label}
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
										<Typography variant="subtitle2" fontWeight={800} noWrap>{popoverMeeting.client_name}</Typography>
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
						</Box>

						<Divider />

						<Stack spacing={1} sx={{ p: 2 }}>
							{popoverMeeting.location_type === 'google_meet' && popoverMeeting.location_detail && (
								<Button
									fullWidth variant="contained"
									startIcon={<VideocamOutlined sx={{ fontSize: 16 }} />}
									component="a" href={popoverMeeting.location_detail} target="_blank" rel="noreferrer"
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
					</Box>
				)}
			</Popover>
		</Box>
	);
};

export default WeekCalendarView;
