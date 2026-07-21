import React from 'react';
import { Stack, TextField, Typography } from '@mui/material';
import BaseDialog from '../../common/dialogbox/BaseDialog';
import { SubmitButton, CancelButton } from '../../common/button';
import { useCompleteMeetingDialog } from './hooks/useCompleteMeetingDialog';
import type { ScheduledMeetingHost } from '../../../models/booking/meeting';

interface CompleteMeetingDialogProps {
	open: boolean;
	onClose: () => void;
	meeting: ScheduledMeetingHost | null;
	onCompleted: (meeting: ScheduledMeetingHost) => void;
}

const CompleteMeetingDialog: React.FC<CompleteMeetingDialogProps> = (props) => {
	const { open, onClose, meeting } = props;
	const { outcomeNotes, setOutcomeNotes, submitting, handleSubmit } = useCompleteMeetingDialog(props);

	if (!meeting) return null;

	return (
		<BaseDialog
			open={open}
			onClose={onClose}
			title="Mark Meeting Completed"
			subtitle={`With ${meeting.client_name}`}
			maxWidth="xs"
			loading={submitting}
			actions={
				<>
					<CancelButton onClick={onClose} disabled={submitting} />
					<SubmitButton onClick={handleSubmit} loading={submitting}>Mark Completed</SubmitButton>
				</>
			}
		>
			<Stack spacing={2.5}>
				<Typography variant="caption" color="text.secondary">
					Add any notes about how the meeting went — visible only to your team.
				</Typography>
				<TextField
					label="Outcome notes (optional)" fullWidth multiline minRows={3}
					value={outcomeNotes}
					onChange={(e) => setOutcomeNotes(e.target.value)}
				/>
			</Stack>
		</BaseDialog>
	);
};

export default CompleteMeetingDialog;
