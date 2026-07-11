import React from 'react';
import {
	Typography,
	TableRow,
	TableCell,
	Stack,
	Button,
	Chip,
	TextField,
	Box,
	Tabs,
	Tab,
	Tooltip,
	IconButton,
	useTheme,
	alpha
} from '@mui/material';
import {
	LockOpen as LockOpenIcon,
	HourglassTop as PendingIcon,
	TaskAlt as ApprovedIcon,
	Cancel as DeniedIcon,
	CalendarMonth as CalendarIcon,
	ChatBubbleOutline as ReasonIcon,
	Check as CheckIcon,
	Close as CloseIcon
} from '@mui/icons-material';
import { useWeekUnlockRequests, type UnlockRequestFilter } from './hooks/useWeekUnlockRequests';
import { BaseDialog } from '../../common/dialogbox';
import { DataTable, type ColumnDefinition } from '../../common/table';
import EnterpriseAvatar from '../../common/avatar/Avatar';
import type { TimesheetWeekUnlockRequest } from '../../../models/timesheet';

interface WeekUnlockRequestsPanelProps {
	requests: TimesheetWeekUnlockRequest[];
	loading: boolean;
	onApprove: (requestId: number) => void;
	onDeny: (requestId: number, note?: string) => void;
}

const statusConfig: Record<string, { color: 'warning' | 'success' | 'error'; icon: React.ReactElement }> = {
	pending: { color: 'warning', icon: <PendingIcon sx={{ fontSize: 14 }} /> },
	approved: { color: 'success', icon: <ApprovedIcon sx={{ fontSize: 14 }} /> },
	denied: { color: 'error', icon: <DeniedIcon sx={{ fontSize: 14 }} /> }
};

const formatWeekRange = (startDate: string, endDate: string): string => {
	const start = new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	const end = new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	return `${start} — ${end}`;
};

const formatRelativeDate = (dateStr?: string): string => {
	if (!dateStr) return '—';
	return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const WeekUnlockRequestsPanel: React.FC<WeekUnlockRequestsPanelProps> = ({ requests, loading, onApprove, onDeny }) => {
	const theme = useTheme();

	const {
		denyTarget, setDenyTarget,
		denyNote, setDenyNote,
		filter, setFilter,
		counts,
		page, setPage,
		rowsPerPage, setRowsPerPage,
		filteredRequests,
		paginatedRequests,
		handleOpenDeny,
		handleConfirmDeny
	} = useWeekUnlockRequests({ requests, onDeny });

	const renderMember = (req: TimesheetWeekUnlockRequest) => {
		const name = req.user?.full_name || req.user?.email || `User #${req.user_id}`;
		return (
			<Stack direction="row" spacing={1.5} alignItems="center">
				<EnterpriseAvatar name={name} size={36} />
				<Box>
					<Typography variant="body2" sx={{ fontWeight: 700 }}>
						{name}
					</Typography>
					<Typography variant="caption" color="text.secondary">
						{req.user?.email}
					</Typography>
				</Box>
			</Stack>
		);
	};

	const renderWeek = (req: TimesheetWeekUnlockRequest) => (
		<Stack direction="row" spacing={1} alignItems="center">
			<CalendarIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
			<Box>
				<Typography variant="body2" sx={{ fontWeight: 600 }}>
					{formatWeekRange(req.week_start_date, req.week_end_date)}
				</Typography>
				<Typography variant="caption" color="text.secondary">
					Requested {formatRelativeDate(req.created_at)}
				</Typography>
			</Box>
		</Stack>
	);

	const renderReason = (reason?: string) =>
		reason ? (
			<Tooltip title={reason.length > 60 ? reason : ''} arrow placement="top">
				<Stack
					direction="row"
					spacing={0.75}
					alignItems="flex-start"
					sx={{
						maxWidth: 240,
						px: 1.25,
						py: 0.75,
						borderRadius: 2,
						bgcolor: alpha(theme.palette.text.primary, 0.03),
						border: '1px solid',
						borderColor: 'divider'
					}}
				>
					<ReasonIcon sx={{ fontSize: 16, color: 'text.secondary', mt: 0.25, flexShrink: 0 }} />
					<Typography
						variant="body2"
						color="text.secondary"
						sx={{
							overflow: 'hidden',
							textOverflow: 'ellipsis',
							display: '-webkit-box',
							WebkitLineClamp: 2,
							WebkitBoxOrient: 'vertical'
						}}
					>
						{reason}
					</Typography>
				</Stack>
			</Tooltip>
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

	const columns: ColumnDefinition<TimesheetWeekUnlockRequest>[] = [
		{ id: 'user_id', label: 'Team Member' },
		{ id: 'week_start_date', label: 'Week' },
		{ id: 'reason', label: 'Reason' },
		{ id: 'status', label: 'Status', align: 'center' },
		{ id: 'actions', label: 'Resolution', align: 'right' }
	];

	const renderRow = (req: TimesheetWeekUnlockRequest) => (
		<TableRow key={req.id} hover sx={{ '&:last-child td': { border: 0 } }}>
			<TableCell>{renderMember(req)}</TableCell>
			<TableCell>{renderWeek(req)}</TableCell>
			<TableCell>{renderReason(req.reason)}</TableCell>
			<TableCell align="center">{renderStatus(req.status)}</TableCell>
			<TableCell align="right" sx={{ pr: 3 }}>
				{req.status === 'pending' ? (
					<Stack direction="row" spacing={1} justifyContent="flex-end">
						<Tooltip title="Approve unlock request" arrow>
							<span>
								<IconButton
									size="small"
									onClick={() => onApprove(req.id)}
									disabled={loading}
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
						<Tooltip title="Deny unlock request" arrow>
							<span>
								<IconButton
									size="small"
									onClick={() => handleOpenDeny(req)}
									disabled={loading}
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
				) : req.resolution_note ? (
					<Typography variant="body2" color="text.secondary" sx={{ maxWidth: 220, ml: 'auto' }}>
						{req.resolution_note}
					</Typography>
				) : (
					<Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>
						{req.status === 'approved' ? 'Granted, no note' : 'No note'}
					</Typography>
				)}
			</TableCell>
		</TableRow>
	);

	const tabConfig: { value: UnlockRequestFilter; label: string; count: number }[] = [
		{ value: 'pending', label: 'Pending', count: counts.pending },
		{ value: 'approved', label: 'Approved', count: counts.approved },
		{ value: 'denied', label: 'Denied', count: counts.denied },
		{ value: 'all', label: 'All', count: counts.all }
	];

	return (
		<Stack spacing={2}>
			<DataTable<TimesheetWeekUnlockRequest>
				columns={columns}
				data={paginatedRequests}
				loading={loading}
				totalCount={filteredRequests.length}
				page={page}
				rowsPerPage={rowsPerPage}
				onPageChange={(_, newPage) => setPage(newPage)}
				onRowsPerPageChange={(rows) => { setRowsPerPage(rows); setPage(0); }}
				searchTerm=""
				headerActions={
					<Stack
						direction={{ xs: 'column', sm: 'row' }}
						justifyContent="space-between"
						alignItems={{ xs: 'flex-start', sm: 'center' }}
						spacing={1.5}
						sx={{ width: '100%' }}
					>
						<Stack direction="row" spacing={1} alignItems="center">
							<LockOpenIcon sx={{ fontSize: 20, color: 'warning.main' }} />
							<Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
								Week Unlock Requests
							</Typography>
						</Stack>
						<Tabs
							value={filter}
							onChange={(_, value: UnlockRequestFilter) => setFilter(value)}
							variant="scrollable"
							scrollButtons="auto"
							allowScrollButtonsMobile
							sx={{ minHeight: 36, maxWidth: '100%', '& .MuiTab-root': { minHeight: 36, py: 0.5, textTransform: 'none', fontWeight: 600 } }}
						>
							{tabConfig.map((tab) => (
								<Tab
									key={tab.value}
									value={tab.value}
									label={
										<Stack direction="row" spacing={0.75} alignItems="center">
											<span>{tab.label}</span>
											<Chip
												label={tab.count}
												size="small"
												sx={{
													height: 18,
													minWidth: 18,
													fontSize: '0.7rem',
													fontWeight: 700,
													bgcolor: filter === tab.value ? 'primary.main' : alpha(theme.palette.text.primary, 0.08),
													color: filter === tab.value ? 'primary.contrastText' : 'text.secondary'
												}}
											/>
										</Stack>
									}
								/>
							))}
						</Tabs>
					</Stack>
				}
				renderRow={renderRow}
				emptyMessage={loading ? 'Loading...' : `No ${filter === 'all' ? '' : filter} unlock requests.`}
			/>

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
