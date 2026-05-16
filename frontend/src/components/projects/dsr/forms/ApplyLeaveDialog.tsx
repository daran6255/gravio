import React, { useState } from 'react';
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	TextField,
	Box,
	MenuItem,
	CircularProgress,
	Typography,
	IconButton,
	Fade,
	Alert
} from '@mui/material';
import {
	Close as CloseIcon,
	EventBusy as LeaveIcon
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { applyLeave } from '../../../../store/slices/dsrSlice';
import useToast from '../../../../hooks/useToast';
import dayjs from 'dayjs';

interface ApplyLeaveDialogProps {
	open: boolean;
	onClose: () => void;
	onSuccess: () => void;
}

const LEAVE_TYPES = [
	'Casual Leave',
	'Sick Leave',
	'Privilege Leave',
	'Compensatory Off',
	'Holiday',
	'Other'
];

const ApplyLeaveDialog: React.FC<ApplyLeaveDialogProps> = ({ open, onClose, onSuccess }) => {
	const dispatch = useAppDispatch();
	const toast = useToast();
	const { holidays } = useAppSelector((state) => state.holidays);
	
	const [startDate, setStartDate] = useState(dayjs().format('YYYY-MM-DD'));
	const [endDate, setEndDate] = useState(dayjs().format('YYYY-MM-DD'));
	const [leaveType, setLeaveType] = useState('Casual Leave');
	const [reason, setReason] = useState('');
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async () => {
		if (new Date(endDate) < new Date(startDate)) {
			setError('End date cannot be before start date');
			return;
		}

		// Holiday check
		const holidayInRange = holidays.filter(h => {
			const d = dayjs(h.holiday_date);
			return (d.isSame(startDate, 'day') || d.isAfter(startDate, 'day')) && 
				   (d.isSame(endDate, 'day') || d.isBefore(endDate, 'day'));
		});

		if (holidayInRange.length > 0) {
			const holidayNames = holidayInRange.map(h => h.holiday_name).join(', ');
			setError(`Selected range include company holidays: ${holidayNames}. You cannot apply for leave on holidays.`);
			return;
		}

		setSubmitting(true);
		setError(null);
		try {
			await dispatch(applyLeave({
				start_date: startDate,
				end_date: endDate,
				leave_type: leaveType,
				reason: reason || undefined
			})).unwrap();
			
			toast.success('Leave applied successfully');
			onSuccess();
			onClose();
		} catch (err: any) {
			setError(err || 'Failed to apply leave');
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth="xs"
			fullWidth
			TransitionComponent={Fade}
			PaperProps={{
				sx: { borderRadius: '4px' }
			}}
		>
			<DialogTitle sx={{
				bgcolor: '#d32f2f',
				color: '#ffffff',
				py: 2,
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'space-between'
			}}>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
					<LeaveIcon />
					<Typography variant="h6" sx={{ fontWeight: 700 }}>Apply for Leave</Typography>
				</Box>
				<IconButton onClick={onClose} size="small" sx={{ color: '#ffffff' }}>
					<CloseIcon fontSize="small" />
				</IconButton>
			</DialogTitle>

			<DialogContent sx={{ mt: 2 }}>
				<Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
					{error && <Alert severity="error">{error}</Alert>}
					
					<Typography variant="body2" color="text.secondary">
						Select the date range for your leave. DSR entries will be automatically created or updated as "Leave" for these dates.
					</Typography>

					<Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
						<TextField
							label="From Date"
							type="date"
							fullWidth
							value={startDate}
							onChange={(e) => setStartDate(e.target.value)}
							InputLabelProps={{ shrink: true }}
						/>
						<TextField
							label="To Date"
							type="date"
							fullWidth
							value={endDate}
							onChange={(e) => setEndDate(e.target.value)}
							InputLabelProps={{ shrink: true }}
						/>
					</Box>

					<TextField
						select
						label="Leave Type"
						fullWidth
						value={leaveType}
						onChange={(e) => setLeaveType(e.target.value)}
					>
						{LEAVE_TYPES.map(type => (
							<MenuItem key={type} value={type}>{type}</MenuItem>
						))}
					</TextField>

					<TextField
						label="Reason (Optional)"
						multiline
						rows={2}
						fullWidth
						value={reason}
						onChange={(e) => setReason(e.target.value)}
						placeholder="Briefly describe the reason for leave..."
					/>
				</Box>
			</DialogContent>

			<DialogActions sx={{ p: 3, borderTop: '1px solid #eee' }}>
				<Button onClick={onClose} color="inherit" sx={{ textTransform: 'none', fontWeight: 700 }}>
					Cancel
				</Button>
				<Button
					onClick={handleSubmit}
					variant="contained"
					disabled={submitting}
					sx={{
						bgcolor: '#d32f2f',
						'&:hover': { bgcolor: '#b71c1c' },
						textTransform: 'none',
						fontWeight: 700,
						px: 4
					}}
				>
					{submitting ? <CircularProgress size={24} color="inherit" /> : 'Confirm Leave'}
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default ApplyLeaveDialog;
