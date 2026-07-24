import React from 'react';
import {
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Paper,
	Typography,
	Button,
	Box,
	Stack,
	Tooltip,
	Alert,
	TextField,
	alpha,
	useTheme
} from '@mui/material';
import {
	Add as AddIcon,
	BeachAccess as HolidayIcon,
	Error as RejectedIcon,
	LockOutlined as LockIcon,
	WarningAmberOutlined as OvertimeIcon,
} from '@mui/icons-material';
import type { ProjectTimeLog, OrgHoliday, TimesheetWeekUnlockRequest } from '../../../models/timesheet';
import { DEFAULT_WEEKLY_HOURS_TARGET } from '../../../models/timesheet';
import TimesheetStatusBadge from '../shared/TimesheetStatusBadge';
import { BaseDialog } from '../../common/dialogbox';
import { DataTableEmpty } from '../../common/table';
import { AddButton } from '../../common/button';
import { useWeeklyTimesheetGrid } from './hooks/useWeeklyTimesheetGrid';
import { formatHoursDisplay } from './utils';

interface WeeklyTimesheetGridProps {
	dates: Date[];
	logs: ProjectTimeLog[];
	holidays: OrgHoliday[];
	onCellClick: (dateStr: string, log?: ProjectTimeLog) => void;
	onAddRow: () => void;
	onSubmitWeek: () => void;
	submitLoading: boolean;
	reportingManagerSet: boolean;
	/** False once the viewed week has fully ended -- past weeks lock automatically. */
	isCurrentWeek: boolean;
	/** The current user's own unlock requests, across all weeks -- filtered internally to this week. */
	myUnlockRequests: TimesheetWeekUnlockRequest[];
	onRequestUnlock: (reason?: string) => void;
	unlockRequestLoading: boolean;
	/** Manager-granted exception to log time on holidays/Sundays -- without it, holiday cells are read-only. */
	canLogOnHolidays: boolean;
	/** From the user's own TimesheetUserSettings; falls back to DEFAULT_WEEKLY_HOURS_TARGET when unset. */
	weeklyHoursTarget?: number;
}

const WeeklyTimesheetGrid: React.FC<WeeklyTimesheetGridProps> = ({
	dates,
	logs,
	holidays,
	onCellClick,
	onAddRow,
	onSubmitWeek,
	submitLoading,
	reportingManagerSet,
	isCurrentWeek,
	myUnlockRequests,
	onRequestUnlock,
	unlockRequestLoading,
	canLogOnHolidays,
	weeklyHoursTarget
}) => {
	const theme = useTheme();
	const target = weeklyHoursTarget ?? DEFAULT_WEEKLY_HOURS_TARGET;
	const isDark = theme.palette.mode === 'dark';
	const todayStr = React.useMemo(() => {
		const d = new Date();
		return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
	}, []);

	const {
		requestDialogOpen, setRequestDialogOpen,
		requestReason, setRequestReason,
		dateStrings,
		isHolidayDate,
		holidayLabel,
		gridRows,
		dayTotals,
		weeklyStatus,
		isWeekClosed,
		hasUnsubmittedEntries,
		grandTotal,
		isLocked,
		pendingRequest,
		latestDenied,
		activeGrant,
		handleOpenRequestDialog,
		handleSubmitUnlockRequest
	} = useWeeklyTimesheetGrid({
		dates,
		logs,
		holidays,
		myUnlockRequests,
		onRequestUnlock,
		isCurrentWeek
	});

	return (
		<Stack spacing={3}>
			{/* Grid Header Actions */}
			<Stack
				direction={{ xs: 'column', sm: 'row' }}
				justifyContent="space-between"
				alignItems={{ xs: 'stretch', sm: 'center' }}
				gap={2}
				sx={{
					border: '1px solid',
					borderColor: 'divider',
					borderRadius: theme.layout.radius.card,
					bgcolor: 'background.paper',
					p: 2
				}}
			>
				<Stack direction="row" alignItems="center" spacing={2} flexWrap="wrap" rowGap={1}>
					<Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
						Week Status:
					</Typography>
					<TimesheetStatusBadge status={weeklyStatus} size="medium" />
					{logs.length > 0 && logs[0].rejection_note && weeklyStatus === 'rejected' && (
						<Tooltip title={logs[0].rejection_note}>
							<Box sx={{ display: 'flex', alignItems: 'center', color: 'error.main', cursor: 'help' }}>
								<RejectedIcon fontSize="small" sx={{ mr: 0.5 }} />
								<Typography variant="caption" sx={{ fontWeight: 600 }}>Rejection Reason</Typography>
							</Box>
						</Tooltip>
					)}
					<Box sx={{ width: '1px', height: 20, bgcolor: 'divider' }} />
					<Typography variant="body2" sx={{ fontWeight: 700, color: grandTotal > target ? 'warning.main' : 'text.secondary' }}>
						{formatHoursDisplay(grandTotal)} / {formatHoursDisplay(target)}h target
					</Typography>
					{grandTotal > target && (
						<Tooltip title={`${formatHoursDisplay(grandTotal - target)}h over your ${formatHoursDisplay(target)}h weekly target`}>
							<Box sx={{ display: 'flex', alignItems: 'center', color: 'warning.main', cursor: 'help' }}>
								<OvertimeIcon fontSize="small" sx={{ mr: 0.5 }} />
								<Typography variant="caption" sx={{ fontWeight: 700 }}>Overtime</Typography>
							</Box>
						</Tooltip>
					)}
				</Stack>

				<Stack direction="row" spacing={1.5} width={{ xs: '100%', sm: 'auto' }}>
					<Button
						variant="outlined"
						startIcon={<AddIcon />}
						onClick={onAddRow}
						disabled={isLocked || isWeekClosed}
						sx={{ borderRadius: '10px', px: 2.5, fontWeight: 700 }}
					>
						Add Row
					</Button>
					{hasUnsubmittedEntries && (
						<AddButton
							hideIcon
							onClick={onSubmitWeek}
							disabled={submitLoading || !reportingManagerSet || isLocked}
							sx={{ px: 3 }}
						>
							Submit Week
						</AddButton>
					)}
				</Stack>
			</Stack>

			{!reportingManagerSet && (
				<Alert severity="warning" variant="outlined" sx={{ borderRadius: theme.layout.radius.card }}>
					<Typography variant="body2" sx={{ fontWeight: 700 }}>
						Submission blocked
					</Typography>
					<Typography variant="body2" color="text.secondary">
						You don't have a Reporting Manager assigned. Ask your organization administrator to set one so you can submit weekly timesheets.
					</Typography>
				</Alert>
			)}

			{isLocked && (
				<Alert
					severity={pendingRequest ? 'info' : 'warning'}
					icon={<LockIcon fontSize="inherit" />}
					action={
						!pendingRequest && (
							<Button
								color="inherit"
								size="small"
								onClick={handleOpenRequestDialog}
								disabled={unlockRequestLoading}
								sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}
							>
								Request Access
							</Button>
						)
					}
					sx={{ borderRadius: 4 }}
				>
					{pendingRequest ? (
						<>Unlock request sent to your manager on {pendingRequest.created_at.split('T')[0]} — waiting for approval.</>
					) : (
						<>
							This week has already ended and wasn't submitted in time, so it's locked. Request access from your manager to add or edit entries.
							{latestDenied && (
								<Typography variant="caption" display="block" sx={{ mt: 0.5, fontStyle: 'italic' }}>
									Your last request was denied{latestDenied.resolution_note ? `: ${latestDenied.resolution_note}` : '.'}
								</Typography>
							)}
						</>
					)}
				</Alert>
			)}

			{activeGrant && !isCurrentWeek && (
				<Alert severity="success" sx={{ borderRadius: 4 }}>
					Your manager unlocked this week — add/edit your entries and hit Submit Week when ready.
				</Alert>
			)}

			{hasUnsubmittedEntries && (weeklyStatus === 'submitted' || weeklyStatus === 'approved') && (
				<Alert severity="info" sx={{ borderRadius: 4 }}>
					You've added entries since your last submission — hit Submit Week to send them to your manager too.
				</Alert>
			)}

			<TableContainer
				component={Paper}
				elevation={1}
				sx={{
					border: 1,
					borderColor: 'divider',
					borderRadius: theme.layout.radius.card,
					overflow: 'hidden',
					bgcolor: 'background.paper'
				}}
			>
				<Table sx={{ width: '100%', minWidth: 760, tableLayout: 'fixed' }}>
					<TableHead>
						<TableRow sx={{ bgcolor: 'action.hover' }}>
							<TableCell sx={{ fontWeight: 700, width: '23%' }}>Log Target</TableCell>
							<TableCell sx={{ fontWeight: 700, width: '8%', whiteSpace: 'nowrap' }}>Billing</TableCell>
							{dates.map((date, i) => {
								const dStr = dateStrings[i];
								const isHoliday = isHolidayDate(dStr);
								const isToday = dStr === todayStr;
								const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
								const dayNum = date.getDate();

								return (
									<TableCell
										key={dStr}
										align="center"
										sx={{
											fontWeight: 700,
											width: '8%',
											px: 0.5,
											whiteSpace: 'nowrap',
											position: 'relative',
											color: isToday ? 'primary.main' : 'inherit',
											bgcolor: isHoliday
												? alpha(theme.palette.warning.main, isDark ? 0.08 : 0.05)
												: isToday
													? alpha(theme.palette.primary.main, isDark ? 0.1 : 0.06)
													: 'inherit',
											'&::after': isToday
												? {
													content: '""',
													position: 'absolute',
													top: 0,
													left: 0,
													right: 0,
													height: 2,
													bgcolor: 'primary.main'
												}
												: undefined
										}}
									>
										<Stack direction="row" spacing={0.25} justifyContent="center" alignItems="center">
											<Typography variant="body2" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
												{dayName} {dayNum}
											</Typography>
											{isHoliday && (
												<Tooltip title={`Holiday: ${holidayLabel(dStr)}`}>
													<HolidayIcon sx={{ fontSize: '0.85rem', color: 'warning.main', flexShrink: 0 }} />
												</Tooltip>
											)}
										</Stack>
									</TableCell>
								);
							})}
							<TableCell align="center" sx={{ fontWeight: 700, width: '13%', px: 1, whiteSpace: 'nowrap' }}>Total</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{gridRows.length === 0 ? (
							<DataTableEmpty
								colSpan={dates.length + 3}
								message="No hours logged for this week"
								subMessage='Click "Add Row" or click a date cell below to log time'
							/>
						) : (
							gridRows.map((row) => (
								<TableRow
									key={row.id}
									sx={{
										'&:hover': { bgcolor: 'action.hover' },
										transition: 'background-color 0.2s'
									}}
								>
									<TableCell
										sx={{
											py: 1.5,
											borderLeft: '3px solid',
											borderLeftColor: row.type === 'general' ? 'info.main' : 'primary.main'
										}}
									>
										{row.type === 'project_task' && (
											<Box>
												<Typography variant="body2" sx={{ fontWeight: 700 }}>
													{row.projectName}
												</Typography>
												<Typography variant="caption" color="text.secondary" display="block">
													Task: {row.taskTitle}
												</Typography>
											</Box>
										)}
										{row.type === 'project_only' && (
											<Box>
												<Typography variant="body2" sx={{ fontWeight: 700 }}>
													{row.projectName}
												</Typography>
												<Typography variant="caption" color="primary.main" sx={{ fontWeight: 600 }}>
													Project Only
												</Typography>
											</Box>
										)}
										{row.type === 'general' && (
											<Box>
												<Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
													General: {row.categoryName}
												</Typography>
											</Box>
										)}
									</TableCell>
									<TableCell>
										<Typography
											variant="caption"
											sx={{
												fontWeight: 700,
												color: row.billingType === 'billable' ? 'success.main' : 'text.secondary',
												textTransform: 'uppercase'
											}}
										>
											{row.billingType === 'billable' ? 'Billable' : 'Non-Bill'}
										</Typography>
									</TableCell>
									{dateStrings.map((dateStr) => {
										const log = row.cells[dateStr];
										const isHoliday = isHolidayDate(dateStr);
										const isToday = dateStr === todayStr;
										const isApproved = log?.status === 'approved';
										const isSubmitted = log?.status === 'submitted';
										const isHolidayBlocked = isHoliday && !canLogOnHolidays;
										const isCellDisabled = (log && (isApproved || isSubmitted)) || isLocked || isHolidayBlocked || isWeekClosed;

										return (
											<TableCell
												key={dateStr}
												align="center"
												onClick={() => {
													// Prevent editing submitted/approved logs, any cell in a locked week,
													// or a holiday/Sunday cell without a manager-granted override
													if (isCellDisabled) return;
													onCellClick(dateStr, log);
												}}
												sx={{
													cursor: isCellDisabled ? 'default' : 'pointer',
													p: 1,
													position: 'relative',
													bgcolor: isHoliday
														? alpha(theme.palette.warning.main, isDark ? 0.04 : 0.02)
														: isToday
															? alpha(theme.palette.primary.main, isDark ? 0.05 : 0.03)
															: 'inherit',
													borderRight: 1,
													borderColor: 'divider',
													opacity: isHolidayBlocked && !log ? 0.6 : 1,
													'&:hover': {
														bgcolor: isCellDisabled ? 'inherit' : 'action.hover'
													}
												}}
											>
												{log ? (
													<Box
														sx={{
															py: 1,
															px: 0.5,
															borderRadius: 3,
															bgcolor: isApproved
																? alpha(theme.palette.success.main, isDark ? 0.1 : 0.05)
																: isSubmitted
																? alpha(theme.palette.warning.main, isDark ? 0.1 : 0.05)
																: 'action.selected',
															border: `1px solid ${
																isApproved
																	? alpha(theme.palette.success.main, 0.3)
																	: isSubmitted
																	? alpha(theme.palette.warning.main, 0.3)
																	: 'transparent'
															}`,
															display: 'flex',
															flexDirection: 'column',
															alignItems: 'center',
															gap: 0.5
														}}
													>
														<Typography variant="body2" sx={{ fontWeight: 700 }}>
															{formatHoursDisplay(log.hours)}
														</Typography>
														{log.is_holiday_override && (
															<HolidayIcon sx={{ fontSize: '0.75rem', color: 'warning.main' }} />
														)}
													</Box>
												) : (
													<Typography variant="body2" color="text.secondary" sx={{ opacity: 0.2 }}>
														—
													</Typography>
												)}
											</TableCell>
										);
									})}
									<TableCell align="center" sx={{ px: 1, whiteSpace: 'nowrap' }}>
										<Typography variant="subtitle2" sx={{ fontWeight: 800, whiteSpace: 'nowrap' }}>
											{formatHoursDisplay(row.totalHours)}
										</Typography>
									</TableCell>
								</TableRow>
							))
						)}

						{/* Day Totals Row */}
						<TableRow
							sx={{
								bgcolor: alpha(theme.palette.primary.main, isDark ? 0.08 : 0.05),
								borderTop: '2px solid',
								borderColor: 'primary.main'
							}}
						>
							<TableCell colSpan={2} sx={{ fontWeight: 800 }}>
								Total Hours
							</TableCell>
							{dateStrings.map((dateStr) => (
								<TableCell key={dateStr} align="center" sx={{ fontWeight: 800, px: 0.5, whiteSpace: 'nowrap' }}>
									{formatHoursDisplay(dayTotals[dateStr])}
								</TableCell>
							))}
							<TableCell align="center" sx={{ fontWeight: 900, fontSize: '1rem', color: 'primary.main', px: 1, whiteSpace: 'nowrap' }}>
								{formatHoursDisplay(grandTotal)}
							</TableCell>
						</TableRow>
					</TableBody>
				</Table>
			</TableContainer>

			<BaseDialog
				open={requestDialogOpen}
				onClose={() => setRequestDialogOpen(false)}
				title="Request Manager Access"
				maxWidth="xs"
				actions={
					<>
						<Button onClick={() => setRequestDialogOpen(false)} variant="outlined" sx={{ borderRadius: 3 }}>
							Cancel
						</Button>
						<Button
							onClick={handleSubmitUnlockRequest}
							variant="contained"
							disabled={unlockRequestLoading}
							sx={{ borderRadius: 3, fontWeight: 700 }}
						>
							Send Request
						</Button>
					</>
				}
			>
				<Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
					Your manager will be asked to unlock this week so you can add/edit and submit it. Let them know why it's late (optional).
				</Typography>
				<TextField
					label="Reason (optional)"
					multiline
					rows={3}
					value={requestReason}
					onChange={(e) => setRequestReason(e.target.value)}
					fullWidth
					autoFocus
					placeholder="e.g. I was on leave and missed the submission window."
				/>
			</BaseDialog>
		</Stack>
	);
};

export default WeeklyTimesheetGrid;
