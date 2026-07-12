import React, { useMemo, useState } from 'react';
import { Chip, FormControl, MenuItem, Select, Stack, TableCell, TableRow, Tooltip, Typography, useTheme } from '@mui/material';
import { CancelOutlined as CancelIcon } from '@mui/icons-material';
import { DataTable, DataTableActions, type ColumnDefinition, type TableMenuAction } from '../../../common/table';
import ConfirmationDialog from '../../../common/dialogbox/ConfirmationDialog';
import { useAppDispatch } from '../../../../store/hooks';
import { cancelLeaveRequest } from '../../../../store/slices/hrSlice';
import useToast from '../../../../hooks/useToast';
import type { HRLeaveRequestResponse, LeaveStatus } from '../../../../models/hr';
import { LEAVE_STATUS_LABELS, LEAVE_STATUS_COLORS } from '../../../../models/hr';

interface LeaveHistoryTableProps {
	requests: HRLeaveRequestResponse[];
	loading: boolean;
}

const formatDate = (value: string) =>
	new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

const isCancellable = (req: HRLeaveRequestResponse) =>
	req.status === 'pending' || (req.status === 'approved' && new Date(req.from_date) > new Date());

const LeaveHistoryTable: React.FC<LeaveHistoryTableProps> = ({ requests, loading }) => {
	const theme = useTheme();
	const dispatch = useAppDispatch();
	const { success, error } = useToast();

	const [statusFilter, setStatusFilter] = useState<LeaveStatus | 'all'>('all');
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(10);
	const [cancelTarget, setCancelTarget] = useState<HRLeaveRequestResponse | null>(null);
	const [cancelling, setCancelling] = useState(false);

	const filtered = useMemo(
		() => (statusFilter === 'all' ? requests : requests.filter((r) => r.status === statusFilter)),
		[requests, statusFilter]
	);

	const paged = useMemo(
		() => filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
		[filtered, page, rowsPerPage]
	);

	const handleCancel = async () => {
		if (!cancelTarget) return;
		setCancelling(true);
		try {
			await dispatch(cancelLeaveRequest(cancelTarget.public_id)).unwrap();
			success('Leave request cancelled');
			setCancelTarget(null);
		} catch {
			error('Failed to cancel request');
		} finally {
			setCancelling(false);
		}
	};

	const columns: ColumnDefinition<HRLeaveRequestResponse>[] = [
		{ id: 'leave_type_name', label: 'Leave Type' },
		{ id: 'from_date', label: 'From' },
		{ id: 'to_date', label: 'To', hideOnMobile: true },
		{ id: 'total_days', label: 'Duration' },
		{ id: 'reason', label: 'Reason', hideOnMobile: true },
		{ id: 'status', label: 'Status' },
		{ id: 'actions', label: '', align: 'right' },
	];

	const renderRow = (req: HRLeaveRequestResponse) => {
		const actions: TableMenuAction<HRLeaveRequestResponse>[] = [
			{
				label: 'Cancel Request',
				icon: <CancelIcon fontSize="small" />,
				color: 'error.main',
				onClick: () => setCancelTarget(req),
				hidden: !isCancellable(req),
			},
		];

		return (
			<TableRow key={req.public_id} hover>
				<TableCell sx={{ fontWeight: 600 }}>{req.leave_type_name}</TableCell>
				<TableCell>{formatDate(req.from_date)}</TableCell>
				<TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{formatDate(req.to_date)}</TableCell>
				<TableCell>{req.total_days} day{req.total_days !== 1 ? 's' : ''}</TableCell>
				<TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, maxWidth: 220 }}>
					<Tooltip title={req.reason || 'No reason provided'}>
						<Typography variant="body2" noWrap>{req.reason || '—'}</Typography>
					</Tooltip>
				</TableCell>
				<TableCell>
					<Chip label={LEAVE_STATUS_LABELS[req.status]} color={LEAVE_STATUS_COLORS[req.status]} size="small" sx={{ fontWeight: 600 }} />
				</TableCell>
				<TableCell align="right" onClick={(e) => e.stopPropagation()}>
					<Stack direction="row" justifyContent="flex-end">
						<DataTableActions item={req} actions={actions} tooltipTitle="Request Actions" />
					</Stack>
				</TableCell>
			</TableRow>
		);
	};

	const statusOptions: Array<{ value: LeaveStatus | 'all'; label: string }> = [
		{ value: 'all', label: 'All Statuses' },
		{ value: 'pending', label: 'Pending Approval' },
		{ value: 'approved', label: 'Approved' },
		{ value: 'rejected', label: 'Rejected' },
		{ value: 'cancelled', label: 'Cancelled' },
	];

	return (
		<>
			<DataTable<HRLeaveRequestResponse>
				columns={columns}
				data={paged}
				loading={loading}
				totalCount={filtered.length}
				page={page}
				rowsPerPage={rowsPerPage}
				onPageChange={(_, newPage) => setPage(newPage)}
				onRowsPerPageChange={(newRows) => { setRowsPerPage(newRows); setPage(0); }}
				searchTerm=""
				emptyMessage="No leave applications yet."
				renderRow={renderRow}
				headerActions={
					<FormControl size="small" sx={{ minWidth: 180 }}>
						<Select
							value={statusFilter}
							onChange={(e) => { setStatusFilter(e.target.value as LeaveStatus | 'all'); setPage(0); }}
							sx={{
								borderRadius: '12px',
								bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.015)',
							}}
						>
							{statusOptions.map((opt) => (
								<MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
							))}
						</Select>
					</FormControl>
				}
			/>

			<ConfirmationDialog
				open={!!cancelTarget}
				onClose={() => setCancelTarget(null)}
				onConfirm={handleCancel}
				title="Cancel Leave Request"
				message={
					cancelTarget
						? `Are you sure you want to cancel your ${cancelTarget.leave_type_name} request from ${formatDate(cancelTarget.from_date)} to ${formatDate(cancelTarget.to_date)}?`
						: ''
				}
				confirmLabel="Cancel Request"
				cancelLabel="Keep It"
				severity="error"
				loading={cancelling}
			/>
		</>
	);
};

export default LeaveHistoryTable;
