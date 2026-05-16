import React, { useState, useEffect } from 'react';
import {
	Button,
	TextField,
	Typography,
	Stack,
	Box,
	useTheme,
	alpha
} from '@mui/material';
import { Info as InfoIcon } from '@mui/icons-material';
import BaseDialog from '../../../common/dialogbox/BaseDialog';

interface ExtendBatchDialogProps {
	open: boolean;
	onClose: () => void;
	onConfirm: (newDate: string, reason: string) => void;
	currentCloseDate: string;
	batchName: string;
}

const ExtendBatchDialog: React.FC<ExtendBatchDialogProps> = ({
	open,
	onClose,
	onConfirm,
	currentCloseDate,
	batchName
}) => {
	const theme = useTheme();
	const [newDate, setNewDate] = useState('');
	const [reason, setReason] = useState('');

	useEffect(() => {
		if (open) {
			setNewDate(currentCloseDate || new Date().toISOString().split('T')[0]);
			setReason('');
		}
	}, [open, currentCloseDate]);

	const handleConfirm = () => {
		onConfirm(newDate, reason);
		onClose();
	};

	const actions = (
		<>
			<Button
				onClick={onClose}
				sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'none' }}
			>
				Cancel
			</Button>
			<Button
				onClick={handleConfirm}
				variant="contained"
				disabled={!newDate || !reason || newDate === currentCloseDate}
				sx={{
					bgcolor: theme.palette.accent.main,
					color: '#ffffff',
					px: 3,
					fontWeight: 700,
					borderRadius: '4px',
					textTransform: 'none',
					boxShadow: 'none',
					'&:hover': { bgcolor: theme.palette.accent.dark, boxShadow: 'none' }
				}}
			>
				Confirm Extension
			</Button>
		</>
	);

	return (
		<BaseDialog
			open={open}
			onClose={onClose}
			title="Extend Batch Date"
			subtitle={`Batch ID: ${batchName}`}
			maxWidth="xs"
			actions={actions}
		>
			<Stack spacing={3}>
				<Box sx={{
					p: 2,
					bgcolor: alpha(theme.palette.accent.main, 0.05),
					borderLeft: `4px solid ${theme.palette.accent.main}`,
					borderRadius: '2px'
				}}>
					<Typography variant="subtitle2" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
						{batchName}
					</Typography>
					<Typography variant="caption" sx={{ color: 'text.secondary' }}>
						Current End Date: {currentCloseDate}
					</Typography>
				</Box>

				<TextField
					label="New Completion Date"
					type="date"
					fullWidth
					size="small"
					InputLabelProps={{ shrink: true }}
					value={newDate}
					onChange={(e) => setNewDate(e.target.value)}
					variant="outlined"
				/>

				<TextField
					label="Reason for Extension"
					multiline
					rows={3}
					fullWidth
					size="small"
					placeholder="e.g. Additional training module required, holidays, etc."
					value={reason}
					onChange={(e) => setReason(e.target.value)}
					variant="outlined"
				/>

				<Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: theme.palette.warning.main }}>
					<InfoIcon sx={{ fontSize: 16 }} />
					This action will be recorded in the batch extension history as an audit trail.
				</Typography>
			</Stack>
		</BaseDialog>
	);
};

export default ExtendBatchDialog;
