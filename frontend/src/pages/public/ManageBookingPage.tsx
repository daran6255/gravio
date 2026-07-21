import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
	Container,
	Paper,
	Box,
	Typography,
	Button,
	TextField,
	Chip,
	CircularProgress,
	Divider,
	Stack,
} from '@mui/material';
import bookingService from '../../services/bookingService';
import type { ScheduledMeeting } from '../../models/booking/meeting';

const ManageBookingPage: React.FC = () => {
	const { token = '' } = useParams();
	const [loading, setLoading] = useState(true);
	const [meeting, setMeeting] = useState<ScheduledMeeting | null>(null);
	const [notFound, setNotFound] = useState(false);
	const [mode, setMode] = useState<'view' | 'cancel' | 'reschedule'>('view');
	const [reason, setReason] = useState('');
	const [newStartTime, setNewStartTime] = useState('');
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const load = async () => {
		try {
			setMeeting(await bookingService.getMeetingByManageToken(token));
		} catch {
			setNotFound(true);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		load();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [token]);

	const handleCancel = async () => {
		setSubmitting(true);
		setError(null);
		try {
			const updated = await bookingService.clientCancelMeeting(token, reason || undefined);
			setMeeting(updated);
			setMode('view');
		} catch {
			setError('Failed to cancel this meeting. Please try again.');
		} finally {
			setSubmitting(false);
		}
	};

	const handleReschedule = async () => {
		if (!newStartTime) {
			setError('Please choose a new date and time.');
			return;
		}
		setSubmitting(true);
		setError(null);
		try {
			const iso = new Date(newStartTime).toISOString();
			const updated = await bookingService.clientRescheduleMeeting(token, iso);
			setMeeting(updated);
			setMode('view');
		} catch (err: any) {
			setError(err?.response?.data?.error?.message || 'That time is not available. Please choose another.');
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

	if (notFound || !meeting) {
		return (
			<Container maxWidth="sm" sx={{ py: 10, textAlign: 'center' }}>
				<Typography variant="h5" fontWeight={700} gutterBottom>Link not found</Typography>
				<Typography color="text.secondary">This booking management link is invalid or has expired.</Typography>
			</Container>
		);
	}

	return (
		<Container maxWidth="sm" sx={{ py: 6 }}>
			<Paper variant="outlined" sx={{ p: 4, borderRadius: 3 }}>
				<Typography variant="h5" fontWeight={700} gutterBottom>Manage Your Meeting</Typography>
				<Chip
					size="small"
					color={meeting.status === 'scheduled' ? 'success' : meeting.status === 'cancelled' ? 'error' : 'default'}
					label={meeting.status}
					sx={{ mb: 2 }}
				/>
				<Typography variant="body1">
					{new Date(meeting.start_time).toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'short' })}
				</Typography>
				<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{meeting.attendee_timezone}</Typography>
				{meeting.google_meet_link && meeting.status === 'scheduled' && (
					<Button variant="outlined" href={meeting.google_meet_link} target="_blank" sx={{ mb: 2 }}>Join Google Meet</Button>
				)}
				{meeting.cancellation_reason && (
					<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
						Cancellation reason: {meeting.cancellation_reason}
					</Typography>
				)}

				{meeting.status === 'scheduled' && mode === 'view' && (
					<Stack direction="row" spacing={2} sx={{ mt: 2 }}>
						<Button variant="outlined" onClick={() => setMode('reschedule')}>Reschedule</Button>
						<Button variant="outlined" color="error" onClick={() => setMode('cancel')}>Cancel Meeting</Button>
					</Stack>
				)}

				{mode === 'cancel' && (
					<Box sx={{ mt: 3 }}>
						<Divider sx={{ mb: 3 }} />
						<TextField
							fullWidth multiline minRows={2} label="Reason (optional)"
							value={reason} onChange={(e) => setReason(e.target.value)}
						/>
						{error && <Typography color="error" variant="body2" sx={{ mt: 2 }}>{error}</Typography>}
						<Stack direction="row" spacing={2} sx={{ mt: 2 }}>
							<Button onClick={() => setMode('view')}>Back</Button>
							<Button variant="contained" color="error" onClick={handleCancel} disabled={submitting}>
								Confirm Cancellation
							</Button>
						</Stack>
					</Box>
				)}

				{mode === 'reschedule' && (
					<Box sx={{ mt: 3 }}>
						<Divider sx={{ mb: 3 }} />
						<TextField
							fullWidth type="datetime-local" label="New date & time"
							InputLabelProps={{ shrink: true }}
							value={newStartTime} onChange={(e) => setNewStartTime(e.target.value)}
						/>
						{error && <Typography color="error" variant="body2" sx={{ mt: 2 }}>{error}</Typography>}
						<Stack direction="row" spacing={2} sx={{ mt: 2 }}>
							<Button onClick={() => setMode('view')}>Back</Button>
							<Button variant="contained" onClick={handleReschedule} disabled={submitting}>
								Confirm New Time
							</Button>
						</Stack>
					</Box>
				)}
			</Paper>
		</Container>
	);
};

export default ManageBookingPage;
