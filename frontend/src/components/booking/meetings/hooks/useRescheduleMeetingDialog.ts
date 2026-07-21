import { useEffect, useState } from 'react';
import bookingService from '../../../../services/bookingService';
import useToast from '../../../../hooks/useToast';
import type { ScheduledMeetingHost } from '../../../../models/booking/meeting';

interface UseRescheduleMeetingDialogParams {
	open: boolean;
	meeting: ScheduledMeetingHost | null;
	onRescheduled: (meeting: ScheduledMeetingHost) => void;
	onClose: () => void;
}

export const useRescheduleMeetingDialog = ({ open, meeting, onRescheduled, onClose }: UseRescheduleMeetingDialogParams) => {
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

	return { selectedDate, setSelectedDate, selectedTime, setSelectedTime, submitting, handleSubmit };
};
