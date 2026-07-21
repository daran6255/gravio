import React, { useEffect, useState } from 'react';
import { Box, Stack, TextField, Typography, CircularProgress, Button } from '@mui/material';
import { EventOutlined } from '@mui/icons-material';
import BaseDialog from '../common/dialogbox/BaseDialog';
import { SubmitButton, CancelButton } from '../common/button';
import bookingService from '../../services/bookingService';
import useToast from '../../hooks/useToast';
import type { BookingPage } from '../../models/booking/bookingPage';
import type { AvailableSlot, ScheduledMeetingHost } from '../../models/booking/meeting';

interface RescheduleMeetingDialogProps {
	open: boolean;
	onClose: () => void;
	meeting: ScheduledMeetingHost | null;
	bookingPages: BookingPage[];
	onRescheduled: (meeting: ScheduledMeetingHost) => void;
}

const BROWSER_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

const RescheduleMeetingDialog: React.FC<RescheduleMeetingDialogProps> = ({ open, onClose, meeting, bookingPages, onRescheduled }) => {
	const toast = useToast();
	const page = meeting ? bookingPages.find((p) => p.id === meeting.booking_page_id) || null : null;

	const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
	const [slots, setSlots] = useState<AvailableSlot[]>([]);
	const [slotsLoading, setSlotsLoading] = useState(false);
	const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
	const [submitting, setSubmitting] = useState(false);

	useEffect(() => {
		if (open && meeting) {
			setSelectedDate(new Date(meeting.start_time).toISOString().slice(0, 10));
			setSelectedSlot(null);
		}
	}, [open, meeting]);

	useEffect(() => {
		if (!open || !page) return;
		setSlotsLoading(true);
		setSelectedSlot(null);
		bookingService.getAvailableSlots(page.slug, selectedDate, BROWSER_TZ)
			.then((res) => setSlots(res.slots))
			.catch(() => setSlots([]))
			.finally(() => setSlotsLoading(false));
	}, [open, page, selectedDate]);

	const handleSubmit = async () => {
		if (!meeting || !selectedSlot) return;
		setSubmitting(true);
		try {
			const updated = await bookingService.hostRescheduleMeeting(meeting.public_id, selectedSlot.start_time);
			toast.success('Meeting rescheduled — the client has been notified.');
			onRescheduled(updated);
			onClose();
		} catch (err: any) {
			toast.error(err?.response?.data?.error?.message || 'That time is no longer available. Please pick another.');
		} finally {
			setSubmitting(false);
		}
	};

	if (!meeting) return null;

	return (
		<BaseDialog
			open={open}
			onClose={onClose}
			title="Reschedule Meeting"
			subtitle={`With ${meeting.client_name}`}
			maxWidth="sm"
			loading={submitting}
			actions={
				<>
					<CancelButton onClick={onClose} disabled={submitting} />
					<SubmitButton onClick={handleSubmit} loading={submitting} disabled={!selectedSlot}>Confirm New Time</SubmitButton>
				</>
			}
		>
			<Stack spacing={2.5}>
				<TextField
					label="Date" type="date" fullWidth size="small" value={selectedDate}
					onChange={(e) => setSelectedDate(e.target.value)}
					InputLabelProps={{ shrink: true }}
					inputProps={{ min: new Date().toISOString().slice(0, 10) }}
				/>

				<Box>
					<Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 1 }}>
						AVAILABLE TIMES
					</Typography>
					{slotsLoading ? (
						<CircularProgress size={22} />
					) : slots.length === 0 ? (
						<Typography variant="body2" color="text.secondary">No open times on this date.</Typography>
					) : (
						<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
							{slots.map((s) => (
								<Button
									key={s.start_time}
									size="small"
									variant={selectedSlot?.start_time === s.start_time ? 'contained' : 'outlined'}
									onClick={() => setSelectedSlot(s)}
									sx={{ borderRadius: 2, textTransform: 'none' }}
								>
									{new Date(s.start_time).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
								</Button>
							))}
						</Box>
					)}
				</Box>

				{selectedSlot && (
					<Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'success.main', fontWeight: 700 }}>
						<EventOutlined sx={{ fontSize: 14 }} />
						{new Date(selectedSlot.start_time).toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'short' })}
					</Typography>
				)}
			</Stack>
		</BaseDialog>
	);
};

export default RescheduleMeetingDialog;
