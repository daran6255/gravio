import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
	Container, Box, Typography, Button, CircularProgress, Paper, TextField, Stack, useTheme, Fade, alpha, IconButton,
} from '@mui/material';
import {
	CheckCircleOutline as CheckCircleIcon,
	ErrorOutline as ErrorIcon,
	CalendarMonthOutlined,
	VideocamOutlined,
	PlaceOutlined,
	PhoneOutlined,
	ChevronLeft as PrevIcon,
	ChevronRight as NextIcon,
	ArrowBackOutlined,
} from '@mui/icons-material';
import bookingService from '../../../services/bookingService';
import { useColorMode } from '../../../theme/ThemeContext';
import type { MeetingLocationType, PublicAvailabilityView, PublicBookingConfirmation } from '../../../models/booking/meeting';

const LOCATION_ICON: Record<MeetingLocationType, React.ReactElement> = {
	google_meet: <VideocamOutlined sx={{ fontSize: 18 }} />,
	offline: <PlaceOutlined sx={{ fontSize: 18 }} />,
	phone: <PhoneOutlined sx={{ fontSize: 18 }} />,
};

const BROWSER_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

function generateIdempotencyKey(): string {
	if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
	return `key-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function toDateStr(d: Date): string {
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const DAY_STRIP_SIZE = 7;

const BookingPage: React.FC = () => {
	const theme = useTheme();
	const { mode: colorMode } = useColorMode();
	const [searchParams] = useSearchParams();
	const token = searchParams.get('token');

	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [availability, setAvailability] = useState<PublicAvailabilityView | null>(null);

	const [stripStart, setStripStart] = useState(0); // offset in days from today
	const [selectedDate, setSelectedDate] = useState<string>(() => toDateStr(new Date()));
	const [slots, setSlots] = useState<string[]>([]);
	const [slotsLoading, setSlotsLoading] = useState(false);
	const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

	const [clientName, setClientName] = useState('');
	const [clientEmail, setClientEmail] = useState('');
	const [notes, setNotes] = useState('');
	const [booking, setBooking] = useState(false);
	const [bookingError, setBookingError] = useState<string | null>(null);
	const [confirmation, setConfirmation] = useState<PublicBookingConfirmation | null>(null);

	const idempotencyKey = useMemo(generateIdempotencyKey, [token]);

	useEffect(() => {
		if (!token) {
			setError('This booking link is missing its token.');
			setLoading(false);
			return;
		}
		bookingService.publicGetAvailability(token)
			.then(setAvailability)
			.catch((err: any) => {
				setError(err?.response?.data?.error?.message || 'This booking link is invalid or is no longer active.');
			})
			.finally(() => setLoading(false));
	}, [token]);

	const dayStrip = useMemo(() => {
		const days: Date[] = [];
		for (let i = 0; i < DAY_STRIP_SIZE; i++) {
			const d = new Date();
			d.setDate(d.getDate() + stripStart + i);
			days.push(d);
		}
		return days;
	}, [stripStart]);

	const maxStripStart = availability ? Math.max(0, availability.booking_window_days - DAY_STRIP_SIZE) : 0;

	useEffect(() => {
		if (!token || !availability) return;
		setSlotsLoading(true);
		setSelectedSlot(null);
		bookingService.publicGetAvailableSlots(token, selectedDate)
			.then((res) => setSlots(res.slots))
			.catch(() => setSlots([]))
			.finally(() => setSlotsLoading(false));
	}, [token, selectedDate, availability]);

	const handleConfirmBooking = async () => {
		if (!token || !selectedSlot) return;
		if (!clientName.trim() || !clientEmail.trim()) {
			setBookingError("Fill in your name and email.");
			return;
		}
		setBooking(true);
		setBookingError(null);
		try {
			const result = await bookingService.publicBookSlot(token, {
				start_time: selectedSlot,
				client_name: clientName.trim(),
				client_email: clientEmail.trim(),
				attendee_timezone: BROWSER_TZ,
				notes: notes.trim() || undefined,
				idempotency_key: idempotencyKey,
			});
			setConfirmation(result);
		} catch (err: any) {
			setBookingError(err?.response?.data?.error?.message || 'That slot was just taken -- please pick another time.');
			setSelectedSlot(null);
		} finally {
			setBooking(false);
		}
	};

	const locationText = availability
		? (availability.location_type === 'offline' ? 'In person'
			: availability.location_type === 'phone' ? 'Phone call'
			: 'Video call')
		: '';

	return (
		<Box
			component="main"
			sx={{
				minHeight: '100vh',
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				backgroundColor: theme.palette.background.default,
				backgroundImage: `radial-gradient(circle at 50% 50%, ${theme.palette.background.default} 0%, ${theme.palette.secondary.dark}20 100%)`,
				py: 6,
			}}
		>
			<Container maxWidth="sm">
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
						}}
					>
						{loading && (
							<Stack alignItems="center" spacing={2} sx={{ py: 4 }}>
								<CircularProgress size={32} />
								<Typography color="text.secondary">Loading availability…</Typography>
							</Stack>
						)}

						{!loading && error && (
							<Stack alignItems="center" spacing={2} sx={{ textAlign: 'center', py: 2 }}>
								<ErrorIcon sx={{ fontSize: 64, color: theme.palette.error.main }} />
								<Typography variant="h6" fontWeight={700}>Link Invalid</Typography>
								<Typography variant="body2" color="text.secondary">{error}</Typography>
							</Stack>
						)}

						{!loading && !error && confirmation && (
							<Stack alignItems="center" spacing={2} sx={{ textAlign: 'center', py: 2 }}>
								<CheckCircleIcon sx={{ fontSize: 64, color: theme.palette.success.main }} />
								<Typography variant="h6" fontWeight={700}>Booking Confirmed</Typography>
								<Typography variant="body2" color="text.secondary">
									{confirmation.meeting.meeting_title || 'Your meeting'} with {confirmation.meeting.host_name}
								</Typography>
								<Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 1, p: 1.5, borderRadius: 1.5, bgcolor: 'action.hover', width: '100%', justifyContent: 'center' }}>
									<CalendarMonthOutlined sx={{ color: 'text.secondary' }} />
									<Box>
										<Typography variant="body2" fontWeight={600}>
											{new Date(confirmation.meeting.start_time).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
										</Typography>
										<Typography variant="body2" color="text.secondary">
											{new Date(confirmation.meeting.start_time).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
											{' – '}
											{new Date(confirmation.meeting.end_time).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
											{' '}({BROWSER_TZ})
										</Typography>
									</Box>
								</Stack>
								<Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
									A calendar invite has been emailed to you.
								</Typography>
								<Button
									fullWidth variant="outlined"
									onClick={() => window.open(confirmation.manage_link, '_blank', 'noopener,noreferrer')}
									sx={{ mt: 1, textTransform: 'none', fontWeight: 700 }}
								>
									Manage This Meeting
								</Button>
							</Stack>
						)}

						{!loading && !error && !confirmation && availability && (
							<Box>
								<Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>
									{availability.meeting_type_name} with {availability.host_name}
								</Typography>
								<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
									<Typography variant="body2" color="text.secondary">{availability.duration_minutes} min</Typography>
									<Stack direction="row" spacing={0.5} alignItems="center">
										{LOCATION_ICON[availability.location_type]}
										<Typography variant="body2" color="text.secondary">{locationText}</Typography>
									</Stack>
								</Stack>

								{!selectedSlot ? (
									<>
										<Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
											<Typography variant="subtitle2" fontWeight={700}>Pick a date</Typography>
											<Stack direction="row" spacing={0.5}>
												<IconButton size="small" disabled={stripStart <= 0} onClick={() => setStripStart((s) => Math.max(0, s - DAY_STRIP_SIZE))}>
													<PrevIcon fontSize="small" />
												</IconButton>
												<IconButton size="small" disabled={stripStart >= maxStripStart} onClick={() => setStripStart((s) => Math.min(maxStripStart, s + DAY_STRIP_SIZE))}>
													<NextIcon fontSize="small" />
												</IconButton>
											</Stack>
										</Stack>
										<Stack direction="row" spacing={1} sx={{ mb: 3, overflowX: 'auto', pb: 0.5 }}>
											{dayStrip.map((d) => {
												const dateStr = toDateStr(d);
												const isSelected = dateStr === selectedDate;
												return (
													<Box
														key={dateStr}
														onClick={() => setSelectedDate(dateStr)}
														sx={{
															flexShrink: 0, width: 56, py: 1, borderRadius: 2, textAlign: 'center', cursor: 'pointer',
															border: '1px solid', borderColor: isSelected ? 'primary.main' : 'divider',
															bgcolor: isSelected ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
															'&:hover': { borderColor: 'primary.main' },
														}}
													>
														<Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 700 }}>
															{d.toLocaleDateString(undefined, { weekday: 'short' })}
														</Typography>
														<Typography variant="body2" fontWeight={800} color={isSelected ? 'primary.main' : 'text.primary'}>
															{d.getDate()}
														</Typography>
													</Box>
												);
											})}
										</Stack>

										<Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
											Available times ({BROWSER_TZ})
										</Typography>
										{slotsLoading ? (
											<Stack alignItems="center" sx={{ py: 3 }}><CircularProgress size={24} /></Stack>
										) : slots.length === 0 ? (
											<Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
												No open slots on this date — try another day.
											</Typography>
										) : (
											<Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
												{slots.map((slot) => (
													<Button
														key={slot}
														variant="outlined"
														onClick={() => setSelectedSlot(slot)}
														sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 1.5 }}
													>
														{new Date(slot).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
													</Button>
												))}
											</Box>
										)}
									</>
								) : (
									<Stack spacing={2}>
										<Button
											size="small"
											startIcon={<ArrowBackOutlined fontSize="small" />}
											onClick={() => setSelectedSlot(null)}
											sx={{ alignSelf: 'flex-start', textTransform: 'none', fontWeight: 700 }}
										>
											Back to times
										</Button>
										<Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: 'action.hover' }}>
											<Typography variant="body2" fontWeight={700}>
												{new Date(selectedSlot).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
											</Typography>
											<Typography variant="body2" color="text.secondary">
												{new Date(selectedSlot).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })} ({BROWSER_TZ})
											</Typography>
										</Box>

										{bookingError && (
											<Box sx={{ p: 1.5, bgcolor: 'rgba(239, 68, 68, 0.1)', color: theme.palette.error.main, borderRadius: 1, fontSize: '0.875rem' }}>
												{bookingError}
											</Box>
										)}

										<TextField label="Your Name" fullWidth size="small" value={clientName} onChange={(e) => setClientName(e.target.value)} required />
										<TextField label="Your Email" type="email" fullWidth size="small" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} required />
										<TextField label="Notes (optional)" fullWidth multiline minRows={2} size="small" value={notes} onChange={(e) => setNotes(e.target.value)} />

										<Button
											fullWidth variant="contained" disabled={booking} onClick={handleConfirmBooking}
											sx={{ textTransform: 'none', fontWeight: 700 }}
										>
											{booking ? <CircularProgress size={20} color="inherit" /> : 'Confirm Booking'}
										</Button>
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

export default BookingPage;
