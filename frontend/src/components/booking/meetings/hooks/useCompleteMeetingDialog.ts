import { useEffect, useState } from 'react';
import bookingService from '../../../../services/bookingService';
import useToast from '../../../../hooks/useToast';
import type { ScheduledMeetingHost } from '../../../../models/booking/meeting';

interface UseCompleteMeetingDialogParams {
	open: boolean;
	meeting: ScheduledMeetingHost | null;
	onCompleted: (meeting: ScheduledMeetingHost) => void;
	onClose: () => void;
}

export const useCompleteMeetingDialog = ({ open, meeting, onCompleted, onClose }: UseCompleteMeetingDialogParams) => {
	const toast = useToast();

	const [outcomeNotes, setOutcomeNotes] = useState('');
	const [submitting, setSubmitting] = useState(false);

	useEffect(() => {
		if (open) {
			setOutcomeNotes(meeting?.outcome_notes || '');
		}
	}, [open, meeting]);

	const handleSubmit = async () => {
		if (!meeting) return;
		setSubmitting(true);
		try {
			const updated = await bookingService.hostCompleteMeeting(meeting.public_id, outcomeNotes || undefined);
			toast.success('Meeting marked as completed.');
			onCompleted(updated);
			onClose();
		} catch (err: any) {
			toast.error(err?.response?.data?.error?.message || 'Failed to complete meeting.');
		} finally {
			setSubmitting(false);
		}
	};

	return { outcomeNotes, setOutcomeNotes, submitting, handleSubmit };
};
