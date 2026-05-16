import React from 'react';
import {
	TextField,
	useTheme,
	alpha
} from '@mui/material';
import ConfirmationDialog from '../../common/dialogbox/ConfirmationDialog';

interface DropoutDialogProps {
	open: boolean;
	onClose: () => void;
	onConfirm: () => void;
	remark: string;
	onRemarkChange: (value: string) => void;
	submitting: boolean;
}

const DropoutDialog: React.FC<DropoutDialogProps> = ({
	open,
	onClose,
	onConfirm,
	remark,
	onRemarkChange,
	submitting
}) => {
	const theme = useTheme();

	return (
		<ConfirmationDialog
			open={open}
			onClose={onClose}
			onConfirm={onConfirm}
			title="Mark as Dropout"
			message="Please provide a reason for the candidate dropping out. This action will update their active status in the training batch."
			confirmLabel={submitting ? 'Updating...' : 'Confirm Dropout'}
			cancelLabel="Cancel"
			severity="error"
			loading={submitting}
			maxWidth="sm"
		>
			<TextField
				fullWidth
				multiline
				rows={4}
				placeholder="Reason for dropping out (e.g., medical reasons, joined other job...)"
				value={remark}
				onChange={(e) => onRemarkChange(e.target.value)}
				autoFocus
				sx={{
					mt: 2,
					'& .MuiOutlinedInput-root': {
						borderRadius: 2,
						bgcolor: alpha(theme.palette.background.default, 0.5),
						'& fieldset': {
							borderColor: alpha(theme.palette.divider, 0.8),
						},
						'&:hover fieldset': {
							borderColor: theme.palette.error.main,
						},
						'&.Mui-focused fieldset': {
							borderColor: theme.palette.error.main,
						},
					}
				}}
			/>
		</ConfirmationDialog>
	);
};

export default DropoutDialog;
