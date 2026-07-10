import React, { useState, useMemo } from 'react';
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
	IconButton,
	Box,
	Collapse,
	Stack,
	TextField,
	alpha,
	useTheme
} from '@mui/material';
import {
	KeyboardArrowDown as ExpandIcon,
	KeyboardArrowUp as CollapseIcon
} from '@mui/icons-material';
import type { ProjectTimeLog } from '../../../models/timesheet';
import TimesheetStatusBadge from '../shared/TimesheetStatusBadge';
import { computeWeekStatus } from '../shared/weekStatus';
import { formatHoursDisplay } from '../weekly-grid';
import { BaseDialog, ConfirmationDialog } from '../../common/dialogbox';

interface TeamTimesheetTableProps {
	logs: ProjectTimeLog[];
	startDate: string;
	endDate: string;
	onApprove: (userId: number) => void;
	onReject: (userId: number, reason: string) => void;
	onUnapprove: (userId: number) => void;
	actionLoading: boolean;
	/** Only rows where the team member's reporting_manager_id equals this get action
	 * buttons -- the backend enforces the same rule, this just avoids showing buttons
	 * that would 403 (e.g. an admin browsing another manager's direct reports). */
	currentUserId?: number;
}

interface UserGroupedTimesheet {
	userId: number;
	userName: string;
	userEmail: string;
	totalHours: number;
	status: 'draft' | 'submitted' | 'approved' | 'rejected';
	rejectionNote?: string;
	logs: ProjectTimeLog[];
	isMyDirectReport: boolean;
}

const TeamTimesheetTable: React.FC<TeamTimesheetTableProps> = ({
	logs,
	startDate,
	endDate,
	onApprove,
	onReject,
	onUnapprove,
	actionLoading,
	currentUserId
}) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';

	const [expandedUser, setExpandedUser] = useState<number | null>(null);
	const [rejectUserId, setRejectUserId] = useState<number | null>(null);
	const [rejectionReason, setRejectionReason] = useState('');
	const [revokeTarget, setRevokeTarget] = useState<UserGroupedTimesheet | null>(null);

	// Group logs by user
	const groupedTimesheets = useMemo(() => {
		const groups: Record<number, UserGroupedTimesheet> = {};

		logs.forEach((log) => {
			const uId = log.user_id;
			if (!groups[uId]) {
				groups[uId] = {
					userId: uId,
					userName: log.user?.full_name || log.user?.email || `User #${uId}`,
					userEmail: log.user?.email || '',
					totalHours: 0,
					status: 'draft',
					logs: [],
					isMyDirectReport: log.user?.reporting_manager_id === currentUserId
				};
			}

			groups[uId].logs.push(log);
			groups[uId].totalHours += Number(log.hours);
		});

		// Same aggregate-status rule as the employee's own grid (submitted ranks above
		// a lingering draft) -- otherwise a week the employee sees as SUBMITTED could
		// show as DRAFT here, hiding it from approval entirely.
		Object.values(groups).forEach((g) => {
			g.status = computeWeekStatus(g.logs);
			if (g.status === 'rejected') {
				g.rejectionNote = g.logs.find((l) => l.status === 'rejected')?.rejection_note;
			}
		});

		return Object.values(groups);
	}, [logs, currentUserId]);

	const handleOpenRejectDialog = (userId: number) => {
		setRejectUserId(userId);
		setRejectionReason('');
	};

	const handleCloseRejectDialog = () => {
		setRejectUserId(null);
		setRejectionReason('');
	};

	const handleConfirmReject = () => {
		if (rejectUserId && rejectionReason.trim()) {
			onReject(rejectUserId, rejectionReason);
			handleCloseRejectDialog();
		}
	};

	const handleConfirmRevoke = () => {
		if (revokeTarget) {
			onUnapprove(revokeTarget.userId);
			setRevokeTarget(null);
		}
	};

	return (
		<Box>
			<TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${isDark ? '#2D3748' : '#E2E8F0'}`, borderRadius: '12px', overflow: 'hidden' }}>
				<Table>
					<TableHead>
						<TableRow sx={{ bgcolor: isDark ? '#1C212E' : '#F8FAFC' }}>
							<TableCell width={50} />
							<TableCell sx={{ fontWeight: 700 }}>Team Member</TableCell>
							<TableCell align="center" sx={{ fontWeight: 700 }}>Total Hours</TableCell>
							<TableCell align="center" sx={{ fontWeight: 700 }}>Weekly Status</TableCell>
							<TableCell align="right" sx={{ fontWeight: 700, pr: 3 }}>Actions</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{groupedTimesheets.length === 0 ? (
							<TableRow>
								<TableCell colSpan={5} align="center" sx={{ py: 6 }}>
									<Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
										No timesheets found for this week.
									</Typography>
								</TableCell>
							</TableRow>
						) : (
							groupedTimesheets.map((sheet) => {
								const isExpanded = expandedUser === sheet.userId;

								return (
									<React.Fragment key={sheet.userId}>
										<TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
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
												<Typography variant="body2" sx={{ fontWeight: 700 }}>
													{formatHoursDisplay(sheet.totalHours)}
												</Typography>
											</TableCell>
											<TableCell align="center">
												<TimesheetStatusBadge status={sheet.status} />
											</TableCell>
											<TableCell align="right" sx={{ pr: 3 }}>
												{sheet.isMyDirectReport ? (
													<Stack direction="row" spacing={1} justifyContent="flex-end">
														{sheet.status === 'submitted' && (
															<>
																<Button
																	variant="contained"
																	color="success"
																	size="small"
																	onClick={() => onApprove(sheet.userId)}
																	disabled={actionLoading}
																	sx={{ borderRadius: '6px', fontWeight: 700 }}
																>
																	Approve
																</Button>
																<Button
																	variant="outlined"
																	color="error"
																	size="small"
																	onClick={() => handleOpenRejectDialog(sheet.userId)}
																	disabled={actionLoading}
																	sx={{ borderRadius: '6px', fontWeight: 700 }}
																>
																	Reject
																</Button>
															</>
														)}
														{(sheet.status === 'submitted' || sheet.status === 'approved') && (
															<Button
																variant="outlined"
																color="warning"
																size="small"
																onClick={() => setRevokeTarget(sheet)}
																disabled={actionLoading}
																sx={{ borderRadius: '6px', fontWeight: 700 }}
															>
																Revoke
															</Button>
														)}
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

										{/* Details Dropdown Section */}
										<TableRow>
											<TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={5}>
												<Collapse in={isExpanded} timeout="auto" unmountOnExit>
													<Box sx={{ margin: 2, p: 2, bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)', borderRadius: '8px' }}>
														<Typography variant="subtitle2" gutterBottom component="div" sx={{ fontWeight: 700, mb: 2 }}>
															Detailed Logs ({startDate} to {endDate})
														</Typography>

														{sheet.rejectionNote && sheet.status === 'rejected' && (
															<Box sx={{ mb: 2, p: 1.5, bgcolor: alpha(theme.palette.error.main, 0.1), border: `1px solid ${theme.palette.error.main}`, borderRadius: '6px' }}>
																<Typography variant="caption" sx={{ fontWeight: 700, color: 'error.main', display: 'block' }}>
																	Rejection Reason:
																</Typography>
																<Typography variant="body2" color="error.dark">
																	{sheet.rejectionNote}
																</Typography>
															</Box>
														)}

														<Table size="small">
															<TableHead>
																<TableRow>
																	<TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
																	<TableCell sx={{ fontWeight: 700 }}>Log Target</TableCell>
																	<TableCell sx={{ fontWeight: 700 }}>Billing</TableCell>
																	<TableCell sx={{ fontWeight: 700 }}>Notes</TableCell>
																	<TableCell align="right" sx={{ fontWeight: 700 }}>Hours</TableCell>
																</TableRow>
															</TableHead>
															<TableBody>
																{sheet.logs.map((log) => (
																	<TableRow key={log.id}>
																		<TableCell>{log.log_date}</TableCell>
																		<TableCell>
																			{log.project?.name || `General: ${log.category?.name || 'Category'}`}
																			{log.task && (
																				<Typography variant="caption" color="text.secondary" display="block">
																					Task: {log.task.title}
																				</Typography>
																			)}
																		</TableCell>
																		<TableCell>
																			<Typography
																				variant="caption"
																				sx={{
																					fontWeight: 700,
																					color: log.billing_type === 'billable' ? 'success.main' : 'text.secondary',
																					textTransform: 'uppercase'
																				}}
																			>
																				{log.billing_type}
																			</Typography>
																		</TableCell>
																		<TableCell>{log.notes || '—'}</TableCell>
																		<TableCell align="right" sx={{ fontWeight: 700 }}>
																			{formatHoursDisplay(log.hours)}
																		</TableCell>
																	</TableRow>
																))}
															</TableBody>
														</Table>
													</Box>
												</Collapse>
											</TableCell>
										</TableRow>
									</React.Fragment>
								);
							})
						)}
					</TableBody>
				</Table>
			</TableContainer>

			{/* Rejection Dialog Prompt */}
			<BaseDialog
				open={rejectUserId !== null}
				onClose={handleCloseRejectDialog}
				title="Reject Timesheet"
				maxWidth="xs"
				actions={
					<>
						<Button onClick={handleCloseRejectDialog} variant="outlined" sx={{ borderRadius: '6px' }}>
							Cancel
						</Button>
						<Button
							onClick={handleConfirmReject}
							variant="contained"
							color="error"
							disabled={!rejectionReason.trim()}
							sx={{ borderRadius: '6px', fontWeight: 700 }}
						>
							Reject Timesheet
						</Button>
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
		</Box>
	);
};

export default TeamTimesheetTable;
