import React, { useState, useEffect } from 'react';
import {
	Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
	Paper, Button, Stack, Typography, Box, Chip, alpha, useTheme,
	CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions,
	TextField
} from '@mui/material';
import { Check as ApproveIcon, Close as RejectIcon } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { fetchPendingLeaveRequests, approveRejectLeaveRequest } from '../../../../store/slices/hrSlice';
import type { HRLeaveRequestResponse } from '../../../../models/hr';
import useToast from '../../../../hooks/useToast';

export const TeamLeavesApprovalsTable: React.FC = () => {
	const theme = useTheme();
	const dispatch = useAppDispatch();
	const { success, error } = useToast();

	const { pendingLeaveRequests: requests, pendingLeaveRequestsLoading: loading } = useAppSelector((state) => state.hr);

	const [resolveTarget, setResolveTarget] = useState<HRLeaveRequestResponse | null>(null);
	const [statusType, setStatusType] = useState<'approved' | 'rejected' | null>(null);
	const [managerNotes, setManagerNotes] = useState('');
	const [submitting, setSubmitting] = useState(false);

	useEffect(() => {
		dispatch(fetchPendingLeaveRequests());
	}, [dispatch]);

	const handleOpenResolveDialog = (req: HRLeaveRequestResponse, type: 'approved' | 'rejected') => {
		setResolveTarget(req);
		setStatusType(type);
		setManagerNotes('');
	};

	const handleCloseResolveDialog = () => {
		setResolveTarget(null);
		setStatusType(null);
		setManagerNotes('');
	};

	const handleConfirmResolve = async () => {
		if (!resolveTarget || !statusType) return;
		
		if (statusType === 'rejected' && !managerNotes.trim()) {
			error('Please provide a reason for rejection');
			return;
		}

		setSubmitting(true);
		try {
			await dispatch(approveRejectLeaveRequest({
				publicId: resolveTarget.public_id,
				payload: {
					status: statusType,
					manager_notes: managerNotes.trim() || undefined
				}
			})).unwrap();
			success(`Leave request ${statusType === 'approved' ? 'approved' : 'rejected'} successfully`);
			handleCloseResolveDialog();
			dispatch(fetchPendingLeaveRequests());
		} catch (e: any) {
			error(e || 'Failed to update leave request status');
		} finally {
			setSubmitting(false);
		}
	};

	if (loading && requests.length === 0) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
				<CircularProgress />
			</Box>
		);
	}

	if (requests.length === 0) {
		return (
			<Box
				sx={{
					py: 8,
					px: 3,
					textAlign: 'center',
					bgcolor: 'background.paper',
					border: `1px solid ${alpha(theme.palette.divider, 0.7)}`,
					borderRadius: 4,
				}}
			>
				<Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
					No pending leave requests to approve.
				</Typography>
			</Box>
		);
	}

	return (
		<>
			<TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 4, overflow: 'hidden' }}>
				<Table size="medium">
					<TableHead>
						<TableRow sx={{ bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}>
							<TableCell sx={{ fontWeight: 700 }}>Employee</TableCell>
							<TableCell sx={{ fontWeight: 700 }}>Leave Type</TableCell>
							<TableCell sx={{ fontWeight: 700 }} align="center">Duration</TableCell>
							<TableCell sx={{ fontWeight: 700 }}>Dates</TableCell>
							<TableCell sx={{ fontWeight: 700 }}>Reason</TableCell>
							<TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{requests.map((req) => (
							<TableRow key={req.public_id} hover>
								<TableCell>
									<Typography variant="body2" fontWeight={700}>
										{req.employee_name || '—'}
									</Typography>
									<Typography variant="caption" color="text.secondary" display="block">
										Code: {req.employee_code || '—'}
									</Typography>
								</TableCell>
								<TableCell>
									<Typography variant="body2" fontWeight={600}>
										{req.leave_type_name || '—'}
									</Typography>
									{req.leave_type_code && (
										<Chip
											label={req.leave_type_code}
											size="small"
											sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, mt: 0.5 }}
										/>
									)}
								</TableCell>
								<TableCell align="center">
									<Typography variant="body2" fontWeight={700}>
										{req.total_days} day{req.total_days === 1 ? '' : 's'}
									</Typography>
									{req.is_half_day && (
										<Typography variant="caption" color="text.secondary" display="block">
											Half day ({req.half_day_session})
										</Typography>
									)}
								</TableCell>
								<TableCell>
									<Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>
										{new Date(req.from_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
									</Typography>
									<Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
										to {new Date(req.to_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
									</Typography>
								</TableCell>
								<TableCell sx={{ maxWidth: 220 }}>
									<Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
										{req.reason || '—'}
									</Typography>
								</TableCell>
								<TableCell align="right">
									<Stack direction="row" spacing={1} justifyContent="flex-end">
										<Button
											size="small"
											variant="outlined"
											color="error"
											startIcon={<RejectIcon />}
											onClick={() => handleOpenResolveDialog(req, 'rejected')}
											sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
										>
											Reject
										</Button>
										<Button
											size="small"
											variant="contained"
											color="success"
											startIcon={<ApproveIcon />}
											onClick={() => handleOpenResolveDialog(req, 'approved')}
											sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, color: 'white' }}
										>
											Approve
										</Button>
									</Stack>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</TableContainer>

			{/* Approve/Reject Dialogue */}
			<Dialog open={!!resolveTarget} onClose={handleCloseResolveDialog} maxWidth="xs" fullWidth>
				<DialogTitle>
					{statusType === 'approved' ? 'Approve Leave Request' : 'Reject Leave Request'}
				</DialogTitle>
				<DialogContent>
					<Stack spacing={2} sx={{ mt: 1 }}>
						<Typography variant="body2">
							Are you sure you want to <strong>{statusType}</strong> the leave request for{' '}
							<strong>{resolveTarget?.employee_name}</strong>?
						</Typography>
						<TextField
							label={statusType === 'rejected' ? 'Rejection Reason (Required)' : 'Manager Notes (Optional)'}
							fullWidth
							multiline
							rows={3}
							value={managerNotes}
							onChange={(e) => setManagerNotes(e.target.value)}
							error={statusType === 'rejected' && !managerNotes.trim()}
							helperText={statusType === 'rejected' && !managerNotes.trim() ? 'Rejection reason is required' : ''}
						/>
					</Stack>
				</DialogContent>
				<DialogActions sx={{ px: 3, pb: 2.5 }}>
					<Button onClick={handleCloseResolveDialog} disabled={submitting}>
						Cancel
					</Button>
					<Button
						variant="contained"
						color={statusType === 'approved' ? 'success' : 'error'}
						onClick={handleConfirmResolve}
						disabled={submitting || (statusType === 'rejected' && !managerNotes.trim())}
						sx={{ color: statusType === 'approved' ? 'white' : 'inherit', fontWeight: 700 }}
					>
						{submitting ? <CircularProgress size={18} color="inherit" /> : statusType === 'approved' ? 'Approve' : 'Reject'}
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
};

export default TeamLeavesApprovalsTable;
