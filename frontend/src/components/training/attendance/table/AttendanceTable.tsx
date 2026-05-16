import React, { memo } from 'react';
import {
	Paper,
	Typography,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Chip, 
	FormControl, 
	Select, 
	MenuItem,
	Box,
	useTheme,
	alpha
} from '@mui/material';
import { Block as BlockIcon } from '@mui/icons-material';
import { format } from 'date-fns';
import type { CandidateAllocation, TrainingAttendance, TrainingBatchEvent, TrainingBatchPlan } from '../../../../models/training';
import AttendanceTableRow from './AttendanceTableRow';

interface AttendanceTableProps {
	allocations: CandidateAllocation[];
	selectedDate: Date;
	attendance: TrainingAttendance[];
	dailyPlan: TrainingBatchPlan[];
	onStatusChange: (candidateId: number, status: string) => void;
	onRemarkChange: (candidateId: number, remark: string) => void;
	onPeriodStatusChange: (candidateId: number, periodId: number, status: string) => void;
	onTrainerNotesChange: (candidateId: number, periodId: number, notes: string) => void;
	onPeriodMarkAll: (periodId: number, status: string) => void;
	currentEvent?: TrainingBatchEvent;
	isDateOutOfRange: boolean;
	isFutureDate: boolean;
	isDroppedOut: (candidateId: number) => boolean;
	statuses: Array<{ value: string; label: string; icon: React.ReactNode; color: string }>;
	currentUser: any;
}

const AttendanceTable: React.FC<AttendanceTableProps> = memo(({
	allocations,
	selectedDate,
	attendance,
	dailyPlan,
	onStatusChange,
	onRemarkChange,
	onPeriodStatusChange,
	onTrainerNotesChange,
	onPeriodMarkAll,
	currentEvent,
	isDateOutOfRange,
	isFutureDate,
	isDroppedOut,
	statuses,
	currentUser,
}) => {
	const theme = useTheme();
	const dateStr = format(selectedDate, 'yyyy-MM-dd');
	const hasPeriods = dailyPlan.length > 0;

	// Get attendance for a specific candidate and period
	const getPeriodAttendance = (candidateId: number, periodId: number | null) => {
		return attendance.find(a =>
			a.candidate_id === candidateId &&
			a.date === dateStr &&
			a.period_id === periodId
		);
	};

	// Legacy: Get full-day attendance
	const getCandidateStatus = (candidateId: number) => {
		return attendance.find(a => a.candidate_id === candidateId && a.date === dateStr && !a.period_id)?.status || '';
	};

	const getCandidateRemark = (candidateId: number) => {
		return attendance.find(a => a.candidate_id === candidateId && a.date === dateStr && !a.period_id)?.remarks || '';
	};

	const isActive = !currentEvent && !isDateOutOfRange && !isFutureDate;

	// Check if the current user is authorized to edit a specific period
	const canEditPeriod = (period: TrainingBatchPlan) => {
		if (!isActive) return false;
		if (period.activity_type === 'break') return false; // Never edit breaks

		// Admins, Superusers and Managers can edit anything
		if (currentUser?.is_superuser || currentUser?.role === 'admin' || currentUser?.role === 'manager') return true;

		// Primary check: match by user ID
		if (period.trainer_user_id && currentUser?.id && period.trainer_user_id === currentUser.id) return true;

		// Fallback check: match by name
		if (currentUser?.full_name && period.trainer && currentUser.full_name === period.trainer) return true;

		// Also check trainer_user?.public_id vs currentUser?.public_id if available
		if (period.trainer_user?.public_id && currentUser?.public_id && period.trainer_user.public_id === currentUser.public_id) return true;

		return false;
	};

	return (
		<TableContainer 
			component={Paper} 
			elevation={0} 
			sx={{ 
				border: '1px solid',
				borderColor: 'divider', 
				borderRadius: 2,
				overflow: 'auto',
				maxHeight: 'calc(100vh - 350px)'
			}}
		>
			<Table stickyHeader>
				<TableHead>
					<TableRow>
						<TableCell
							sx={{
								fontWeight: 800,
								borderRight: '1px solid',
								borderColor: 'divider',
								width: 250,
								minWidth: 250,
								position: 'sticky',
								left: 0,
								bgcolor: 'background.paper',
								zIndex: 20,
								boxShadow: '2px 0 5px -2px rgba(0,0,0,0.05)',
								fontSize: '0.85rem',
								textTransform: 'uppercase',
								letterSpacing: '0.05em',
								color: 'text.secondary'
							}}
						>
							Student Name
						</TableCell>

						{hasPeriods ? (
							dailyPlan.map((period) => (
								<TableCell 
									key={period.id} 
									align="center" 
									sx={{ 
										fontWeight: 800, 
										minWidth: 180,
										bgcolor: 'background.paper',
										borderBottom: '2px solid',
										borderColor: 'divider'
									}}
								>
									<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, alignItems: 'center' }}>
										<Box>
											<Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.2 }}>
												{period.activity_name}
											</Typography>
											<Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, mt: 0.5, display: 'block' }}>
												{format(new Date(`2000-01-01T${period.start_time}`), 'h:mm a')} - {format(new Date(`2000-01-01T${period.end_time}`), 'h:mm a')}
											</Typography>
											{period.trainer && (
												<Typography 
													variant="caption" 
													sx={{ 
														fontWeight: 700, 
														color: 'primary.main', 
														bgcolor: alpha(theme.palette.primary.main, 0.08), 
														px: 1, 
														py: 0.5, 
														borderRadius: 1, 
														mt: 1,
														display: 'inline-block',
														fontSize: '0.7rem'
													}}
												>
													{period.trainer}
												</Typography>
											)}
										</Box>

										{period.activity_type === 'break' ? (
											<Chip
												label="BREAK"
												size="small"
												sx={{ 
													fontWeight: 800, 
													fontSize: '0.65rem', 
													height: 20, 
													borderRadius: 1,
													bgcolor: alpha(theme.palette.error.main, 0.1),
													color: 'error.main',
													border: '1px solid',
													borderColor: alpha(theme.palette.error.main, 0.2)
												}}
											/>
										) : (
											<FormControl size="small" sx={{ minWidth: 110 }}>
												<Select
													value=""
													displayEmpty
													onChange={(e) => onPeriodMarkAll(period.id!, e.target.value as string)}
													disabled={!canEditPeriod(period)}
													sx={{
														fontSize: '0.7rem',
														fontWeight: 700,
														height: 30,
														borderRadius: 1.5,
														bgcolor: canEditPeriod(period) ? 'background.default' : alpha(theme.palette.action.disabledBackground, 0.1),
														'& .MuiOutlinedInput-notchedOutline': {
															borderColor: 'divider'
														},
														'&:hover .MuiOutlinedInput-notchedOutline': {
															borderColor: 'primary.main'
														}
													}}
													renderValue={(selected) => {
														if (selected === "") {
															return (
																<Typography variant="caption" sx={{ fontWeight: 800, fontSize: '0.7rem', color: 'primary.main', letterSpacing: '0.02em' }}>
																	MARK ALL
																</Typography>
															);
														}
														return selected;
													}}
												>
													{statuses.map(s => (
														<MenuItem key={s.value} value={s.value} sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
															<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
																{React.cloneElement(s.icon as React.ReactElement<any>, {
																	sx: { ...((s.icon as React.ReactElement<any>).props.sx || {}), fontSize: '1.1rem' }
																})}
																{s.label}
															</Box>
														</MenuItem>
													))}
												</Select>
											</FormControl>
										)}
									</Box>
								</TableCell>
							))
						) : (
							<>
								<TableCell align="center" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Attendance Status</TableCell>
								<TableCell sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Remarks</TableCell>
							</>
						)}
					</TableRow>
				</TableHead>
				<TableBody>
					{allocations.length === 0 ? (
						<TableRow>
							<TableCell colSpan={hasPeriods ? dailyPlan.length + 1 : 3} align="center" sx={{ py: 10 }}>
								<Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', fontWeight: 500 }}>
									No students allocated to this batch.
								</Typography>
							</TableCell>
						</TableRow>
					) : (
						allocations.map(allocation => {
							const droppedOut = isDroppedOut(allocation.candidate_id);
							const isPlaced = allocation.status === 'moved_to_placement';

							if (droppedOut || isPlaced) {
								return (
									<TableRow key={allocation.id} sx={{ bgcolor: alpha(theme.palette.action.disabledBackground, 0.1) }}>
										<TableCell
											sx={{
												position: 'sticky',
												left: 0,
												bgcolor: alpha(theme.palette.action.disabledBackground, 0.05),
												zIndex: 5,
												borderRight: '1px solid',
												borderColor: 'divider',
												boxShadow: '2px 0 5px -2px rgba(0,0,0,0.02)'
											}}
										>
											<Box>
												<Typography variant="body2" sx={{ fontWeight: 600, color: 'text.disabled' }}>
													{allocation.candidate?.name || 'Unknown'}
												</Typography>
												<Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.75rem' }}>
													{allocation.candidate?.email}
												</Typography>
											</Box>
										</TableCell>
										<TableCell colSpan={hasPeriods ? dailyPlan.length : 2} align="center">
											<Chip
												label={isPlaced ? "Moved to Placement" : "Dropped Out"}
												size="small"
												color={isPlaced ? "success" : "error"}
												variant="outlined"
												icon={isPlaced ? undefined : <BlockIcon sx={{ fontSize: '14px !important' }} />}
												sx={{ fontWeight: 800, borderRadius: 1, textTransform: 'uppercase', fontSize: '0.65rem' }}
											/>
											<Typography variant="caption" display="block" sx={{ mt: 1, fontWeight: 500, color: 'text.disabled' }}>
												{isPlaced 
													? "Attendance cannot be marked for candidates in placement" 
													: "Cannot mark attendance for dropped out candidates"}
											</Typography>
										</TableCell>
									</TableRow>
								);
							}

							if (hasPeriods) {
								return (
									<AttendanceTableRow
										key={allocation.id}
										allocation={allocation}
										dailyPlan={dailyPlan}
										getPeriodAttendance={(periodId) => getPeriodAttendance(allocation.candidate_id, periodId)}
										isActive={isActive}
										onPeriodStatusChange={onPeriodStatusChange}
										onTrainerNotesChange={onTrainerNotesChange}
										canEditPeriod={canEditPeriod}
									/>
								);
							} else {
								const status = getCandidateStatus(allocation.candidate_id);
								const remark = getCandidateRemark(allocation.candidate_id);

								return (
									<AttendanceTableRow
										key={allocation.id}
										allocation={allocation}
										status={status}
										remark={remark}
										isActive={isActive}
										onStatusChange={onStatusChange}
										onRemarkChange={onRemarkChange}
									/>
								);
							}
						})
					)}
				</TableBody>
			</Table>
		</TableContainer>
	);
});

AttendanceTable.displayName = 'AttendanceTable';

export default AttendanceTable;
