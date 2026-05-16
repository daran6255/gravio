import React from 'react';
import { Alert, Typography, Box } from '@mui/material';
import ConfirmationDialog from '../../../common/dialogbox/ConfirmationDialog';

export interface ConfirmDialogState {
	open: boolean;
	candidateId: number | null;
	candidateName: string;
	recordCount: number;
}

interface ClearAttendanceDialogProps {
	state: ConfirmDialogState;
	deleting: boolean;
	onClose: () => void;
	onConfirm: () => void;
}

const ClearAttendanceDialog: React.FC<ClearAttendanceDialogProps> = ({ state, deleting, onClose, onConfirm }) => {
	return (
		<ConfirmationDialog
			open={state.open}
			onClose={onClose}
			onConfirm={onConfirm}
			title="Clear All Attendance Records"
			subtitle="This action cannot be undone"
			message={`You are about to delete all attendance records for ${state.candidateName} in this batch.`}
			confirmLabel={deleting ? 'Deleting...' : `Delete ${state.recordCount} Records`}
			severity="error"
			loading={deleting}
			maxWidth="sm"
		>
			<Box sx={{ textAlign: 'left', mt: 1 }}>
				<Alert severity="error" sx={{ mb: 2, borderRadius: 2, fontWeight: 500 }}>
					Total Records to be deleted: <strong>{state.recordCount}</strong>
				</Alert>
				<Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
					This is typically used when a candidate was incorrectly added to this batch or for data correction.
					All marked attendance data for <strong>{state.candidateName}</strong> will be soft-deleted 
					and will no longer appear in any reports or statistics.
				</Typography>
			</Box>
		</ConfirmationDialog>
	);
};

export default ClearAttendanceDialog;
