import React, { useMemo, useState } from 'react';
import {
	Paper,
	Typography,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Stack,
	Button,
	Chip,
	TextField
} from '@mui/material';
import { BaseDialog } from '../../common/dialogbox';
import type { TimesheetWeekUnlockRequest } from '../../../models/timesheet';

interface WeekUnlockRequestsPanelProps {
	requests: TimesheetWeekUnlockRequest[];
	loading: boolean;
	onApprove: (requestId: number) => void;
	onDeny: (requestId: number, note?: string) => void;
}

const statusChipColor: Record<string, 'warning' | 'success' | 'error'> = {
	pending: 'warning',
	approved: 'success',
	denied: 'error'
};

const WeekUnlockRequestsPanel: React.FC<WeekUnlockRequestsPanelProps> = ({ requests, loading, onApprove, onDeny }) => {
	const [denyTarget, setDenyTarget] = useState<TimesheetWeekUnlockRequest | null>(null);
	const [denyNote, setDenyNote] = useState('');

	const { pending, resolved } = useMemo(() => {
		const pending = requests.filter((r) => r.status === 'pending');
		const resolved = requests.filter((r) => r.status !== 'pending');
		return { pending, resolved };
	}, [requests]);

	const handleOpenDeny = (req: TimesheetWeekUnlockRequest) => {
		setDenyTarget(req);
		setDenyNote('');
	};

	const handleConfirmDeny = () => {
		if (denyTarget) {
			onDeny(denyTarget.id, denyNote.trim() || undefined);
			setDenyTarget(null);
		}
	};

	const renderTable = (rows: TimesheetWeekUnlockRequest[], showActions: boolean) => (
		<TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 6, overflow: 'hidden' }}>
			<Table>
				<TableHead>
					<TableRow sx={{ bgcolor: 'action.hover' }}>
						<TableCell sx={{ fontWeight: 700 }}>Team Member</TableCell>
						<TableCell sx={{ fontWeight: 700 }}>Week</TableCell>
						<TableCell sx={{ fontWeight: 700 }}>Reason</TableCell>
						<TableCell align="center" sx={{ fontWeight: 700 }}>Status</TableCell>
						<TableCell align="right" sx={{ fontWeight: 700, pr: 3 }}>{showActions ? 'Actions' : 'Resolution'}</TableCell>
					</TableRow>
				</TableHead>
				<TableBody>
					{rows.length === 0 ? (
						<TableRow>
							<TableCell colSpan={5} align="center" sx={{ py: 5 }}>
								<Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
									{loading ? 'Loading...' : 'Nothing here.'}
								</Typography>
							</TableCell>
						</TableRow>
					) : (
						rows.map((req) => (
							<TableRow key={req.id}>
								<TableCell>
									<Typography variant="body2" sx={{ fontWeight: 700 }}>
										{req.user?.full_name || req.user?.email || `User #${req.user_id}`}
									</Typography>
									<Typography variant="caption" color="text.secondary">
										{req.user?.email}
									</Typography>
								</TableCell>
								<TableCell>
									<Typography variant="body2">{req.week_start_date} — {req.week_end_date}</Typography>
								</TableCell>
								<TableCell>
									<Typography variant="body2" color="text.secondary">
										{req.reason || '—'}
									</Typography>
								</TableCell>
								<TableCell align="center">
									<Chip
										label={req.status.charAt(0).toUpperCase() + req.status.slice(1)}
										color={statusChipColor[req.status]}
										size="small"
										sx={{ fontWeight: 700 }}
									/>
								</TableCell>
								<TableCell align="right" sx={{ pr: 3 }}>
									{showActions ? (
										<Stack direction="row" spacing={1} justifyContent="flex-end">
											<Button
												variant="contained"
												color="success"
												size="small"
												onClick={() => onApprove(req.id)}
												disabled={loading}
												sx={{ borderRadius: 3, fontWeight: 700 }}
											>
												Approve
											</Button>
											<Button
												variant="outlined"
												color="error"
												size="small"
												onClick={() => handleOpenDeny(req)}
												disabled={loading}
												sx={{ borderRadius: 3, fontWeight: 700 }}
											>
												Deny
											</Button>
										</Stack>
									) : (
										<Typography variant="caption" color="text.secondary">
											{req.resolution_note || (req.status === 'approved' ? 'Granted' : 'No note')}
										</Typography>
									)}
								</TableCell>
							</TableRow>
						))
					)}
				</TableBody>
			</Table>
		</TableContainer>
	);

	return (
		<Stack spacing={4}>
			<Stack spacing={1.5}>
				<Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
					Pending Requests
				</Typography>
				{renderTable(pending, true)}
			</Stack>

			<Stack spacing={1.5}>
				<Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
					Resolved
				</Typography>
				{renderTable(resolved, false)}
			</Stack>

			<BaseDialog
				open={!!denyTarget}
				onClose={() => setDenyTarget(null)}
				title="Deny Unlock Request"
				maxWidth="xs"
				actions={
					<>
						<Button onClick={() => setDenyTarget(null)} variant="outlined" sx={{ borderRadius: 3 }}>
							Cancel
						</Button>
						<Button onClick={handleConfirmDeny} variant="contained" color="error" sx={{ borderRadius: 3, fontWeight: 700 }}>
							Deny Request
						</Button>
					</>
				}
			>
				<Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
					Optionally let {denyTarget?.user?.full_name || denyTarget?.user?.email || 'the team member'} know why this week won't be unlocked.
				</Typography>
				<TextField
					label="Note (optional)"
					multiline
					rows={3}
					value={denyNote}
					onChange={(e) => setDenyNote(e.target.value)}
					fullWidth
					autoFocus
				/>
			</BaseDialog>
		</Stack>
	);
};

export default WeekUnlockRequestsPanel;
