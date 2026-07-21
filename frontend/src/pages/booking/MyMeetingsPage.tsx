import React, { useEffect, useRef, useState } from 'react';
import { Box, Stack, Typography, Switch, TableRow, TableCell, ToggleButtonGroup, ToggleButton, Button, TextField } from '@mui/material';
import { VideocamOutlined } from '@mui/icons-material';
import PageHeader from '../../components/common/page-header';
import { DataTable, type ColumnDefinition } from '../../components/common/table';
import StatusBadge from '../../components/common/badge/StatusBadge';
import EnterpriseAvatar from '../../components/common/avatar/Avatar';
import ConfirmationDialog from '../../components/common/dialogbox/ConfirmationDialog';
import { NewMeetingDialog, RescheduleMeetingDialog } from '../../components/booking';
import useToast from '../../hooks/useToast';
import bookingService from '../../services/bookingService';
import type { ScheduledMeetingHost, MeetingStatus } from '../../models/booking/meeting';
import type { BookingPage } from '../../models/booking/bookingPage';

const SYNC_LABEL: Record<string, string> = {
	not_applicable: 'Manual Link',
	pending: 'Syncing to Google…',
	synced: 'Synced',
	failed: 'Sync Failed',
};

const STATUS_TABS: { value: MeetingStatus | ''; label: string }[] = [
	{ value: '', label: 'All' },
	{ value: 'scheduled', label: 'Scheduled' },
	{ value: 'completed', label: 'Completed' },
	{ value: 'cancelled', label: 'Cancelled' },
];

const MyMeetingsPage: React.FC = () => {
	const toast = useToast();
	const [loading, setLoading] = useState(true);
	const [meetings, setMeetings] = useState<ScheduledMeetingHost[]>([]);
	const [total, setTotal] = useState(0);
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(10);
	const [statusFilter, setStatusFilter] = useState<MeetingStatus | ''>('');
	const [upcomingOnly, setUpcomingOnly] = useState(true);
	const [searchTerm, setSearchTerm] = useState('');

	const [bookingPages, setBookingPages] = useState<BookingPage[]>([]);
	const [newMeetingOpen, setNewMeetingOpen] = useState(false);
	const [rescheduleTarget, setRescheduleTarget] = useState<ScheduledMeetingHost | null>(null);
	const [cancelTarget, setCancelTarget] = useState<ScheduledMeetingHost | null>(null);
	const [cancelReason, setCancelReason] = useState('');
	const [cancelling, setCancelling] = useState(false);

	const searchDebounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

	const load = async () => {
		setLoading(true);
		try {
			const response = await bookingService.listMyMeetings({
				status: statusFilter || undefined,
				upcomingOnly,
				search: searchTerm || undefined,
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
		bookingService.listMyBookingPages().then(setBookingPages).catch(() => {});
	}, []);

	useEffect(() => {
		load();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [page, rowsPerPage, statusFilter, upcomingOnly, searchTerm]);

	const handleSearchChange = (value: string) => {
		if (searchDebounce.current) clearTimeout(searchDebounce.current);
		searchDebounce.current = setTimeout(() => {
			setPage(0);
			setSearchTerm(value);
		}, 350);
	};

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
		{ id: 'start_time', label: 'Date / Time' },
		{ id: 'google_meet_link', label: 'Meeting Link', hideOnMobile: true },
		{ id: 'calendar_sync_status', label: 'Sync Status', hideOnMobile: true },
		{ id: 'status', label: 'Status' },
		{ id: 'actions', label: 'Actions', align: 'right', width: 160 },
	];

	const renderRow = (m: ScheduledMeetingHost) => (
		<TableRow key={m.public_id} hover>
			<TableCell>
				<Stack direction="row" spacing={1.25} alignItems="center">
					<EnterpriseAvatar name={m.client_name} size={32} />
					<Box sx={{ minWidth: 0 }}>
						<Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{m.client_name}</Typography>
						<Typography variant="caption" color="text.secondary" noWrap>{m.client_email}</Typography>
					</Box>
				</Stack>
			</TableCell>
			<TableCell>
				<Typography variant="body2">
					{new Date(m.start_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
				</Typography>
				<Typography variant="caption" color="text.secondary">
					{new Date(m.start_time).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })} – {new Date(m.end_time).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
				</Typography>
			</TableCell>
			<TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
				{m.google_meet_link ? (
					<Button
						size="small" variant="outlined" startIcon={<VideocamOutlined sx={{ fontSize: 15 }} />}
						component="a" href={m.google_meet_link} target="_blank" rel="noreferrer"
						sx={{ borderRadius: 2, textTransform: 'none', fontSize: '0.75rem' }}
					>
						Join
					</Button>
				) : (
					<Typography variant="caption" color="text.secondary">—</Typography>
				)}
			</TableCell>
			<TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
				<StatusBadge type="googleSync" status={m.calendar_sync_status} label={SYNC_LABEL[m.calendar_sync_status] || m.calendar_sync_status} />
			</TableCell>
			<TableCell><StatusBadge type="booking" status={m.status} label={m.status} /></TableCell>
			<TableCell align="right">
				{m.status === 'scheduled' ? (
					<Stack direction="row" spacing={0.5} justifyContent="flex-end">
						<Button size="small" onClick={() => setRescheduleTarget(m)} sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.75rem' }}>
							Reschedule
						</Button>
						<Button size="small" color="error" onClick={() => setCancelTarget(m)} sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.75rem' }}>
							Cancel
						</Button>
					</Stack>
				) : (
					<Typography variant="caption" color="text.secondary">—</Typography>
				)}
			</TableCell>
		</TableRow>
	);

	return (
		<Box>
			<Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} sx={{ mb: 3 }}>
				<PageHeader
					title="Meetings Overview"
					subtitle="Manage your upcoming and past bookings, calendar sync, and client interactions."
					mb={0}
				/>
				<Stack direction="row" spacing={1} alignItems="center">
					<Typography variant="body2" sx={{ fontWeight: 600 }}>Upcoming Only</Typography>
					<Switch checked={upcomingOnly} onChange={(e) => { setPage(0); setUpcomingOnly(e.target.checked); }} />
				</Stack>
			</Stack>

			<DataTable<ScheduledMeetingHost>
				columns={columns}
				data={meetings}
				loading={loading}
				totalCount={total}
				page={page}
				rowsPerPage={rowsPerPage}
				onPageChange={(_, p) => setPage(p)}
				onRowsPerPageChange={(newRowsPerPage) => { setRowsPerPage(newRowsPerPage); setPage(0); }}
				searchTerm={searchTerm}
				onSearchChange={handleSearchChange}
				searchPlaceholder="Search clients or emails…"
				onRefresh={load}
				canCreate
				onCreateClick={() => setNewMeetingOpen(true)}
				createButtonText="New Meeting"
				headerActions={
					<ToggleButtonGroup
						exclusive size="small" value={statusFilter}
						onChange={(_, v) => { if (v !== null) { setPage(0); setStatusFilter(v); } }}
						sx={{ '& .MuiToggleButton-root': { textTransform: 'none', fontWeight: 600, fontSize: '0.75rem', px: 1.5 } }}
					>
						{STATUS_TABS.map((t) => (
							<ToggleButton key={t.value} value={t.value}>{t.label}</ToggleButton>
						))}
					</ToggleButtonGroup>
				}
				renderRow={renderRow}
				emptyMessage="No meetings yet — share your booking link or create one manually to get started."
			/>

			<NewMeetingDialog
				open={newMeetingOpen}
				onClose={() => setNewMeetingOpen(false)}
				bookingPages={bookingPages}
				onCreated={() => load()}
			/>

			<RescheduleMeetingDialog
				open={!!rescheduleTarget}
				onClose={() => setRescheduleTarget(null)}
				meeting={rescheduleTarget}
				bookingPages={bookingPages}
				onRescheduled={() => load()}
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
					fullWidth multiline minRows={2}
					label="Reason (optional, shared with the client)"
					value={cancelReason}
					onChange={(e) => setCancelReason(e.target.value)}
				/>
			</ConfirmationDialog>
		</Box>
	);
};

export default MyMeetingsPage;
