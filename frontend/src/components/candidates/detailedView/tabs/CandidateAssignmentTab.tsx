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
	CircularProgress,
	LinearProgress,
	Divider,
	Accordion,
	AccordionSummary,
	AccordionDetails,
	useTheme,
	alpha
} from '@mui/material';
import {
	Assignment as AssignmentIcon,
	PendingActions as PendingIcon,
	ExpandMore as ExpandMoreIcon,
	School as BatchIcon
} from '@mui/icons-material';
import { useDateTime } from '../../../../hooks/useDateTime';
import { SectionHeader, SectionCard } from '../DetailedViewCommon';
import trainingExtensionService from '../../../../services/trainingExtensionService';
import type { TrainingAssignment } from '../../../../models/training';
import type { Candidate } from '../../../../models/candidate';

interface CandidateAssignmentTabProps {
	candidate: Candidate;
}

const CandidateAssignmentTab: React.FC<CandidateAssignmentTabProps> = ({ candidate }) => {
	const theme = useTheme();
	const { formatDate } = useDateTime();
	const [assignments, setAssignments] = useState<TrainingAssignment[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const loadData = async () => {
			if (!candidate.public_id) return;
			try {
				const data = await trainingExtensionService.getCandidateAssignments(candidate.public_id);
				setAssignments(data);
			} catch (error) {
				console.error('Failed to fetch assignments:', error);
			} finally {
				setLoading(false);
			}
		};
		loadData();
	}, [candidate.public_id]);

	// Group assignments by batch
	const assignmentsByBatch = useMemo(() => {
		const grouped = new Map<number, { batch: any; records: TrainingAssignment[] }>();

		assignments.forEach(record => {
			if (!record.batch) return;

			if (!grouped.has(record.batch_id)) {
				grouped.set(record.batch_id, { batch: record.batch, records: [] });
			}
			grouped.get(record.batch_id)!.records.push(record);
		});

		return Array.from(grouped.values());
	}, [assignments]);

	// Overall statistics
	const overallStats = useMemo(() => {
		if (assignments.length === 0) return { avgPercentage: 0, total: 0 };
		const totalPercentage = assignments.reduce((sum, a) => {
			const perc = (a.marks_obtained / a.max_marks) * 100;
			return sum + perc;
		}, 0);
		return {
			avgPercentage: (totalPercentage / assignments.length).toFixed(1),
			total: assignments.length
		};
	}, [assignments]);

	// Batch-specific statistics
	const getBatchStats = (records: TrainingAssignment[]) => {
		if (records.length === 0) return { avgPercentage: 0, total: 0 };
		const totalPercentage = records.reduce((sum, a) => {
			const perc = (a.marks_obtained / a.max_marks) * 100;
			return sum + perc;
		}, 0);
		return {
			avgPercentage: (totalPercentage / records.length).toFixed(1),
			total: records.length
		};
	};

	if (loading) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
				<CircularProgress size={24} sx={{ color: 'primary.main' }} />
			</Box>
		);
	}

	const renderRating = (percentage: number) => {
		let color = 'success.main';
		if (percentage < 40) color = 'error.main';
		else if (percentage < 70) color = 'warning.main';

		return (
			<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
				<Box sx={{ flexGrow: 1, minWidth: 80 }}>
					<LinearProgress
						variant="determinate"
						value={percentage}
						sx={{
							height: 6,
							borderRadius: 3,
							bgcolor: 'divider',
							'& .MuiLinearProgress-bar': { bgcolor: color }
						}}
					/>
				</Box>
				<Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', width: '40px' }}>
					{percentage.toFixed(0)}%
				</Typography>
			</Box>
		);
	};

	return (
		<SectionCard>
			<SectionHeader title="Assignment Performance" icon={<AssignmentIcon />} />

			{assignments.length > 0 ? (
				<>
					{/* Overall Summary Strip */}
					<Box sx={{ display: 'flex', gap: 6, mb: 4, bgcolor: alpha(theme.palette.background.default, 0.5), p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: '2px' }}>
						<Box>
							<Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.65rem', display: 'block', mb: 0.5 }}>
								Total Assignments
							</Typography>
							<Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary' }}>{overallStats.total}</Typography>
						</Box>
						<Divider orientation="vertical" flexItem sx={{ borderColor: 'divider' }} />
						<Box flexGrow={1} maxWidth={400}>
							<Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.65rem', display: 'block', mb: 0.5 }}>
								Overall Average Proficiency
							</Typography>
							<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
								<Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary' }}>{overallStats.avgPercentage}%</Typography>
								<Box sx={{ flexGrow: 1 }}>
									<LinearProgress
										variant="determinate"
										value={typeof overallStats.avgPercentage === 'string' ? parseFloat(overallStats.avgPercentage) : overallStats.avgPercentage}
										sx={{
											height: 8,
											borderRadius: 4,
											bgcolor: 'divider',
											'& .MuiLinearProgress-bar': { bgcolor: 'info.main' }
										}}
									/>
								</Box>
							</Box>
						</Box>
					</Box>

					{/* Assignments by Batch */}
					<Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary', mb: 2 }}>
						Assignments by Training Batch
					</Typography>

					{assignmentsByBatch.map(({ batch, records }, index) => {
						const batchStats = getBatchStats(records);
						return (
							<Accordion
								key={batch.id}
								defaultExpanded={index === 0}
								sx={{
									mb: 2,
									border: '1px solid',
									borderColor: 'divider',
									'&:before': { display: 'none' },
									boxShadow: 'none'
								}}
							>
								<AccordionSummary
									expandIcon={<ExpandMoreIcon />}
									sx={{ bgcolor: alpha(theme.palette.background.default, 0.3), '&:hover': { bgcolor: alpha(theme.palette.background.default, 0.6) } }}
								>
									<Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
										<BatchIcon sx={{ color: 'primary.main', fontSize: 20 }} />
										<Box sx={{ flexGrow: 1 }}>
											<Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>
												{batch.batch_name}
											</Typography>
											<Typography variant="caption" sx={{ color: 'text.secondary' }}>
												{records.length} assignments • {batchStats.avgPercentage}% average
											</Typography>
										</Box>
										<Box sx={{ mr: 2 }}>
											<Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>Batch Average</Typography>
											<Typography variant="body2" sx={{ fontWeight: 700, color: 'info.main' }}>{batchStats.avgPercentage}%</Typography>
										</Box>
									</Box>
								</AccordionSummary>
								<AccordionDetails sx={{ p: 0 }}>
									<TableContainer>
										<Table size="small">
											<TableHead sx={{ bgcolor: alpha(theme.palette.background.default, 0.5) }}>
												<TableRow>
													<TableCell sx={{ fontWeight: 700, color: 'text.secondary', py: 1.5 }}>ASSIGNMENT NAME</TableCell>
													<TableCell sx={{ fontWeight: 700, color: 'text.secondary', py: 1.5 }}>MARKS</TableCell>
													<TableCell sx={{ fontWeight: 700, color: 'text.secondary', py: 1.5 }}>PROFICIENCY</TableCell>
													<TableCell sx={{ fontWeight: 700, color: 'text.secondary', py: 1.5 }}>DATE</TableCell>
												</TableRow>
											</TableHead>
											<TableBody>
												{records.map((row) => (
													<TableRow key={row.id} hover>
														<TableCell sx={{ color: 'text.primary', fontWeight: 600 }}>
															{row.assignment_name}
														</TableCell>
														<TableCell sx={{ color: 'text.primary' }}>
															<Typography variant="body2" sx={{ fontWeight: 500 }}>
																{row.marks_obtained} <Box component="span" sx={{ color: 'text.secondary', fontWeight: 400 }}>/ {row.max_marks}</Box>
															</Typography>
														</TableCell>
														<TableCell sx={{ width: '200px' }}>
															{renderRating((row.marks_obtained / row.max_marks) * 100)}
														</TableCell>
														<TableCell sx={{ color: 'text.secondary' }}>
															{formatDate(row.assignment_date)}
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
				</>
			) : (
				<Box sx={{ textAlign: 'center', py: 8, bgcolor: alpha(theme.palette.background.default, 0.5), border: '1px dashed', borderColor: 'divider', borderRadius: '2px' }}>
					<PendingIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
					<Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 600 }}>No Assignment Records Found</Typography>
					<Typography variant="body2" color="text.secondary">
						Detailed performance metrics will appear here once the candidate completes their first training assignment.
					</Typography>
				</Box>
			)}
		</SectionCard>
	);
};

export default CandidateAssignmentTab;
