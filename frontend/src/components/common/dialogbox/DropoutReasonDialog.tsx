import React, { useState } from 'react';
import {
	Button,
	TextField,
	Typography,
	Box,
	alpha,
	useTheme
} from '@mui/material';
import BaseDialog from './BaseDialog';

interface DropoutReasonDialogProps {
	open: boolean;
	onClose: () => void;
	onConfirm: (reason: string) => void;
	candidateName?: string;
	loading?: boolean;
}

const DropoutReasonDialog: React.FC<DropoutReasonDialogProps> = ({
	open,
	onClose,
	onConfirm,
	candidateName,
	loading = false
}) => {
	const theme = useTheme();
	const [reason, setReason] = useState('');
	const [error, setError] = useState('');

	const handleConfirm = () => {
		if (!reason.trim()) {
			setError('Please provide a reason for dropout');
			return;
		}
		onConfirm(reason);
		setReason('');
		setError('');
	};

	const handleClose = () => {
		if (loading) return;
		onClose();
		setReason('');
		setError('');
	};

	const actions = (
		<>
			<Button 
				onClick={handleClose} 
				color="inherit"
				disabled={loading}
				sx={{ textTransform: 'none', fontWeight: 600 }}
			>
				Cancel
			</Button>
			<Button
				onClick={handleConfirm}
				variant="contained"
				color="error"
				disabled={loading}
				sx={{ 
					textTransform: 'none', 
					fontWeight: 700,
					boxShadow: `0 4px 14px 0 ${alpha(theme.palette.error.main, 0.39)}`,
					'&:hover': {
						bgcolor: 'error.dark',
						boxShadow: `0 6px 20px 0 ${alpha(theme.palette.error.main, 0.23)}`,
					}
				}}
			>
				Confirm Dropout
			</Button>
		</>
	);

	return (
		<BaseDialog
			open={open}
			onClose={handleClose}
			title="Mark Candidate as Dropout"
			subtitle="Action Required"
			maxWidth="sm"
			actions={actions}
			loading={loading}
		>
			<Box>
				<Typography variant="body1" sx={{ mb: 2, fontWeight: 500 }}>
					Are you sure you want to mark <strong>{candidateName || 'this candidate'}</strong> as a dropout?
				</Typography>
				<Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
					Please provide a reason for this action. This is required for tracking and reporting purposes.
				</Typography>

				<TextField
					autoFocus
					margin="dense"
					label="Reason for Dropout"
					fullWidth
					multiline
					rows={3}
					value={reason}
					onChange={(e) => {
						setReason(e.target.value);
						if (error) setError('');
					}}
					error={!!error}
					helperText={error}
					required
					placeholder="e.g. Medical reasons, Found another job, etc."
					sx={{
						'& .MuiOutlinedInput-root': {
							borderRadius: '4px',
						}
					}}
				/>
			</Box>
		</BaseDialog>
	);
};

export default DropoutReasonDialog;
