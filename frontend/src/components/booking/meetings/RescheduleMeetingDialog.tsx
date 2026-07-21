import React, { useEffect, useState } from 'react';
import { Stack, TextField, Typography } from '@mui/material';
import BaseDialog from '../../common/dialogbox/BaseDialog';
import { SubmitButton, CancelButton } from '../../common/button';
import bookingService from '../../../services/bookingService';
import useToast from '../../../hooks/useToast';
import type { ScheduledMeetingHost } from '../../../models/booking/meeting';

interface RescheduleMeetingDialogProps {
	open: boolean;
	onClose: () => void;
	meeting: ScheduledMeetingHost | null;
	onRescheduled: (meeting: ScheduledMeetingHost) => void;
}

const RescheduleMeetingDialog: React.FC<RescheduleMeetingDialogProps> = ({ open, onClose, meeting, onRescheduled }) => {
	const toast = useToast();

	const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
	const [selectedTime, setSelectedTime] = useState('09:00');
	const [submitting, setSubmitting] = useState(false);

	useEffect(() => {
		if (open && meeting) {
			const start = new Date(meeting.start_time);
			setSelectedDate(start.toISOString().slice(0, 10));
			setSelectedTime(start.toTimeString().slice(0, 5));
		}
	}, [open, meeting]);

	const handleSubmit = async () => {
		if (!meeting) return;
		const [h, m] = selectedTime.split(':').map(Number);
		const newStart = new Date(`${selectedDate}T00:00:00`);
		newStart.setHours(h, m, 0, 0);

		setSubmitting(true);
		try {
			const updated = await bookingService.hostRescheduleMeeting(meeting.public_id, newStart.toISOString());
			toast.success('Meeting rescheduled — the client has been notified.');
			onRescheduled(updated);
			onClose();
		} catch (err: any) {
			toast.error(err?.response?.data?.error?.message || 'You already have a meeting scheduled during this time.');
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
			maxWidth="xs"
			loading={submitting}
			actions={
				<>
					<CancelButton onClick={onClose} disabled={submitting} />
					<SubmitButton onClick={handleSubmit} loading={submitting}>Confirm New Time</SubmitButton>
				</>
			}
		>
			<Stack spacing={2.5}>
				<TextField
					label="Date" type="date" fullWidth size="small" value={selectedDate}
					onChange={(e) => setSelectedDate(e.target.value)}
					InputLabelProps={{ shrink: true }}
				/>
				<TextField
					label="Start time" type="time" fullWidth size="small" value={selectedTime}
					onChange={(e) => setSelectedTime(e.target.value)}
					InputLabelProps={{ shrink: true }}
				/>
				<Typography variant="caption" color="text.secondary">
					The meeting keeps its original length — only the start time changes.
				</Typography>
			</Stack>
		</BaseDialog>
	);
};

export default RescheduleMeetingDialog;
