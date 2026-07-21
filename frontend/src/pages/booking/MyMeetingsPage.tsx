import React, { useEffect, useState } from 'react';
import {
	Box,
	Card,
	Stack,
	Typography,
	Chip,
	Button,
	TextField,
	MenuItem,
	Table,
	TableHead,
	TableBody,
	TableRow,
	TableCell,
	TablePagination,
	CircularProgress,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
} from '@mui/material';
import PageHeader from '../../components/common/page-header';
import useToast from '../../hooks/useToast';
import bookingService from '../../services/bookingService';
import type { ScheduledMeetingHost, MeetingStatus } from '../../models/booking/meeting';

const STATUS_COLOR: Record<MeetingStatus, 'default' | 'success' | 'error'> = {
	scheduled: 'success',
	completed: 'default',
	cancelled: 'error',
};

const SYNC_LABEL: Record<string, string> = {
	not_applicable: 'Email invite only',
	pending: 'Syncing to Google…',
	synced: 'Synced to Google',
	failed: 'Google sync failed',
};

const MyMeetingsPage: React.FC = () => {
	const toast = useToast();
	const [loading, setLoading] = useState(true);
	const [meetings, setMeetings] = useState<ScheduledMeetingHost[]>([]);
	const [total, setTotal] = useState(0);
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(10);
	const [statusFilter, setStatusFilter] = useState<MeetingStatus | ''>('scheduled');
	const [cancelTarget, setCancelTarget] = useState<ScheduledMeetingHost | null>(null);
	const [cancelReason, setCancelReason] = useState('');

	const load = async () => {
		setLoading(true);
		try {
			const response = await bookingService.listMyMeetings({
				status: statusFilter || undefined,
				page: page + 1,
				pageSize: rowsPerPage,
			});
			setMeetings(response.items);
			setTotal(response.total);
		} catch {
			toast.error('Failed to load meetings.');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		load();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [page, rowsPerPage, statusFilter]);

	const handleCancelConfirm = async () => {
		if (!cancelTarget) return;
		try {
			await bookingService.hostCancelMeeting(cancelTarget.public_id, cancelReason || undefined);
			toast.success('Meeting cancelled.');
			setCancelTarget(null);
			setCancelReason('');
			load();
		} catch {
			toast.error('Failed to cancel meeting.');
		}
	};

	return (
		<Box>
			<PageHeader title="Meetings" subtitle="Meetings booked through your booking page(s)." />

			<Stack direction="row" spacing={2} sx={{ mb: 2 }}>
				<TextField
					select size="small" label="Status" sx={{ width: 200 }}
					value={statusFilter} onChange={(e) => { setPage(0); setStatusFilter(e.target.value as MeetingStatus | ''); }}
				>
					<MenuItem value="">All</MenuItem>
					<MenuItem value="scheduled">Scheduled</MenuItem>
					<MenuItem value="completed">Completed</MenuItem>
					<MenuItem value="cancelled">Cancelled</MenuItem>
				</TextField>
			</Stack>

			<Card variant="outlined">
				{loading ? (
					<Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
				) : meetings.length === 0 ? (
					<Box sx={{ p: 4, textAlign: 'center' }}>
						<Typography color="text.secondary">No meetings found.</Typography>
					</Box>
				) : (
					<Table>
						<TableHead>
							<TableRow>
								<TableCell>Client</TableCell>
								<TableCell>When</TableCell>
								<TableCell>Meeting Link</TableCell>
								<TableCell>Status</TableCell>
								<TableCell>Calendar Sync</TableCell>
								<TableCell align="right">Actions</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{meetings.map((m) => (
								<TableRow key={m.public_id} hover>
									<TableCell>
										<Typography variant="body2" fontWeight={600}>{m.client_name}</Typography>
										<Typography variant="caption" color="text.secondary">{m.client_email}</Typography>
									</TableCell>
									<TableCell>
										{new Date(m.start_time).toLocaleString(undefined, {
											dateStyle: 'medium', timeStyle: 'short',
										})}
									</TableCell>
									<TableCell>
										{m.google_meet_link ? (
											<a href={m.google_meet_link} target="_blank" rel="noreferrer">Join</a>
										) : (
											<Typography variant="caption" color="text.secondary">—</Typography>
										)}
									</TableCell>
									<TableCell><Chip size="small" color={STATUS_COLOR[m.status]} label={m.status} /></TableCell>
									<TableCell>
										<Typography variant="caption" color="text.secondary">
											{SYNC_LABEL[m.calendar_sync_status] || m.calendar_sync_status}
										</Typography>
									</TableCell>
									<TableCell align="right">
										{m.status === 'scheduled' && (
											<Button size="small" color="error" onClick={() => setCancelTarget(m)}>Cancel</Button>
										)}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				)}
				<TablePagination
					component="div"
					count={total}
					page={page}
					onPageChange={(_, p) => setPage(p)}
					rowsPerPage={rowsPerPage}
					onRowsPerPageChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(0); }}
				/>
			</Card>

			<Dialog open={!!cancelTarget} onClose={() => setCancelTarget(null)}>
				<DialogTitle>Cancel meeting with {cancelTarget?.client_name}?</DialogTitle>
				<DialogContent>
					<TextField
						autoFocus fullWidth multiline minRows={2} sx={{ mt: 1 }}
						label="Reason (optional, shared with the client)"
						value={cancelReason}
						onChange={(e) => setCancelReason(e.target.value)}
					/>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setCancelTarget(null)}>Back</Button>
					<Button color="error" variant="contained" onClick={handleCancelConfirm}>Cancel Meeting</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
};

export default MyMeetingsPage;
