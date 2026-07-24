import React from 'react';
import {
	TableRow,
	TableCell,
	Typography,
	IconButton,
	Checkbox,
	Box,
	Collapse,
	Stack,
	TextField,
	Tooltip,
	Divider,
	Chip,
	alpha,
	useTheme
} from '@mui/material';
import {
	KeyboardArrowDown as ExpandIcon,
	KeyboardArrowUp as CollapseIcon,
	TaskAlt as ApproveIcon,
	Cancel as RejectIcon,
	Undo as RevokeIcon,
	WarningAmberOutlined as OvertimeIcon,
	ScheduleOutlined as TargetIcon
} from '@mui/icons-material';
import type { ProjectTimeLog } from '../../../models/timesheet';
import TimesheetStatusBadge from '../shared/TimesheetStatusBadge';
import { formatHoursDisplay } from '../weekly-grid';
import { BaseDialog, ConfirmationDialog } from '../../common/dialogbox';
import { CancelButton, SubmitButton } from '../../common/button';
import { AddButton } from '../../common/button';
import { DataTable, DataTableActions, type ColumnDefinition, type TableMenuAction } from '../../common/table';
import { useTeamApprovals, groupLogsByProject, type ProjectGroup } from './hooks/useTeamApprovals';

interface TeamTimesheetTableProps {
	logs: ProjectTimeLog[];
	startDate: string;
	endDate: string;
	onApprove: (userId: number) => void;
	onReject: (userId: number, reason: string) => void;
	onUnapprove: (userId: number) => void;
	onBulkApprove: (userIds: number[]) => void;
	actionLoading: boolean;
	/** Only rows the viewer is authorized to act on get action buttons -- their own
	 * direct reports, or (for an admin) every row org-wide. The backend enforces the
	 * same two-tier rule (can_manage_timesheet_for), this just avoids showing buttons
	 * that would 403. */
	currentUserId?: number;
	isAdmin?: boolean;
	/** user_id -> weekly hour target, from GET /timesheets/team/settings. */
	weeklyHourTargets?: Record<number, number | undefined>;
	onSetWeeklyTarget: (userId: number, hours: number) => void;
}

const formatWeekRange = (startDate: string, endDate: string): string => {
	const start = new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	const end = new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	return `${start} — ${end}`;
};

interface UserGroupedTimesheet {
	userId: number;
	userName: string;
	userEmail: string;
	totalHours: number;
	status: 'draft' | 'submitted' | 'approved' | 'rejected';
	rejectionNote?: string;
	logs: ProjectTimeLog[];
	isManageable: boolean;
	weeklyHoursTarget: number;
	isOvertime: boolean;
}

const TeamTimesheetTable: React.FC<TeamTimesheetTableProps> = ({
	logs,
	startDate,
	endDate,
	onApprove,
	onReject,
	onUnapprove,
	onBulkApprove,
	actionLoading,
	currentUserId,
	isAdmin,
	weeklyHourTargets,
	onSetWeeklyTarget
}) => {
	const theme = useTheme();
	const [targetEditTarget, setTargetEditTarget] = React.useState<UserGroupedTimesheet | null>(null);
	const [targetHoursInput, setTargetHoursInput] = React.useState('');

	const handleOpenTargetDialog = (sheet: UserGroupedTimesheet) => {
		setTargetEditTarget(sheet);
		setTargetHoursInput(String(sheet.weeklyHoursTarget));
	};

	const handleSaveTarget = () => {
		const hours = Number(targetHoursInput);
		if (targetEditTarget && hours > 0 && hours <= 168) {
			onSetWeeklyTarget(targetEditTarget.userId, hours);
			setTargetEditTarget(null);
		}
	};

	const {
		expandedUser, setExpandedUser,
		rejectUserId,
		rejectionReason, setRejectionReason,
		revokeTarget, setRevokeTarget,
		page, setPage,
		rowsPerPage, setRowsPerPage,
		groupedTimesheets,
		paginatedTimesheets,
		selectedUserIds,
		selectableUserIds,
		toggleSelectUser,
		toggleSelectAll,
		clearSelection,
		handleOpenRejectDialog,
		handleCloseRejectDialog,
		handleConfirmReject,
		handleConfirmRevoke
	} = useTeamApprovals({ logs, onReject, onUnapprove, currentUserId, isAdmin, weeklyHourTargets });

	const handleBulkApprove = () => {
		if (selectedUserIds.length === 0) return;
		onBulkApprove(selectedUserIds);
		clearSelection();
	};

	const columns: ColumnDefinition<UserGroupedTimesheet>[] = [
		{
			// Nominal id only -- renderRow fully controls cell content per row, this
			// just needs to satisfy ColumnDefinition's `keyof T` typing.
			id: 'isManageable',
			label: selectableUserIds.length > 0 ? (
				<Checkbox
					size="small"
					checked={selectedUserIds.length > 0 && selectedUserIds.length === selectableUserIds.length}
					indeterminate={selectedUserIds.length > 0 && selectedUserIds.length < selectableUserIds.length}
					onChange={toggleSelectAll}
				/>
			) : '',
			width: 40
		},
		{ id: 'userId', label: '', width: 50 },
		{ id: 'userName', label: 'Team Member' },
		{ id: 'totalHours', label: 'Total Hours', align: 'center' },
		{ id: 'status', label: 'Weekly Status', align: 'center' },
		{ id: 'actions', label: 'Actions', align: 'right' }
	];

	const formatEntryDate = (dateStr: string): string =>
		new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });

	const renderProjectGroups = (logs: ProjectTimeLog[]) => {
		const groups: ProjectGroup[] = groupLogsByProject(logs);

		return (
			<Stack spacing={1.5}>
				{groups.map((group) => (
					<Box key={group.key} sx={{ border: 1, borderColor: 'divider', borderRadius: 3, overflow: 'hidden', bgcolor: 'background.paper' }}>
						<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 2, py: 1, bgcolor: 'action.hover' }}>
							<Typography variant="body2" sx={{ fontWeight: 700 }}>
								{group.label}
							</Typography>
							<Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
								{formatHoursDisplay(group.totalHours)}
							</Typography>
						</Stack>

						<Stack divider={<Divider />} sx={{ px: 2 }}>
							{group.taskGroups.map((task) => (
								<Box key={task.key} sx={{ py: 1.25 }}>
									<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.75 }}>
										<Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
											{task.label}
										</Typography>
										<Typography variant="caption" sx={{ fontWeight: 700 }}>
											{formatHoursDisplay(task.totalHours)}
										</Typography>
									</Stack>
									<Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
										{task.entries.map((entry) => (
											<Tooltip key={entry.logId} title={entry.notes || ''} disableHoverListener={!entry.notes}>
												<Box
													sx={{
														display: 'flex',
														alignItems: 'center',
														gap: 0.75,
														px: 1.25,
														py: 0.5,
														borderRadius: 2,
														bgcolor: 'action.selected'
													}}
												>
													<Typography variant="caption" sx={{ fontWeight: 600 }}>
														{formatEntryDate(entry.date)}
													</Typography>
													<Typography
														variant="caption"
														sx={{
															fontWeight: 700,
															color: entry.billingType === 'billable' ? 'success.main' : 'text.secondary'
														}}
													>
														{formatHoursDisplay(entry.hours)}
													</Typography>
												</Box>
											</Tooltip>
										))}
									</Stack>
								</Box>
							))}
						</Stack>
					</Box>
				))}
			</Stack>
		);
	};

	const renderRow = (sheet: UserGroupedTimesheet) => {
		const isExpanded = expandedUser === sheet.userId;

		const actions: TableMenuAction<UserGroupedTimesheet>[] = [
			{
				label: 'Approve',
				icon: <ApproveIcon fontSize="small" />,
				color: 'success.main',
				onClick: () => onApprove(sheet.userId),
				disabled: actionLoading,
				hidden: sheet.status !== 'submitted'
			},
			{
				label: 'Reject',
				icon: <RejectIcon fontSize="small" />,
				color: 'error.main',
				onClick: () => handleOpenRejectDialog(sheet.userId),
				disabled: actionLoading,
				hidden: sheet.status !== 'submitted'
			},
			{
				label: 'Revoke Approval',
				icon: <RevokeIcon fontSize="small" />,
				color: 'warning.main',
				onClick: () => setRevokeTarget(sheet),
				disabled: actionLoading,
				hidden: sheet.status !== 'submitted' && sheet.status !== 'approved'
			},
			{
				label: 'Set Weekly Target',
				icon: <TargetIcon fontSize="small" />,
				onClick: () => handleOpenTargetDialog(sheet),
				disabled: actionLoading,
				divider: true
			}
		];

		const isSelectable = sheet.status === 'submitted' && sheet.isManageable;

		return (
			<React.Fragment key={sheet.userId}>
				<TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
					<TableCell onClick={(e) => e.stopPropagation()}>
						{isSelectable && (
							<Checkbox
								size="small"
								checked={selectedUserIds.includes(sheet.userId)}
								onChange={() => toggleSelectUser(sheet.userId)}
							/>
						)}
					</TableCell>
					<TableCell>
						<IconButton
							size="small"
							onClick={() => setExpandedUser(isExpanded ? null : sheet.userId)}
						>
							{isExpanded ? <CollapseIcon /> : <ExpandIcon />}
						</IconButton>
					</TableCell>
					<TableCell>
						<Typography variant="body2" sx={{ fontWeight: 700 }}>
							{sheet.userName}
						</Typography>
						<Typography variant="caption" color="text.secondary">
							{sheet.userEmail}
						</Typography>
					</TableCell>
					<TableCell align="center">
						<Stack direction="row" spacing={0.75} alignItems="center" justifyContent="center">
							<Typography variant="body2" sx={{ fontWeight: 700 }}>
								{formatHoursDisplay(sheet.totalHours)}
							</Typography>
							<Typography variant="caption" color="text.secondary">
								/ {formatHoursDisplay(sheet.weeklyHoursTarget)}
							</Typography>
							{sheet.isOvertime && (
								<Tooltip title={`Over their ${formatHoursDisplay(sheet.weeklyHoursTarget)} weekly target`}>
									<Chip
										size="small"
										icon={<OvertimeIcon sx={{ fontSize: '0.85rem !important' }} />}
										label="Overtime"
										color="warning"
										variant="outlined"
										sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, '& .MuiChip-label': { px: 0.75 } }}
									/>
								</Tooltip>
							)}
						</Stack>
					</TableCell>
					<TableCell align="center">
						<TimesheetStatusBadge status={sheet.status} />
					</TableCell>
					<TableCell align="right" sx={{ pr: 3 }} onClick={(e) => e.stopPropagation()}>
						{sheet.isManageable ? (
							<Stack direction="row" justifyContent="flex-end">
								<DataTableActions item={sheet} tooltipTitle="Approval Actions" actions={actions} />
							</Stack>
						) : (
							(sheet.status === 'submitted' || sheet.status === 'approved') && (
								<Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
									Not your direct report
								</Typography>
							)
						)}
					</TableCell>
				</TableRow>

				<TableRow>
					<TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
						<Collapse in={isExpanded} timeout="auto" unmountOnExit>
							<Box sx={{ margin: 2, p: 2, bgcolor: 'action.hover', borderRadius: 4 }}>
								<Typography variant="subtitle2" gutterBottom component="div" sx={{ fontWeight: 700, mb: 2 }}>
									Project &amp; Task Breakdown ({startDate} to {endDate})
								</Typography>

								{sheet.rejectionNote && sheet.status === 'rejected' && (
									<Box sx={{ mb: 2, p: 1.5, bgcolor: alpha(theme.palette.error.main, 0.1), border: `1px solid ${theme.palette.error.main}`, borderRadius: 3 }}>
										<Typography variant="caption" sx={{ fontWeight: 700, color: 'error.main', display: 'block' }}>
											Rejection Reason:
										</Typography>
										<Typography variant="body2" color="error.dark">
											{sheet.rejectionNote}
										</Typography>
									</Box>
								)}

								{renderProjectGroups(sheet.logs)}
							</Box>
						</Collapse>
					</TableCell>
				</TableRow>
			</React.Fragment>
		);
	};

	return (
		<Box>
			<DataTable<UserGroupedTimesheet>
				columns={columns}
				data={paginatedTimesheets}
				loading={false}
				totalCount={groupedTimesheets.length}
				page={page}
				rowsPerPage={rowsPerPage}
				onPageChange={(_, newPage) => setPage(newPage)}
				onRowsPerPageChange={(newRows) => { setRowsPerPage(newRows); setPage(0); }}
				searchTerm=""
				headerActions={
					<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ width: '100%' }} flexWrap="wrap" rowGap={1}>
						<Stack direction="row" spacing={1.5} alignItems="center">
							<Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
								Team Timesheets
							</Typography>
							{selectedUserIds.length > 0 && (
								<AddButton hideIcon size="small" onClick={handleBulkApprove} disabled={actionLoading} sx={{ px: 2 }}>
									Approve Selected ({selectedUserIds.length})
								</AddButton>
							)}
						</Stack>
						<Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
							Week: {formatWeekRange(startDate, endDate)}
						</Typography>
					</Stack>
				}
				renderRow={renderRow}
				emptyMessage="No timesheets found for this week."
			/>

			{/* Rejection Dialog Prompt */}
			<BaseDialog
				open={rejectUserId !== null}
				onClose={handleCloseRejectDialog}
				title="Reject Timesheet"
				maxWidth="xs"
				actions={
					<>
						<CancelButton onClick={handleCloseRejectDialog} variant="outlined" />
						<SubmitButton
							onClick={handleConfirmReject}
							color="error"
							disabled={!rejectionReason.trim()}
						>
							Reject Timesheet
						</SubmitButton>
					</>
				}
			>
				<Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
					Please provide a rejection note stating what correction is required. The team member will see this note and can modify/resubmit their time logs.
				</Typography>
				<TextField
					label="Rejection Reason"
					multiline
					rows={4}
					value={rejectionReason}
					onChange={(e) => setRejectionReason(e.target.value)}
					fullWidth
					required
					autoFocus
					placeholder="e.g. Please correct the billable hours for project X on Monday."
				/>
			</BaseDialog>

			<ConfirmationDialog
				open={!!revokeTarget}
				onClose={() => setRevokeTarget(null)}
				onConfirm={handleConfirmRevoke}
				title="Revoke Approval"
				message={`Are you sure you want to revoke ${revokeTarget?.userName}'s ${revokeTarget?.status} timesheet back to draft? They will need to fix and resubmit it.`}
				confirmLabel="Revoke"
				severity="warning"
				loading={actionLoading}
			/>

			<BaseDialog
				open={!!targetEditTarget}
				onClose={() => setTargetEditTarget(null)}
				title="Set Weekly Hour Target"
				subtitle={targetEditTarget ? `For ${targetEditTarget.userName}` : undefined}
				maxWidth="xs"
				actions={
					<>
						<CancelButton onClick={() => setTargetEditTarget(null)} variant="outlined" />
						<SubmitButton
							onClick={handleSaveTarget}
							disabled={!(Number(targetHoursInput) > 0 && Number(targetHoursInput) <= 168)}
						>
							Save
						</SubmitButton>
					</>
				}
			>
				<Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
					Used to flag overtime on their weekly grid and here in team approvals. Defaults to 40h if never set.
				</Typography>
				<TextField
					label="Weekly hours target"
					type="number"
					value={targetHoursInput}
					onChange={(e) => setTargetHoursInput(e.target.value)}
					fullWidth
					autoFocus
					inputProps={{ min: 1, max: 168, step: 0.5 }}
				/>
			</BaseDialog>
		</Box>
	);
};

export default TeamTimesheetTable;
