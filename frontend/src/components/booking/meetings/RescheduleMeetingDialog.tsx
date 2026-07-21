import React from 'react';
import { Stack, TextField, Typography } from '@mui/material';
import BaseDialog from '../../common/dialogbox/BaseDialog';
import { SubmitButton, CancelButton } from '../../common/button';
import { useRescheduleMeetingDialog } from './hooks/useRescheduleMeetingDialog';
import type { ScheduledMeetingHost } from '../../../models/booking/meeting';

interface RescheduleMeetingDialogProps {
	open: boolean;
	onClose: () => void;
	meeting: ScheduledMeetingHost | null;
	onRescheduled: (meeting: ScheduledMeetingHost) => void;
}

const RescheduleMeetingDialog: React.FC<RescheduleMeetingDialogProps> = (props) => {
	const { open, onClose, meeting } = props;
	const { selectedDate, setSelectedDate, selectedTime, setSelectedTime, submitting, handleSubmit } = useRescheduleMeetingDialog(props);

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
