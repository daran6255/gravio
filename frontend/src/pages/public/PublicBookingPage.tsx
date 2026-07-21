import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
	Container,
	Paper,
	Box,
	Typography,
	Grid,
	Button,
	TextField,
	Chip,
	CircularProgress,
	Divider,
} from '@mui/material';
import { EventOutlined, VideocamOutlined, PlaceOutlined, PhoneOutlined } from '@mui/icons-material';
import bookingService from '../../services/bookingService';
import type { BookingPagePublic } from '../../models/booking/bookingPage';
import type { AvailableSlot, ScheduledMeeting } from '../../models/booking/meeting';

const BROWSER_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

const LOCATION_ICON: Record<string, React.ReactNode> = {
	google_meet: <VideocamOutlined fontSize="small" />,
	offline: <PlaceOutlined fontSize="small" />,
	phone: <PhoneOutlined fontSize="small" />,
};

function generateIdempotencyKey(): string {
	if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
	return `key-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

const PublicBookingPage: React.FC = () => {
	const { slug = '' } = useParams();
	const [loading, setLoading] = useState(true);
	const [notFound, setNotFound] = useState(false);
	const [page, setPage] = useState<BookingPagePublic | null>(null);

	const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
	const [slots, setSlots] = useState<AvailableSlot[]>([]);
	const [slotsLoading, setSlotsLoading] = useState(false);
	const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);

	const [clientName, setClientName] = useState('');
	const [clientEmail, setClientEmail] = useState('');
	const [notes, setNotes] = useState('');
	const [submitting, setSubmitting] = useState(false);
	const [confirmed, setConfirmed] = useState<ScheduledMeeting | null>(null);
	const [error, setError] = useState<string | null>(null);
	// Stable across retries of the same submit — generated once per page load,
	// so a double-click or network retry can never create a duplicate booking.
	const idempotencyKey = useMemo(generateIdempotencyKey, []);

	useEffect(() => {
		(async () => {
			try {
				setPage(await bookingService.getPublicBookingPage(slug));
			} catch {
				setNotFound(true);
			} finally {
				setLoading(false);
			}
		})();
	}, [slug]);

	useEffect(() => {
		if (!page) return;
		(async () => {
			setSlotsLoading(true);
			setSelectedSlot(null);
			try {
				const response = await bookingService.getAvailableSlots(slug, selectedDate, BROWSER_TZ);
				setSlots(response.slots);
			} catch {
				setSlots([]);
			} finally {
				setSlotsLoading(false);
			}
		})();
	}, [page, slug, selectedDate]);

	const handleSubmit = async () => {
		if (!selectedSlot || !clientName.trim() || !clientEmail.trim()) {
			setError('Please pick a time and fill in your name and email.');
			return;
		}
		setSubmitting(true);
		setError(null);
		try {
			const meeting = await bookingService.scheduleMeeting(slug, {
				start_time: selectedSlot.start_time,
				client_name: clientName,
				client_email: clientEmail,
				attendee_timezone: BROWSER_TZ,
				meeting_notes: notes || undefined,
				idempotency_key: idempotencyKey,
			});
			setConfirmed(meeting);
		} catch (err: any) {
			setError(err?.response?.data?.error?.message || 'This slot is no longer available. Please pick another time.');
			// Refresh slots since the failure likely means someone else just booked it.
			if (page) {
				const response = await bookingService.getAvailableSlots(slug, selectedDate, BROWSER_TZ);
				setSlots(response.slots);
				setSelectedSlot(null);
			}
		} finally {
			setSubmitting(false);
		}
	};

	if (loading) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
				<CircularProgress />
			</Box>
		);
	}

	if (notFound || !page) {
		return (
			<Container maxWidth="sm" sx={{ py: 10, textAlign: 'center' }}>
				<Typography variant="h5" fontWeight={700} gutterBottom>Booking page not found</Typography>
				<Typography color="text.secondary">This link doesn't exist or is no longer active.</Typography>
			</Container>
		);
	}

	if (confirmed) {
		return (
			<Container maxWidth="sm" sx={{ py: 8 }}>
				<Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
					<Typography variant="h5" fontWeight={700} gutterBottom>Meeting Confirmed 🎉</Typography>
					<Typography color="text.secondary" sx={{ mb: 2 }}>
						{new Date(confirmed.start_time).toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'short' })}
					</Typography>
					{confirmed.google_meet_link && (
						<Button variant="contained" href={confirmed.google_meet_link} target="_blank" sx={{ mb: 2 }}>
							Join Google Meet
						</Button>
					)}
					<Typography variant="body2" color="text.secondary">
						A calendar invite has been sent to {confirmed.client_email}.
					</Typography>
				</Paper>
			</Container>
		);
	}

	return (
		<Container maxWidth="md" sx={{ py: 6 }}>
			<Paper variant="outlined" sx={{ p: 4, borderRadius: 3 }}>
				<Typography variant="h5" fontWeight={700}>{page.title}</Typography>
				<Typography color="text.secondary" sx={{ mb: 1 }}>with {page.host_name}</Typography>
				{page.description && <Typography sx={{ mb: 2 }}>{page.description}</Typography>}
				<Chip
					size="small"
					icon={LOCATION_ICON[page.location_type] as any}
					label={`${page.duration_minutes} min · ${page.location_type === 'google_meet' ? 'Google Meet' : page.location_type === 'offline' ? 'In person' : 'Phone call'}`}
					sx={{ mb: 3 }}
				/>
				<Divider sx={{ mb: 3 }} />

				<Grid container spacing={4}>
					<Grid size={{ xs: 12, sm: 5 }}>
						<Typography variant="subtitle2" sx={{ mb: 1 }}>Pick a date</Typography>
						<TextField
							type="date"
							fullWidth
							value={selectedDate}
							onChange={(e) => setSelectedDate(e.target.value)}
							inputProps={{ min: new Date().toISOString().slice(0, 10) }}
						/>
						<Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
							Times shown in your timezone ({BROWSER_TZ})
						</Typography>
					</Grid>
					<Grid size={{ xs: 12, sm: 7 }}>
						<Typography variant="subtitle2" sx={{ mb: 1 }}>Available times</Typography>
						{slotsLoading ? (
							<CircularProgress size={24} />
						) : slots.length === 0 ? (
							<Typography color="text.secondary" variant="body2">No open times on this date.</Typography>
						) : (
							<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
								{slots.map((s) => (
									<Button
										key={s.start_time}
										variant={selectedSlot?.start_time === s.start_time ? 'contained' : 'outlined'}
										size="small"
										onClick={() => setSelectedSlot(s)}
									>
										{new Date(s.start_time).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
									</Button>
								))}
							</Box>
						)}
					</Grid>
				</Grid>

				{selectedSlot && (
					<>
						<Divider sx={{ my: 3 }} />
						<Typography variant="subtitle2" sx={{ mb: 2 }}>
							<EventOutlined fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
							{new Date(selectedSlot.start_time).toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'short' })}
						</Typography>
						<Grid container spacing={2}>
							<Grid size={{ xs: 12, sm: 6 }}>
								<TextField label="Your name" fullWidth value={clientName} onChange={(e) => setClientName(e.target.value)} />
							</Grid>
							<Grid size={{ xs: 12, sm: 6 }}>
								<TextField label="Your email" type="email" fullWidth value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} />
							</Grid>
							<Grid size={{ xs: 12 }}>
								<TextField label="Notes (optional)" fullWidth multiline minRows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
							</Grid>
						</Grid>
						{error && <Typography color="error" variant="body2" sx={{ mt: 2 }}>{error}</Typography>}
						<Button variant="contained" size="large" sx={{ mt: 2 }} onClick={handleSubmit} disabled={submitting}>
							{submitting ? 'Booking…' : 'Confirm Booking'}
						</Button>
					</>
				)}
			</Paper>
		</Container>
	);
};

export default PublicBookingPage;
