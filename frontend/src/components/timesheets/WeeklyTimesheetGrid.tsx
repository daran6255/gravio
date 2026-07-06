import React, { useMemo } from 'react';
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
	alpha,
	useTheme
} from '@mui/material';
import {
	Add as AddIcon,
	BeachAccess as HolidayIcon,
	Error as RejectedIcon,
} from '@mui/icons-material';
import type { ProjectTimeLog, OrgHoliday, TimesheetStatus } from '../../models/timesheet';
import TimesheetStatusBadge from './TimesheetStatusBadge';

// Helper to format hours display (e.g. 1.5 -> 1h 30m, 8 -> 8h)
export const formatHoursDisplay = (hours: number): string => {
	if (!hours || hours <= 0) return '';
	const h = Math.floor(hours);
	const m = Math.round((hours % 1) * 60);
	if (m > 0) {
		return `${h}h ${m}m`;
	}
	return `${h}h`;
};

interface WeeklyTimesheetGridProps {
	dates: Date[];
	logs: ProjectTimeLog[];
	holidays: OrgHoliday[];
	onCellClick: (dateStr: string, log?: ProjectTimeLog) => void;
	onAddRow: () => void;
	onSubmitWeek: () => void;
	submitLoading: boolean;
	reportingManagerSet: boolean;
}

// Unique row identifier structure
interface TimesheetRow {
	id: string; // unique row id
	type: 'project_task' | 'project_only' | 'general';
	projectId?: number;
	projectName?: string;
	taskId?: number;
	taskTitle?: string;
	categoryId?: number;
	categoryName?: string;
	billingType: 'billable' | 'non_billable';
	cells: Record<string, ProjectTimeLog | undefined>; // mapped by YYYY-MM-DD
	totalHours: number;
}

const WeeklyTimesheetGrid: React.FC<WeeklyTimesheetGridProps> = ({
	dates,
	logs,
	holidays,
	onCellClick,
	onAddRow,
	onSubmitWeek,
	submitLoading,
	reportingManagerSet
}) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';

	// Format helper YYYY-MM-DD
	const getFormatDateStr = (d: Date): string => {
		const year = d.getFullYear();
		const month = String(d.getMonth() + 1).padStart(2, '0');
		const day = String(d.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	};

	const dateStrings = useMemo(() => dates.map(getFormatDateStr), [dates]);

	// Map holidays by date string
	const holidayMap = useMemo(() => {
		const map: Record<string, OrgHoliday> = {};
		holidays.forEach((h) => {
			map[h.holiday_date] = h;
		});
		return map;
	}, [holidays]);

	// Group logs into rows
	const gridRows = useMemo(() => {
		const rowsMap: Record<string, TimesheetRow> = {};

		logs.forEach((log) => {
			let rowKey = '';
			let type: 'project_task' | 'project_only' | 'general' = 'general';
			
			if (log.project_id && log.task_id) {
				type = 'project_task';
				rowKey = `proj_${log.project_id}_task_${log.task_id}_${log.billing_type}`;
			} else if (log.project_id) {
				type = 'project_only';
				rowKey = `proj_${log.project_id}_only_${log.billing_type}`;
			} else if (log.category_id) {
				type = 'general';
				rowKey = `cat_${log.category_id}_${log.billing_type}`;
			} else {
				// Fallback key
				rowKey = `fallback_${log.id}`;
			}

			if (!rowsMap[rowKey]) {
				rowsMap[rowKey] = {
					id: rowKey,
					type,
					projectId: log.project_id,
					projectName: log.project?.name,
					taskId: log.task_id,
					taskTitle: log.task?.title,
					categoryId: log.category_id,
					categoryName: log.category?.name,
					billingType: log.billing_type,
					cells: {},
					totalHours: 0
				};
			}

			const logDateStr = log.log_date;
			rowsMap[rowKey].cells[logDateStr] = log;
			rowsMap[rowKey].totalHours += Number(log.hours);
		});

		return Object.values(rowsMap);
	}, [logs]);

	// Calculate totals per day
	const dayTotals = useMemo(() => {
		const totals: Record<string, number> = {};
		dateStrings.forEach((dateStr) => {
			totals[dateStr] = 0;
		});

		logs.forEach((log) => {
			const dStr = log.log_date;
			if (totals[dStr] !== undefined) {
				totals[dStr] += Number(log.hours);
			}
		});

		return totals;
	}, [logs, dateStrings]);

	// Weekly aggregate status
	const weeklyStatus: TimesheetStatus = useMemo(() => {
		if (logs.length === 0) return 'draft';
		
		const statuses = logs.map((l) => l.status);
		if (statuses.includes('rejected')) return 'rejected';
		if (statuses.includes('submitted')) return 'submitted';
		if (statuses.includes('approved') && !statuses.includes('draft')) return 'approved';
		
		return 'draft';
	}, [logs]);

	const grandTotal = Object.values(dayTotals).reduce((sum, h) => sum + h, 0);

	return (
		<Stack spacing={3}>
			{/* Grid Header Actions */}
			<Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} gap={2}>
				<Stack direction="row" alignItems="center" spacing={2}>
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
				</Stack>

				<Stack direction="row" spacing={2} width={{ xs: '100%', sm: 'auto' }}>
					<Button
						variant="outlined"
						startIcon={<AddIcon />}
						onClick={onAddRow}
						sx={{ borderRadius: '8px', fontWeight: 600 }}
					>
						Add Row
					</Button>
					{weeklyStatus !== 'approved' && weeklyStatus !== 'submitted' && (
						<Button
							variant="contained"
							onClick={onSubmitWeek}
							disabled={logs.length === 0 || submitLoading || !reportingManagerSet}
							sx={{ borderRadius: '8px', fontWeight: 700, px: 3 }}
						>
							Submit Week
						</Button>
					)}
				</Stack>
			</Stack>

			{!reportingManagerSet && (
				<Box sx={{ bgcolor: alpha(theme.palette.warning.main, 0.1), color: 'warning.dark', p: 2, borderRadius: '8px', border: `1px solid ${theme.palette.warning.main}` }}>
					<Typography variant="body2" sx={{ fontWeight: 600 }}>
						⚠️ Submission Blocked: You do not have a Reporting Manager assigned in your profile. Please set one in settings to submit timesheets.
					</Typography>
				</Box>
			)}

			<TableContainer
				component={Paper}
				elevation={0}
				sx={{
					border: `1px solid ${isDark ? '#2D3748' : '#E2E8F0'}`,
					borderRadius: '12px',
					overflow: 'hidden',
					bgcolor: isDark ? '#141822' : '#ffffff'
				}}
			>
				<Table sx={{ minWidth: 800 }}>
					<TableHead>
						<TableRow sx={{ bgcolor: isDark ? '#1C212E' : '#F8FAFC' }}>
							<TableCell sx={{ fontWeight: 700, width: 240 }}>Log Target</TableCell>
							<TableCell sx={{ fontWeight: 700, width: 100 }}>Billing</TableCell>
							{dates.map((date, i) => {
								const dStr = dateStrings[i];
								const isHoliday = !!holidayMap[dStr];
								const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
								const dayNum = date.getDate();

								return (
									<TableCell
										key={dStr}
										align="center"
										sx={{
											fontWeight: 700,
											width: 90,
											bgcolor: isHoliday ? (isDark ? 'rgba(245, 158, 11, 0.08)' : 'rgba(245, 158, 11, 0.05)') : 'inherit'
										}}
									>
										<Stack direction="row" spacing={0.5} justifyContent="center" alignItems="center">
											<Typography variant="body2" sx={{ fontWeight: 700 }}>
												{dayName} {dayNum}
											</Typography>
											{isHoliday && (
												<Tooltip title={`Holiday: ${holidayMap[dStr].name}`}>
													<HolidayIcon sx={{ fontSize: '0.9rem', color: 'orange' }} />
												</Tooltip>
											)}
										</Stack>
									</TableCell>
								);
							})}
							<TableCell align="center" sx={{ fontWeight: 700, width: 100 }}>Total</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{gridRows.length === 0 ? (
							<TableRow>
								<TableCell colSpan={10} align="center" sx={{ py: 6 }}>
									<Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
										No hours logged for this week. Click "Add Row" or click a date cell below to log time.
									</Typography>
								</TableCell>
							</TableRow>
						) : (
							gridRows.map((row) => (
								<TableRow
									key={row.id}
									sx={{
										'&:hover': { bgcolor: isDark ? '#1C212E' : '#F8FAFC' },
										transition: 'background-color 0.2s'
									}}
								>
									<TableCell sx={{ py: 1.5 }}>
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
										const isHoliday = !!holidayMap[dateStr];
										const isApproved = log?.status === 'approved';
										const isSubmitted = log?.status === 'submitted';

										return (
											<TableCell
												key={dateStr}
												align="center"
												onClick={() => {
													// Prevent editing submitted or approved logs
													if (log && (isApproved || isSubmitted)) return;
													onCellClick(dateStr, log);
												}}
												sx={{
													cursor: (log && (isApproved || isSubmitted)) ? 'default' : 'pointer',
													p: 1,
													position: 'relative',
													bgcolor: isHoliday ? (isDark ? 'rgba(245, 158, 11, 0.04)' : 'rgba(245, 158, 11, 0.02)') : 'inherit',
													borderRight: `1px solid ${isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'}`,
													'&:hover': {
														bgcolor: (log && (isApproved || isSubmitted))
															? 'inherit'
															: (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)')
													}
												}}
											>
												{log ? (
													<Box
														sx={{
															py: 1,
															px: 0.5,
															borderRadius: '6px',
															bgcolor: isApproved
																? (isDark ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.05)')
																: isSubmitted
																? (isDark ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.05)')
																: (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'),
															border: `1px solid ${
																isApproved
																	? 'rgba(16, 185, 129, 0.3)'
																	: isSubmitted
																	? 'rgba(245, 158, 11, 0.3)'
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
															<HolidayIcon sx={{ fontSize: '0.75rem', color: 'orange' }} />
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
									<TableCell align="center">
										<Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
											{formatHoursDisplay(row.totalHours)}
										</Typography>
									</TableCell>
								</TableRow>
							))
						)}

						{/* Day Totals Row */}
						<TableRow sx={{ bgcolor: isDark ? '#1C212E' : '#F8FAFC', borderTop: `2px solid ${isDark ? '#2D3748' : '#E2E8F0'}` }}>
							<TableCell colSpan={2} sx={{ fontWeight: 800 }}>
								Total Hours
							</TableCell>
							{dateStrings.map((dateStr) => (
								<TableCell key={dateStr} align="center" sx={{ fontWeight: 800 }}>
									{formatHoursDisplay(dayTotals[dateStr])}
								</TableCell>
							))}
							<TableCell align="center" sx={{ fontWeight: 900, color: 'primary.main' }}>
								{formatHoursDisplay(grandTotal)}
							</TableCell>
						</TableRow>
					</TableBody>
				</Table>
			</TableContainer>
		</Stack>
	);
};

export default WeeklyTimesheetGrid;
