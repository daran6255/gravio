import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
	Container, Box, Typography, Button, CircularProgress, Paper, TextField, Stack, useTheme, Fade,
} from '@mui/material';
import {
	CheckCircleOutline as CheckCircleIcon,
	ErrorOutline as ErrorIcon,
	CalendarMonthOutlined,
	VideocamOutlined,
	PlaceOutlined,
	PhoneOutlined,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import bookingService from '../../../services/bookingService';
import { useColorMode } from '../../../theme/ThemeContext';
import type { MeetingLocationType, PublicMeetingView } from '../../../models/booking/meeting';

const LOCATION_ICON: Record<MeetingLocationType, React.ReactElement> = {
	google_meet: <VideocamOutlined sx={{ fontSize: 18 }} />,
	offline: <PlaceOutlined sx={{ fontSize: 18 }} />,
	phone: <PhoneOutlined sx={{ fontSize: 18 }} />,
};

type Mode = 'view' | 'reschedule' | 'cancel';

const ManageMeetingPage: React.FC = () => {
	const theme = useTheme();
	const { mode: colorMode } = useColorMode();
	const [searchParams] = useSearchParams();
	const token = searchParams.get('token');

	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [meeting, setMeeting] = useState<PublicMeetingView | null>(null);
	const [mode, setMode] = useState<Mode>('view');
	const [submitting, setSubmitting] = useState(false);
	const [actionError, setActionError] = useState<string | null>(null);
	const [actionMessage, setActionMessage] = useState<string | null>(null);

	const [rescheduleDate, setRescheduleDate] = useState('');
	const [rescheduleTime, setRescheduleTime] = useState('');
	const [cancelReason, setCancelReason] = useState('');

	useEffect(() => {
		if (!token) {
			setError('This meeting link is missing its token.');
			setLoading(false);
			return;
		}
		bookingService.publicGetMeeting(token)
			.then((view) => {
				setMeeting(view);
				const start = new Date(view.start_time);
				setRescheduleDate(start.toISOString().slice(0, 10));
				setRescheduleTime(start.toTimeString().slice(0, 5));
			})
			.catch((err: any) => {
				setError(err?.response?.data?.error?.message || 'This meeting link is invalid or has expired.');
			})
			.finally(() => setLoading(false));
	}, [token]);

	const handleReschedule = async () => {
		if (!token) return;
		const [h, m] = rescheduleTime.split(':').map(Number);
		const newStart = new Date(`${rescheduleDate}T00:00:00`);
		newStart.setHours(h, m, 0, 0);

		setSubmitting(true);
		setActionError(null);
		try {
			const updated = await bookingService.publicRescheduleMeeting(token, newStart.toISOString());
			setMeeting(updated);
			setMode('view');
			setActionMessage('Your meeting has been rescheduled. A new calendar invite has been emailed to you.');
		} catch (err: any) {
			setActionError(err?.response?.data?.error?.message || 'That time is unavailable — please try another.');
		} finally {
			setSubmitting(false);
		}
	};

	const handleCancel = async () => {
		if (!token) return;
		setSubmitting(true);
		setActionError(null);
		try {
			const updated = await bookingService.publicCancelMeeting(token, cancelReason || undefined);
			setMeeting(updated);
			setMode('view');
			setActionMessage('Your meeting has been cancelled.');
		} catch (err: any) {
			setActionError(err?.response?.data?.error?.message || 'Failed to cancel the meeting.');
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<Box
			component="main"
			sx={{
				minHeight: '100vh',
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center',
				backgroundColor: theme.palette.background.default,
				backgroundImage: `radial-gradient(circle at 50% 50%, ${theme.palette.background.default} 0%, ${theme.palette.secondary.dark}20 100%)`,
				position: 'relative',
				overflow: 'hidden',
				py: 6,
			}}
		>
			<Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
				<Box sx={{ mb: 4, textAlign: 'center' }}>
					<Box
						component="img"
						src={colorMode === 'dark' ? '/assets/img/logo/gravit-dark.svg' : '/assets/img/logo/gravit-light.svg'}
						alt="Gravit Logo"
						sx={{ height: 48, mb: 1.5 }}
					/>
				</Box>

				<Fade in timeout={600}>
					<Paper
						elevation={1}
						sx={{
							p: { xs: 3, sm: 5 },
							borderRadius: 2,
							backgroundColor: theme.palette.background.paper,
							border: `1px solid ${theme.palette.divider}`,
							position: 'relative',
							overflow: 'hidden',
						}}
					>
						{loading && (
							<Stack alignItems="center" spacing={2} sx={{ py: 4 }}>
								<CircularProgress size={32} />
								<Typography color="text.secondary">Loading your meeting…</Typography>
							</Stack>
						)}

						{!loading && error && (
							<Stack alignItems="center" spacing={2} sx={{ textAlign: 'center', py: 2 }}>
								<ErrorIcon sx={{ fontSize: 64, color: theme.palette.error.main }} />
								<Typography variant="h6" fontWeight={700}>Link Invalid</Typography>
								<Typography variant="body2" color="text.secondary">{error}</Typography>
							</Stack>
						)}

						{!loading && !error && meeting && (
							<Box>
								<Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>
									{meeting.meeting_title || `Meeting with ${meeting.host_name}`}
								</Typography>
								<Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
									Hosted by {meeting.host_name}
								</Typography>

								{actionMessage && (
									<Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 3, p: 1.5, borderRadius: 1.5, bgcolor: 'success.main', color: '#fff' }}>
										<CheckCircleIcon sx={{ fontSize: 20 }} />
										<Typography variant="body2">{actionMessage}</Typography>
									</Stack>
								)}

								<Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2, p: 1.5, borderRadius: 1.5, bgcolor: 'action.hover' }}>
									<CalendarMonthOutlined sx={{ color: 'text.secondary' }} />
									<Box>
										<Typography variant="body2" fontWeight={600}>
											{dayjs(meeting.start_time).format('dddd, MMMM D, YYYY')}
										</Typography>
										<Typography variant="body2" color="text.secondary">
											{dayjs(meeting.start_time).format('h:mm A')} – {dayjs(meeting.end_time).format('h:mm A')} ({meeting.attendee_timezone})
										</Typography>
									</Box>
								</Stack>

								<Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
									{LOCATION_ICON[meeting.location_type]}
									<Typography variant="body2" color="text.secondary">
										{meeting.location_detail || (
											meeting.location_type === 'offline' ? 'In person'
												: meeting.location_type === 'phone' ? 'Phone call'
												: 'Video call'
										)}
									</Typography>
								</Stack>

								{meeting.status !== 'scheduled' && (
									<Typography variant="body2" sx={{ mb: 2, fontWeight: 600, textTransform: 'capitalize', color: meeting.status === 'cancelled' ? 'error.main' : 'text.secondary' }}>
										This meeting is {meeting.status}.
									</Typography>
								)}

								{actionError && (
									<Box sx={{ mb: 2, p: 1.5, bgcolor: 'rgba(239, 68, 68, 0.1)', color: theme.palette.error.main, borderRadius: 1, fontSize: '0.875rem' }}>
										{actionError}
									</Box>
								)}

								{meeting.status === 'scheduled' && mode === 'view' && (
									<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
										<Button fullWidth variant="contained" onClick={() => setMode('reschedule')} sx={{ textTransform: 'none', fontWeight: 700 }}>
											Reschedule
										</Button>
										<Button fullWidth variant="outlined" color="error" onClick={() => setMode('cancel')} sx={{ textTransform: 'none', fontWeight: 700 }}>
											Cancel Meeting
										</Button>
									</Stack>
								)}

								{meeting.status === 'scheduled' && mode === 'reschedule' && (
									<Stack spacing={2}>
										<TextField
											label="Date" type="date" fullWidth size="small" value={rescheduleDate}
											onChange={(e) => setRescheduleDate(e.target.value)}
											InputLabelProps={{ shrink: true }}
										/>
										<TextField
											label="Start time" type="time" fullWidth size="small" value={rescheduleTime}
											onChange={(e) => setRescheduleTime(e.target.value)}
											InputLabelProps={{ shrink: true }}
										/>
										<Stack direction="row" spacing={1.5}>
											<Button fullWidth variant="outlined" disabled={submitting} onClick={() => setMode('view')} sx={{ textTransform: 'none', fontWeight: 700 }}>
												Back
											</Button>
											<Button fullWidth variant="contained" disabled={submitting} onClick={handleReschedule} sx={{ textTransform: 'none', fontWeight: 700 }}>
												{submitting ? <CircularProgress size={20} color="inherit" /> : 'Confirm New Time'}
											</Button>
										</Stack>
									</Stack>
								)}

								{meeting.status === 'scheduled' && mode === 'cancel' && (
									<Stack spacing={2}>
										<TextField
											label="Reason (optional)" fullWidth multiline minRows={2} value={cancelReason}
											onChange={(e) => setCancelReason(e.target.value)}
										/>
										<Stack direction="row" spacing={1.5}>
											<Button fullWidth variant="outlined" disabled={submitting} onClick={() => setMode('view')} sx={{ textTransform: 'none', fontWeight: 700 }}>
												Back
											</Button>
											<Button fullWidth variant="contained" color="error" disabled={submitting} onClick={handleCancel} sx={{ textTransform: 'none', fontWeight: 700 }}>
												{submitting ? <CircularProgress size={20} color="inherit" /> : 'Confirm Cancellation'}
											</Button>
										</Stack>
									</Stack>
								)}
							</Box>
						)}
					</Paper>
				</Fade>
			</Container>
		</Box>
	);
};

export default ManageMeetingPage;
