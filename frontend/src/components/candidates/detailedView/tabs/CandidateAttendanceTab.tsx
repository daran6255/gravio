import React, { useState, useEffect, useMemo } from 'react';
import {
	Typography,
	Box,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Chip,
	CircularProgress,
	Accordion,
	AccordionSummary,
	AccordionDetails,
	alpha,
	useTheme,
	Stack,
	Avatar,
	Grid,
	LinearProgress
} from '@mui/material';
import {
	EventAvailable as AttendanceIcon,
	ExpandMore as ExpandMoreIcon,
	School as BatchIcon,
	CheckCircle as PresentIcon,
	Cancel as AbsentIcon,
	Assessment as RateIcon,
	CalendarMonth as DateIcon,
	Notes as RemarkIcon
} from '@mui/icons-material';
import { useDateTime } from '../../../../hooks/useDateTime';
import { SectionHeader, SectionCard } from '../DetailedViewCommon';
import StatCard from '../../../common/stats/StatCard';
import trainingExtensionService from '../../../../services/trainingExtensionService';
import type { TrainingAttendance } from '../../../../models/training';
import type { Candidate } from '../../../../models/candidate';

interface CandidateAttendanceTabProps {
	candidate: Candidate;
}

const CandidateAttendanceTab: React.FC<CandidateAttendanceTabProps> = ({ candidate }) => {
	const theme = useTheme();
	const { formatDate } = useDateTime();
	const [attendance, setAttendance] = useState<TrainingAttendance[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const loadData = async () => {
			if (!candidate.public_id) return;
			try {
				const data = await trainingExtensionService.getCandidateAttendance(candidate.public_id);
				setAttendance(data);
			} catch (error) {
				console.error('Failed to fetch attendance:', error);
			} finally {
				setLoading(false);
			}
		};
		loadData();
	}, [candidate.public_id]);

	// Group attendance by batch
	const attendanceByBatch = useMemo(() => {
		const grouped = new Map<number, { batch: any; records: TrainingAttendance[] }>();

		attendance.forEach(record => {
			if (!record.batch) return;

			if (!grouped.has(record.batch_id)) {
				grouped.set(record.batch_id, { batch: record.batch, records: [] });
			}
			grouped.get(record.batch_id)!.records.push(record);
		});

		return Array.from(grouped.values());
	}, [attendance]);

	// Overall statistics
	const overallStats = useMemo(() => {
		const total = attendance.length;
		if (total === 0) return { present: 0, absent: 0, percentage: 0 };
		const present = attendance.filter(a => a.status === 'present').length;
		const absent = attendance.filter(a => a.status === 'absent').length;
		const percentage = Math.round((present / total) * 100);
		return { present, absent, percentage };
	}, [attendance]);

	const getBatchStats = (records: TrainingAttendance[]) => {
		const total = records.length;
		if (total === 0) return { present: 0, absent: 0, percentage: 0 };
		const present = records.filter(a => a.status === 'present').length;
		const absent = records.filter(a => a.status === 'absent').length;
		const percentage = Math.round((present / total) * 100);
		return { present, absent, percentage };
	};

	const getStatusChip = (status: string) => {
		if (status === 'present') {
			return (
				<Chip 
					label="PRESENT" 
					size="small" 
					sx={{ 
						bgcolor: alpha(theme.palette.success.main, 0.1), 
						color: 'success.main', 
						fontWeight: 800, 
						fontSize: '0.65rem',
						borderRadius: 1.5 
					}} 
				/>
			);
		}
		if (status === 'absent') {
			return (
				<Chip 
					label="ABSENT" 
					size="small" 
					sx={{ 
						bgcolor: alpha(theme.palette.error.main, 0.1), 
						color: 'error.main', 
						fontWeight: 800, 
						fontSize: '0.65rem',
						borderRadius: 1.5 
					}} 
				/>
			);
		}
		return (
			<Chip 
				label={status.toUpperCase()} 
				size="small" 
				sx={{ 
					bgcolor: alpha(theme.palette.background.default, 0.5), 
					color: 'text.secondary', 
					fontWeight: 800, 
					fontSize: '0.65rem',
					borderRadius: 1.5 
				}} 
			/>
		);
	};

	if (loading) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 10 }}>
				<CircularProgress size={40} thickness={4} sx={{ color: 'primary.main' }} />
			</Box>
		);
	}

	if (attendance.length === 0) {
		return (
			<SectionCard sx={{ textAlign: 'center', py: 10, bgcolor: alpha(theme.palette.background.default, 0.4), borderRadius: 4 }}>
				<Box sx={{ maxWidth: 450, mx: 'auto' }}>
					<Avatar sx={{ 
						width: 100, 
						height: 100, 
						bgcolor: alpha(theme.palette.primary.main, 0.05), 
						color: 'primary.main',
						mx: 'auto',
						mb: 3
					}}>
						<AttendanceIcon sx={{ fontSize: 50 }} />
					</Avatar>
					<Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5 }}>No Attendance Data</Typography>
					<Typography variant="body2" color="text.secondary" sx={{ mb: 4, lineHeight: 1.6 }}>
						Attendance history will be populated here once the candidate begins attending their assigned training sessions.
					</Typography>
				</Box>
			</SectionCard>
		);
	}

	return (
		<Stack spacing={4}>
			{/* Overall Attendance KPIs */}
			<Grid container spacing={3}>
				<Grid size={{ xs: 12, md: 4 }}>
					<StatCard 
						title="Present Sessions" 
						value={overallStats.present} 
						icon={<PresentIcon />} 
						color={theme.palette.success.main} 
						subtitle="Total days attended"
					/>
				</Grid>
				<Grid size={{ xs: 12, md: 4 }}>
					<StatCard 
						title="Absent Days" 
						value={overallStats.absent} 
						icon={<AbsentIcon />} 
						color={theme.palette.error.main} 
						subtitle="Sessions missed to date"
					/>
				</Grid>
				<Grid size={{ xs: 12, md: 4 }}>
					<StatCard 
						title="Attendance Rate" 
						value={overallStats.percentage} 
						unit="%"
						icon={<RateIcon />} 
						color={theme.palette.info.main} 
						subtitle="Overall consistency score"
					>
						<LinearProgress 
							variant="determinate" 
							value={overallStats.percentage} 
							sx={{ 
								height: 4, 
								borderRadius: 2, 
								bgcolor: alpha(theme.palette.info.main, 0.1),
								'& .MuiLinearProgress-bar': { borderRadius: 2 }
							}} 
						/>
					</StatCard>
				</Grid>
			</Grid>

			<SectionCard>
				<SectionHeader title="Batch-wise Attendance Details" icon={<AttendanceIcon />} />
				
				<Box sx={{ mt: 3 }}>
					{attendanceByBatch.map(({ batch, records }, index) => {
						const batchStats = getBatchStats(records);
						return (
							<Accordion
								key={batch.id}
								defaultExpanded={index === 0}
								elevation={0}
								sx={{
									mb: 3,
									borderRadius: '16px !important',
									border: '1px solid',
									borderColor: 'divider',
									overflow: 'hidden',
									'&:before': { display: 'none' },
									boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
								}}
							>
								<AccordionSummary
									expandIcon={<ExpandMoreIcon />}
									sx={{ 
										bgcolor: alpha(theme.palette.background.default, 0.5),
										px: 3,
										py: 1,
										'&.Mui-expanded': { borderBottom: '1px solid', borderColor: 'divider' }
									}}
								>
									<Stack direction="row" spacing={3} alignItems="center" sx={{ width: '100%' }}>
										<Avatar sx={{ bgcolor: 'primary.main', color: 'white', width: 40, height: 40 }}>
											<BatchIcon sx={{ fontSize: 22 }} />
										</Avatar>
										<Box sx={{ flexGrow: 1 }}>
											<Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
												{batch.batch_name}
											</Typography>
											<Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
												{records.length} TOTAL SESSIONS RECORDED
											</Typography>
										</Box>
										<Stack direction="row" spacing={4} sx={{ mr: 2, display: { xs: 'none', sm: 'flex' } }}>
											<Box sx={{ textAlign: 'center' }}>
												<Typography variant="caption" sx={{ display: 'block', fontWeight: 700, color: 'text.disabled' }}>RATE</Typography>
												<Typography variant="body2" sx={{ fontWeight: 800, color: 'info.main' }}>{batchStats.percentage}%</Typography>
											</Box>
											<Box sx={{ textAlign: 'center' }}>
												<Typography variant="caption" sx={{ display: 'block', fontWeight: 700, color: 'text.disabled' }}>PRESENT</Typography>
												<Typography variant="body2" sx={{ fontWeight: 800, color: 'success.main' }}>{batchStats.present}</Typography>
											</Box>
										</Stack>
									</Stack>
								</AccordionSummary>
								<AccordionDetails sx={{ p: 0 }}>
									<TableContainer>
										<Table size="medium">
											<TableHead sx={{ bgcolor: alpha(theme.palette.background.default, 0.3) }}>
												<TableRow>
													<TableCell sx={{ fontWeight: 800, color: 'text.secondary', pl: 3 }}>DATE</TableCell>
													<TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>STATUS</TableCell>
													<TableCell sx={{ fontWeight: 800, color: 'text.secondary', pr: 3 }}>REMARKS & OBSERVATIONS</TableCell>
												</TableRow>
											</TableHead>
											<TableBody>
												{records.map((row) => (
													<TableRow key={row.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
														<TableCell sx={{ pl: 3 }}>
															<Stack direction="row" spacing={1.5} alignItems="center">
																<DateIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
																<Typography variant="body2" sx={{ fontWeight: 600 }}>
																	{formatDate(row.date)}
																</Typography>
															</Stack>
														</TableCell>
														<TableCell>{getStatusChip(row.status)}</TableCell>
														<TableCell sx={{ pr: 3 }}>
															<Stack direction="row" spacing={1.5} alignItems="center">
																<RemarkIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
																<Typography 
																	variant="body2" 
																	sx={{ 
																		color: row.remarks ? 'text.primary' : 'text.disabled',
																		fontStyle: row.remarks ? 'normal' : 'italic',
																		lineHeight: 1.4
																	}}
																>
																	{row.remarks || 'No notes for this session'}
																</Typography>
															</Stack>
														</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
									</TableContainer>
								</AccordionDetails>
							</Accordion>
						);
					})}
				</Box>
			</SectionCard>
		</Stack>
	);
};

export default CandidateAttendanceTab;
