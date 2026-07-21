import React, { useEffect, useState } from 'react';
import { Box, Stack, Typography, TextField, MenuItem, TableRow, TableCell } from '@mui/material';
import { CancelOutlined, VideocamOutlined } from '@mui/icons-material';
import PageHeader from '../../components/common/page-header';
import { DataTable, DataTableActions, type ColumnDefinition, type TableMenuAction } from '../../components/common/table';
import StatusBadge from '../../components/common/badge/StatusBadge';
import ConfirmationDialog from '../../components/common/dialogbox/ConfirmationDialog';
import useToast from '../../hooks/useToast';
import bookingService from '../../services/bookingService';
import type { ScheduledMeetingHost, MeetingStatus } from '../../models/booking/meeting';

const SYNC_LABEL: Record<string, string> = {
	not_applicable: 'Email invite only',
	pending: 'Syncing…',
	synced: 'Synced',
	failed: 'Sync failed',
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
	const [cancelling, setCancelling] = useState(false);

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
		setCancelling(true);
		try {
			await bookingService.hostCancelMeeting(cancelTarget.public_id, cancelReason || undefined);
			toast.success('Meeting cancelled.');
			setCancelTarget(null);
			setCancelReason('');
			load();
		} catch {
			toast.error('Failed to cancel meeting.');
		} finally {
			setCancelling(false);
		}
	};

	const columns: ColumnDefinition<ScheduledMeetingHost>[] = [
		{ id: 'client_name', label: 'Client' },
		{ id: 'start_time', label: 'When' },
		{ id: 'google_meet_link', label: 'Meeting Link', hideOnMobile: true },
		{ id: 'status', label: 'Status' },
		{ id: 'calendar_sync_status', label: 'Calendar Sync', hideOnMobile: true },
		{ id: 'actions', label: '', align: 'right', width: 56 },
	];

	const renderRow = (m: ScheduledMeetingHost) => {
		const actions: TableMenuAction<ScheduledMeetingHost>[] = [
			{
				label: 'Cancel Meeting',
				icon: <CancelOutlined fontSize="small" />,
				onClick: () => setCancelTarget(m),
				color: 'error.main',
				hidden: m.status !== 'scheduled',
			},
		];

		return (
			<TableRow key={m.public_id} hover>
				<TableCell>
					<Typography variant="body2" sx={{ fontWeight: 600 }}>{m.client_name}</Typography>
					<Typography variant="caption" color="text.secondary">{m.client_email}</Typography>
				</TableCell>
				<TableCell>
					{new Date(m.start_time).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
				</TableCell>
				<TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
					{m.google_meet_link ? (
						<Stack
							direction="row" spacing={0.5} alignItems="center"
							component="a" href={m.google_meet_link} target="_blank" rel="noreferrer"
							sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
						>
							<VideocamOutlined sx={{ fontSize: 15 }} />
							<span>Join</span>
						</Stack>
					) : (
						<Typography variant="caption" color="text.secondary">—</Typography>
					)}
				</TableCell>
				<TableCell><StatusBadge type="booking" status={m.status} label={m.status} /></TableCell>
				<TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
					<StatusBadge type="googleSync" status={m.calendar_sync_status} label={SYNC_LABEL[m.calendar_sync_status] || m.calendar_sync_status} />
				</TableCell>
				<TableCell align="right" onClick={(e) => e.stopPropagation()}>
					<Stack direction="row" justifyContent="flex-end">
						<DataTableActions item={m} actions={actions} tooltipTitle="Meeting Actions" />
					</Stack>
				</TableCell>
			</TableRow>
		);
	};

	return (
		<Box>
			<PageHeader title="Meetings" subtitle="Meetings booked through your booking page." />

			<DataTable<ScheduledMeetingHost>
				columns={columns}
				data={meetings}
				loading={loading}
				totalCount={total}
				page={page}
				rowsPerPage={rowsPerPage}
				onPageChange={(_, p) => setPage(p)}
				onRowsPerPageChange={(newRowsPerPage) => { setRowsPerPage(newRowsPerPage); setPage(0); }}
				searchTerm=""
				onRefresh={load}
				headerActions={
					<TextField
						select size="small" label="Status" sx={{ width: 180 }}
						value={statusFilter} onChange={(e) => { setPage(0); setStatusFilter(e.target.value as MeetingStatus | ''); }}
					>
						<MenuItem value="">All</MenuItem>
						<MenuItem value="scheduled">Scheduled</MenuItem>
						<MenuItem value="completed">Completed</MenuItem>
						<MenuItem value="cancelled">Cancelled</MenuItem>
					</TextField>
				}
				renderRow={renderRow}
				emptyMessage="No meetings yet — share your booking link to start getting bookings."
			/>

			<ConfirmationDialog
				open={!!cancelTarget}
				onClose={() => { setCancelTarget(null); setCancelReason(''); }}
				onConfirm={handleCancelConfirm}
				title="Cancel this meeting?"
				subtitle={cancelTarget ? `With ${cancelTarget.client_name}` : undefined}
				message="The client will be notified by email and their calendar invite will be cancelled automatically."
				severity="error"
				confirmLabel="Cancel Meeting"
				cancelLabel="Back"
				loading={cancelling}
			>
				<TextField
					autoFocus fullWidth multiline minRows={2}
					label="Reason (optional, shared with the client)"
					value={cancelReason}
					onChange={(e) => setCancelReason(e.target.value)}
				/>
			</ConfirmationDialog>
		</Box>
	);
};

export default MyMeetingsPage;
