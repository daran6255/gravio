import React, { useState, useEffect, useMemo } from 'react';
import {
	TableRow,
	TableCell,
	Stack,
	Typography,
	Box,
	Chip,
	Checkbox,
	IconButton,
	Tooltip,
	TextField,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	useTheme,
	alpha,
	Tabs,
	Tab
} from '@mui/material';
import { SubmitButton, CancelButton, AddButton } from '../../../common/button';
import {
	EventAvailable as LeaveIcon,
	HourglassTop as PendingIcon,
	TaskAlt as ApprovedIcon,
	Cancel as DeniedIcon,
	CalendarMonth as CalendarIcon,
	Check as CheckIcon,
	Close as CloseIcon
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { fetchTeamLeaveRequests, approveRejectLeaveRequest, bulkApproveRejectLeaveRequests } from '../../../../store/slices/hrSlice';
import type { HRLeaveRequestResponse } from '../../../../models/hr';
import useToast from '../../../../hooks/useToast';
import { DataTable, type ColumnDefinition } from '../../../common/table';
import EnterpriseAvatar from '../../../common/avatar/Avatar';

const statusConfig: Record<string, { color: 'warning' | 'success' | 'error'; icon: React.ReactElement }> = {
	pending: { color: 'warning', icon: <PendingIcon sx={{ fontSize: 14 }} /> },
	approved: { color: 'success', icon: <ApprovedIcon sx={{ fontSize: 14 }} /> },
	rejected: { color: 'error', icon: <DeniedIcon sx={{ fontSize: 14 }} /> }
};

export const TeamLeavesApprovalsTable: React.FC = () => {
	const theme = useTheme();
	const dispatch = useAppDispatch();
	const { success, error } = useToast();

	const { teamLeaveRequests: requests, teamLeaveRequestsLoading: loading } = useAppSelector((state) => state.hr);

	const [statusTab, setStatusTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
	const [resolveTarget, setResolveTarget] = useState<HRLeaveRequestResponse | null>(null);
	const [statusType, setStatusType] = useState<'approved' | 'rejected' | null>(null);
	const [managerNotes, setManagerNotes] = useState('');
	const [submitting, setSubmitting] = useState(false);

	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(10);
	const [selectedIds, setSelectedIds] = useState<string[]>([]);
	const [bulkSubmitting, setBulkSubmitting] = useState(false);

	// Fetch all team leave requests on mount
	useEffect(() => {
		dispatch(fetchTeamLeaveRequests(undefined));
	}, [dispatch]);

	// Reset page and selection when tab changes
	useEffect(() => {
		setPage(0);
		setSelectedIds([]);
	}, [statusTab]);

	// Filtered requests based on active tab
	const filteredRequests = useMemo(() => {
		if (statusTab === 'all') return requests;
		return requests.filter((r) => r.status === statusTab);
	}, [requests, statusTab]);

	// Paginated requests
	const paginatedRequests = useMemo(() => {
		const start = page * rowsPerPage;
		return filteredRequests.slice(start, start + rowsPerPage);
	}, [filteredRequests, page, rowsPerPage]);

	// Compute counts for tab badges
	const counts = useMemo(() => {
		return {
			pending: requests.filter((r) => r.status === 'pending').length,
			approved: requests.filter((r) => r.status === 'approved').length,
			rejected: requests.filter((r) => r.status === 'rejected').length,
			all: requests.length
		};
	}, [requests]);

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
			dispatch(fetchTeamLeaveRequests(undefined));
		} catch (e: any) {
			error(e || 'Failed to update leave request status');
		} finally {
			setSubmitting(false);
		}
	};

	const pendingIdsOnPage = useMemo(
		() => paginatedRequests.filter((r) => r.status === 'pending').map((r) => r.public_id),
		[paginatedRequests]
	);

	const toggleSelect = (publicId: string) => {
		setSelectedIds((prev) => (prev.includes(publicId) ? prev.filter((id) => id !== publicId) : [...prev, publicId]));
	};

	const toggleSelectAll = () => {
		setSelectedIds((prev) => (prev.length === pendingIdsOnPage.length ? [] : pendingIdsOnPage));
	};

	const handleBulkApprove = async () => {
		if (selectedIds.length === 0) return;
		setBulkSubmitting(true);
		try {
			const result = await dispatch(bulkApproveRejectLeaveRequests({
				public_ids: selectedIds,
				status: 'approved',
			})).unwrap();
			success(`Approved ${result.total_resolved_count} leave request(s).`);
			setSelectedIds([]);
			dispatch(fetchTeamLeaveRequests(undefined));
		} catch (e: any) {
			error(e || 'Failed to bulk-approve leave requests');
		} finally {
			setBulkSubmitting(false);
		}
	};

	const renderMember = (req: HRLeaveRequestResponse) => {
		const name = req.employee_name || '—';
		return (
			<Stack direction="row" spacing={1.5} alignItems="center">
				<EnterpriseAvatar name={name} size={36} />
				<Box>
					<Typography variant="body2" sx={{ fontWeight: 700 }}>
						{name}
					</Typography>
					<Typography variant="caption" color="text.secondary">
						Code: {req.employee_code || '—'}
					</Typography>
				</Box>
			</Stack>
		);
	};

	const renderLeaveType = (req: HRLeaveRequestResponse) => (
		<Box>
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
		</Box>
	);

	const renderDuration = (req: HRLeaveRequestResponse) => (
		<Box textAlign="center">
			<Typography variant="body2" fontWeight={700}>
				{req.total_days} day{req.total_days === 1 ? '' : 's'}
			</Typography>
			{req.is_half_day && (
				<Typography variant="caption" color="text.secondary" display="block">
					Half day ({req.half_day_session})
				</Typography>
			)}
		</Box>
	);

	const renderDates = (req: HRLeaveRequestResponse) => (
		<Stack direction="row" spacing={1} alignItems="center">
			<CalendarIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
			<Box>
				<Typography variant="body2" sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
					{new Date(req.from_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
					{' — '}
					{new Date(req.to_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
				</Typography>
				<Typography variant="caption" color="text.secondary">
					Requested {new Date(req.from_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
				</Typography>
			</Box>
		</Stack>
	);

	const renderReason = (reason?: string | null) =>
		reason ? (
			<Typography variant="body2" color="text.secondary" sx={{ maxWidth: 220, wordBreak: 'break-word' }}>
				{reason}
			</Typography>
		) : (
			<Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>
				No reason given
			</Typography>
		);

	const renderStatus = (status: string) => {
		const config = statusConfig[status];
		return (
			<Chip
				icon={config?.icon}
				label={status.charAt(0).toUpperCase() + status.slice(1)}
				color={config?.color}
				size="small"
				sx={{ fontWeight: 700, borderRadius: 3, '& .MuiChip-icon': { ml: '6px' } }}
			/>
		);
	};

	const columns: ColumnDefinition<HRLeaveRequestResponse>[] = [
		{
			// Nominal id only (satisfies ColumnDefinition's keyof T typing) --
			// renderRow fully controls this column's actual cell content.
			id: 'id',
			label: pendingIdsOnPage.length > 0 ? (
				<Checkbox
					size="small"
					checked={selectedIds.length > 0 && selectedIds.length === pendingIdsOnPage.length}
					indeterminate={selectedIds.length > 0 && selectedIds.length < pendingIdsOnPage.length}
					onChange={toggleSelectAll}
					sx={{ p: 0 }}
				/>
			) : '',
			width: 40,
		},
		{ id: 'employee_name', label: 'TEAM MEMBER' },
		{ id: 'leave_type_name', label: 'LEAVE TYPE' },
		{ id: 'total_days', label: 'DURATION', align: 'center' },
		{ id: 'from_date', label: 'DATES' },
		{ id: 'reason', label: 'REASON' },
		{ id: 'status', label: 'STATUS', align: 'center' },
		{ id: 'actions', label: 'RESOLUTION', align: 'right' }
	];

	const renderRow = (req: HRLeaveRequestResponse) => (
		<TableRow key={req.public_id} hover sx={{ '&:last-child td': { border: 0 } }}>
			<TableCell onClick={(e) => e.stopPropagation()}>
				{req.status === 'pending' && (
					<Checkbox
						size="small"
						checked={selectedIds.includes(req.public_id)}
						onChange={() => toggleSelect(req.public_id)}
						sx={{ p: 0 }}
					/>
				)}
			</TableCell>
			<TableCell>{renderMember(req)}</TableCell>
			<TableCell>{renderLeaveType(req)}</TableCell>
			<TableCell align="center">{renderDuration(req)}</TableCell>
			<TableCell>{renderDates(req)}</TableCell>
			<TableCell>{renderReason(req.reason)}</TableCell>
			<TableCell align="center">{renderStatus(req.status)}</TableCell>
			<TableCell align="right" sx={{ pr: 3 }}>
				{req.status === 'pending' ? (
					<Stack direction="row" spacing={1} justifyContent="flex-end">
						<Tooltip title="Approve leave request" arrow>
							<span>
								<IconButton
									size="small"
									onClick={() => handleOpenResolveDialog(req, 'approved')}
									disabled={loading || submitting}
									sx={{
										bgcolor: alpha(theme.palette.success.main, 0.1),
										color: 'success.main',
										'&:hover': { bgcolor: alpha(theme.palette.success.main, 0.2) }
									}}
								>
									<CheckIcon fontSize="small" />
								</IconButton>
							</span>
						</Tooltip>
						<Tooltip title="Reject leave request" arrow>
							<span>
								<IconButton
									size="small"
									onClick={() => handleOpenResolveDialog(req, 'rejected')}
									disabled={loading || submitting}
									sx={{
										bgcolor: alpha(theme.palette.error.main, 0.1),
										color: 'error.main',
										'&:hover': { bgcolor: alpha(theme.palette.error.main, 0.2) }
									}}
								>
									<CloseIcon fontSize="small" />
								</IconButton>
							</span>
						</Tooltip>
					</Stack>
				) : req.manager_notes ? (
					<Typography variant="body2" color="text.secondary" sx={{ maxWidth: 220, ml: 'auto', fontStyle: 'italic' }}>
						Notes: {req.manager_notes}
					</Typography>
				) : (
					<Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>
						No notes
					</Typography>
				)}
			</TableCell>
		</TableRow>
	);

	return (
		<Stack spacing={2}>
			<DataTable<HRLeaveRequestResponse>
				columns={columns}
				data={paginatedRequests}
				loading={loading}
				totalCount={filteredRequests.length}
				page={page}
				rowsPerPage={rowsPerPage}
				onPageChange={(_, newPage) => setPage(newPage)}
				onRowsPerPageChange={(rows) => { setRowsPerPage(rows); setPage(0); }}
				searchTerm=""
				emptyMessage={`No ${statusTab !== 'all' ? statusTab : ''} leave requests. Try adjusting your filters or search terms`}
				headerActions={
					<Stack
						direction={{ xs: 'column', sm: 'row' }}
						justifyContent="space-between"
						alignItems={{ xs: 'flex-start', sm: 'center' }}
						spacing={1.5}
						sx={{ width: '100%' }}
					>
						<Stack direction="row" spacing={1.5} alignItems="center">
							<Stack direction="row" spacing={1} alignItems="center">
								<LeaveIcon sx={{ fontSize: 20, color: 'primary.main' }} />
								<Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
									Leave Approvals
								</Typography>
							</Stack>
							{selectedIds.length > 0 && (
								<AddButton hideIcon size="small" onClick={handleBulkApprove} disabled={bulkSubmitting} sx={{ px: 2 }}>
									Approve Selected ({selectedIds.length})
								</AddButton>
							)}
						</Stack>
						<Tabs
							value={statusTab}
							onChange={(_, value) => setStatusTab(value)}
							variant="scrollable"
							scrollButtons="auto"
							allowScrollButtonsMobile
							sx={{
								minHeight: 36,
								maxWidth: '100%',
								'& .MuiTab-root': {
									minHeight: 36,
									py: 0.5,
									textTransform: 'none',
									fontWeight: 600
								}
							}}
						>
							<Tab
								value="pending"
								label={
									<Stack direction="row" spacing={1} alignItems="center">
										<span>Pending</span>
										<Chip
											label={counts.pending}
											size="small"
											sx={{
												height: 18,
												fontSize: '0.7rem',
												fontWeight: 700,
												bgcolor: statusTab === 'pending' ? alpha(theme.palette.primary.main, 0.15) : alpha(theme.palette.text.secondary, 0.08),
												color: statusTab === 'pending' ? 'primary.main' : 'text.secondary'
											}}
										/>
									</Stack>
								}
							/>
							<Tab
								value="approved"
								label={
									<Stack direction="row" spacing={1} alignItems="center">
										<span>Approved</span>
										<Chip
											label={counts.approved}
											size="small"
											sx={{
												height: 18,
												fontSize: '0.7rem',
												fontWeight: 700,
												bgcolor: statusTab === 'approved' ? alpha(theme.palette.success.main, 0.15) : alpha(theme.palette.text.secondary, 0.08),
												color: statusTab === 'approved' ? 'success.main' : 'text.secondary'
											}}
										/>
									</Stack>
								}
							/>
							<Tab
								value="rejected"
								label={
									<Stack direction="row" spacing={1} alignItems="center">
										<span>Rejected</span>
										<Chip
											label={counts.rejected}
											size="small"
											sx={{
												height: 18,
												fontSize: '0.7rem',
												fontWeight: 700,
												bgcolor: statusTab === 'rejected' ? alpha(theme.palette.error.main, 0.15) : alpha(theme.palette.text.secondary, 0.08),
												color: statusTab === 'rejected' ? 'error.main' : 'text.secondary'
											}}
										/>
									</Stack>
								}
							/>
							<Tab
								value="all"
								label={
									<Stack direction="row" spacing={1} alignItems="center">
										<span>All</span>
										<Chip
											label={counts.all}
											size="small"
											sx={{
												height: 18,
												fontSize: '0.7rem',
												fontWeight: 700,
												bgcolor: statusTab === 'all' ? alpha(theme.palette.text.primary, 0.15) : alpha(theme.palette.text.secondary, 0.08),
												color: statusTab === 'all' ? 'text.primary' : 'text.secondary'
											}}
										/>
									</Stack>
								}
							/>
						</Tabs>
					</Stack>
				}
				renderRow={renderRow}
			/>

			{/* Approve/Reject Dialogue */}
			<Dialog open={!!resolveTarget} onClose={handleCloseResolveDialog} maxWidth="xs" fullWidth>
				<DialogTitle sx={{ fontWeight: 700 }}>
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
					<CancelButton onClick={handleCloseResolveDialog} disabled={submitting} />
					<SubmitButton
						color={statusType === 'approved' ? 'success' : 'error'}
						onClick={handleConfirmResolve}
						loading={submitting}
						disabled={statusType === 'rejected' && !managerNotes.trim()}
						sx={{ color: statusType === 'approved' ? 'white' : 'inherit' }}
					>
						{statusType === 'approved' ? 'Approve' : 'Reject'}
					</SubmitButton>
				</DialogActions>
			</Dialog>
		</Stack>
	);
};

export default TeamLeavesApprovalsTable;
