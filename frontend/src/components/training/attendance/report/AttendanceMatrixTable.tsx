import React from 'react';
import {
	Box,
	Paper,
	Typography,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Tooltip,
	IconButton,
	useTheme,
	alpha
} from '@mui/material';
import { EventBusy as HolidayIcon, DeleteForever as DeleteForeverIcon } from '@mui/icons-material';
import { format, isWeekend } from 'date-fns';
import type { TrainingAttendance, CandidateAllocation, TrainingBatchEvent } from '../../../../models/training';
import { getStatusMap } from './AttendanceLegendBar';
import type { ConfirmDialogState } from '../dialogs/ClearAttendanceDialog';

interface AttendanceMatrixTableProps {
	days: Date[];
	allocations: CandidateAllocation[];
	attendance: TrainingAttendance[];
	batchEvents: TrainingBatchEvent[];
	isAdmin: boolean;
	onOpenClearDialog: (allocation: CandidateAllocation) => void;
	getCandidateRecordCount: (candidateId: number) => number;
	setConfirmDialog: React.Dispatch<React.SetStateAction<ConfirmDialogState>>;
}

// ── Cell helpers ──────────────────────────────────────────────

const HolidayCell: React.FC<{ dateStr: string; title: string }> = ({ dateStr, title }) => {
	const theme = useTheme();
	return (
		<TableCell 
			key={dateStr} 
			align="center" 
			sx={{ 
				bgcolor: alpha(theme.palette.error.main, 0.05), 
				color: 'error.main', 
				p: 0,
				borderRight: '1px solid',
				borderColor: 'divider'
			}}
		>
			<Tooltip title={`Holiday: ${title}`}>
				<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 0.5 }}>
					<HolidayIcon sx={{ fontSize: 16 }} />
					<Typography sx={{ fontSize: '9px', fontWeight: 800 }}>HOL</Typography>
				</Box>
			</Tooltip>
		</TableCell>
	);
};

const WeekendCell: React.FC<{ dateStr: string }> = ({ dateStr }) => {
	const theme = useTheme();
	return (
		<TableCell 
			key={dateStr} 
			align="center" 
			sx={{ 
				bgcolor: alpha(theme.palette.action.disabledBackground, 0.05), 
				p: 0,
				borderRight: '1px solid',
				borderColor: 'divider'
			}}
		>
			<Typography sx={{ fontSize: '10px', color: 'text.disabled', fontWeight: 800 }}>W/E</Typography>
		</TableCell>
	);
};

const EmptyCell: React.FC<{ dateStr: string }> = ({ dateStr }) => (
	<TableCell 
		key={dateStr} 
		align="center" 
		sx={{ 
			p: 0,
			borderRight: '1px solid',
			borderColor: 'divider'
		}}
	>
		<Typography sx={{ color: 'text.disabled', fontWeight: 400 }}>-</Typography>
	</TableCell>
);

const StatusCell: React.FC<{ dateStr: string; dayRecords: TrainingAttendance[] }> = ({ dateStr, dayRecords }) => {
	const theme = useTheme();
	const statusMap = getStatusMap(theme);
	
	const statusCounts = dayRecords.reduce((acc, rec) => {
		acc[rec.status] = (acc[rec.status] || 0) + 1;
		return acc;
	}, {} as Record<string, number>);

	const total = dayRecords.length;
	const consolidated =
		statusCounts['absent'] === total ? 'absent' :
			statusCounts['present'] === total ? 'present' :
				'half_day';

	const statusInfo = (statusMap as any)[consolidated];
	const tooltipTitle = dayRecords
		.map(r => `${r.period?.activity_name || 'Full Day'}: ${r.status.toUpperCase()}`)
		.join('\n');

	return (
		<TableCell 
			key={dateStr} 
			align="center" 
			sx={{ 
				p: 0,
				borderRight: '1px solid',
				borderColor: 'divider'
			}}
		>
			<Tooltip title={tooltipTitle}>
				<Box sx={{ color: statusInfo.color, display: 'flex', justifyContent: 'center' }}>
					{statusInfo.icon}
				</Box>
			</Tooltip>
		</TableCell>
	);
};

// ── Main component ────────────────────────────────────────────

const AttendanceMatrixTable: React.FC<AttendanceMatrixTableProps> = ({
	days,
	allocations,
	attendance,
	batchEvents,
	isAdmin,
	onOpenClearDialog,
	getCandidateRecordCount,
}) => {
	const theme = useTheme();
	const getHoliday = (day: Date) => {
		const dateStr = format(day, 'yyyy-MM-dd');
		return batchEvents.find(e => e.date === dateStr && e.event_type === 'holiday');
	};

	return (
		<TableContainer
			component={Paper}
			elevation={0}
			sx={{ 
				border: '1px solid',
				borderColor: 'divider', 
				borderRadius: 2, 
				maxHeight: '70vh', 
				overflow: 'auto',
				boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
			}}
		>
			<Table size="small" stickyHeader sx={{ minWidth: (days.length * 50) + 300 }}>
				<TableHead>
					<TableRow>
						<TableCell
							sx={{
								fontWeight: 800,
								bgcolor: 'background.paper',
								zIndex: 30,
								left: 0,
								position: 'sticky',
								borderRight: '1px solid',
								borderColor: 'divider',
								width: 260,
								minWidth: 260,
								fontSize: '0.75rem',
								textTransform: 'uppercase',
								letterSpacing: '0.05em',
								color: 'text.secondary'
							}}
						>
							Student Name
						</TableCell>
						{days.map(day => (
							<TableCell
								key={day.toISOString()}
								align="center"
								sx={{ 
									fontWeight: 800, 
									bgcolor: isWeekend(day) ? alpha(theme.palette.action.disabledBackground, 0.05) : 'background.paper',
									minWidth: 50, 
									p: 1,
									borderRight: '1px solid',
									borderColor: 'divider',
									zIndex: 10
								}}
							>
								<Typography variant="caption" sx={{ display: 'block', fontWeight: 800, color: 'text.primary' }}>{format(day, 'dd')}</Typography>
								<Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.65rem', textTransform: 'uppercase' }}>{format(day, 'MMM')}</Typography>
							</TableCell>
						))}
						{isAdmin && (
							<TableCell sx={{ fontWeight: 800, bgcolor: 'background.paper', minWidth: 80, textAlign: 'center', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary', zIndex: 10 }}>
								Actions
							</TableCell>
						)}
					</TableRow>
				</TableHead>

				<TableBody>
					{allocations.map(allocation => {
						const recordCount = getCandidateRecordCount(allocation.candidate_id);

						return (
							<TableRow key={allocation.id} hover sx={{ transition: 'background-color 0.15s' }}>
								<TableCell
									sx={{
										position: 'sticky',
										left: 0,
										bgcolor: 'background.paper',
										zIndex: 20,
										borderRight: '1px solid',
										borderColor: 'divider',
										boxShadow: '2px 0 5px -2px rgba(0,0,0,0.02)',
										'.MuiTableRow-root:hover &': {
											bgcolor: alpha(theme.palette.primary.main, 0.02),
										}
									}}
								>
									<Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', lineHeight: 1.2 }}>{allocation.candidate?.name}</Typography>
									<Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>{allocation.candidate?.email}</Typography>
									{recordCount === 0 && (
										<Typography variant="caption" sx={{ display: 'block', color: 'text.disabled', fontStyle: 'italic', fontSize: '0.65rem', mt: 0.5 }}>
											No records
										</Typography>
									)}
								</TableCell>

								{days.map(day => {
									const dateStr = format(day, 'yyyy-MM-dd');
									const holiday = getHoliday(day);

									if (holiday) return <HolidayCell key={dateStr} dateStr={dateStr} title={holiday.title} />;
									if (isWeekend(day)) return <WeekendCell key={dateStr} dateStr={dateStr} />;

									const dayRecords = attendance.filter(
										a => a.candidate_id === allocation.candidate_id && a.date === dateStr
									);

									if (dayRecords.length === 0) return <EmptyCell key={dateStr} dateStr={dateStr} />;
									return <StatusCell key={dateStr} dateStr={dateStr} dayRecords={dayRecords} />;
								})}

								{isAdmin && (
									<TableCell align="center" sx={{ p: 0.5, borderRight: '1px solid', borderColor: 'divider' }}>
										{recordCount > 0 ? (
											<Tooltip title={`Clear all ${recordCount} records for ${allocation.candidate?.name}`}>
												<IconButton
													size="small"
													onClick={() => onOpenClearDialog(allocation)}
													sx={{ 
														color: 'error.main',
														opacity: 0.6, 
														'&:hover': { 
															opacity: 1, 
															bgcolor: alpha(theme.palette.error.main, 0.08) 
														}, 
														transition: 'all 0.2s' 
													}}
												>
													<DeleteForeverIcon fontSize="small" />
												</IconButton>
											</Tooltip>
										) : (
											<Typography variant="caption" sx={{ color: 'text.disabled' }}>—</Typography>
										)}
									</TableCell>
								)}
							</TableRow>
						);
					})}
				</TableBody>
			</Table>
		</TableContainer>
	);
};

export default AttendanceMatrixTable;
