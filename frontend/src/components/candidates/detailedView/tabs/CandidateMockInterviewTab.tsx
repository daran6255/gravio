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
	LinearProgress,
	Divider,
	Stack,
	Accordion,
	AccordionSummary,
	AccordionDetails,
	useTheme,
	alpha
} from '@mui/material';
import {
	RecordVoiceOver as InterviewIcon,
	ExpandMore as ExpandMoreIcon,
	School as BatchIcon
} from '@mui/icons-material';
import { useDateTime } from '../../../../hooks/useDateTime';
import { SectionHeader, SectionCard } from '../DetailedViewCommon';
import trainingExtensionService from '../../../../services/trainingExtensionService';
import type { TrainingMockInterview } from '../../../../models/training';
import type { Candidate } from '../../../../models/candidate';

interface CandidateMockInterviewTabProps {
	candidate: Candidate;
}

const CandidateMockInterviewTab: React.FC<CandidateMockInterviewTabProps> = ({ candidate }) => {
	const theme = useTheme();
	const { formatDate } = useDateTime();
	const [interviews, setInterviews] = useState<TrainingMockInterview[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const loadData = async () => {
			if (!candidate.public_id) return;
			try {
				const data = await trainingExtensionService.getCandidateMockInterviews(candidate.public_id);
				setInterviews(data);
			} catch (error) {
				console.error('Failed to fetch mock interviews:', error);
			} finally {
				setLoading(false);
			}
		};
		loadData();
	}, [candidate.public_id]);

	// Group interviews by batch
	const interviewsByBatch = useMemo(() => {
		const grouped = new Map<number, { batch: any; records: TrainingMockInterview[] }>();

		interviews.forEach(record => {
			if (!record.batch) return;

			if (!grouped.has(record.batch_id)) {
				grouped.set(record.batch_id, { batch: record.batch, records: [] });
			}
			grouped.get(record.batch_id)!.records.push(record);
		});

		return Array.from(grouped.values());
	}, [interviews]);

	// Overall statistics
	const overallStats = useMemo(() => {
		const total = interviews.length;
		if (total === 0) return { cleared: 0, pending: 0, avgRating: 0 };
		const cleared = interviews.filter(i => i.status === 'cleared').length;
		const pending = interviews.filter(i => i.status === 'pending').length;
		const ratedInterviews = interviews.filter(i => i.overall_rating !== undefined && i.status !== 'absent');
		const avgRating = ratedInterviews.length > 0
			? ratedInterviews.reduce((sum, i) => sum + (i.overall_rating || 0), 0) / ratedInterviews.length
			: 0;
		return { cleared, pending, avgRating: avgRating.toFixed(1) };
	}, [interviews]);

	// Batch-specific statistics
	const getBatchStats = (records: TrainingMockInterview[]) => {
		const total = records.length;
		if (total === 0) return { cleared: 0, avgRating: 0 };
		const cleared = records.filter(i => i.status === 'cleared').length;
		const ratedInterviews = records.filter(i => i.overall_rating !== undefined && i.status !== 'absent');
		const avgRating = ratedInterviews.length > 0
			? ratedInterviews.reduce((sum, i) => sum + (i.overall_rating || 0), 0) / ratedInterviews.length
			: 0;
		return { cleared, avgRating: avgRating.toFixed(1) };
	};

	if (loading) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
				<CircularProgress size={24} sx={{ color: 'primary.main' }} />
			</Box>
		);
	}

	const getStatusChip = (status: string) => {
		switch (status) {
			case 'cleared':
				return <Chip label="Cleared" size="small" sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), color: 'success.main', fontWeight: 700, borderRadius: '4px' }} />;
			case 're-test':
				return <Chip label="Re-test" size="small" sx={{ bgcolor: alpha(theme.palette.warning.main, 0.1), color: 'warning.dark', fontWeight: 700, borderRadius: '4px' }} />;
			case 'absent':
				return <Chip label="Absent" size="small" sx={{ bgcolor: alpha(theme.palette.background.default, 0.5), color: 'text.secondary', fontWeight: 700, borderRadius: '4px' }} />;
			default:
				return <Chip label={status.toUpperCase()} size="small" sx={{ bgcolor: alpha(theme.palette.info.main, 0.1), color: 'info.main', fontWeight: 700, borderRadius: '4px' }} />;
		}
	};

	const renderRating = (rating: number | undefined, status: string) => {
		if (status === 'absent' || rating === undefined || rating === null) {
			return <Typography variant="caption" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>N/A</Typography>;
		}

		return (
			<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
				<Box sx={{ flexGrow: 1, minWidth: 60 }}>
					<LinearProgress
						variant="determinate"
						value={rating * 10}
						sx={{
							height: 4,
							borderRadius: 2,
							bgcolor: 'divider',
							'& .MuiLinearProgress-bar': { bgcolor: rating >= 7 ? 'success.main' : rating >= 4 ? 'warning.main' : 'error.main' }
						}}
					/>
				</Box>
				<Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
					{rating}
				</Typography>
			</Box>
		);
	};

	return (
		<SectionCard>
			<SectionHeader title="Mock Interview Portfolio" icon={<InterviewIcon />} />

			{interviews.length > 0 ? (
				<>
					{/* Overall Summary Strip */}
					<Box sx={{ display: 'flex', gap: 6, mb: 4, bgcolor: alpha(theme.palette.background.default, 0.5), p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: '2px' }}>
						<Box>
							<Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.65rem', display: 'block', mb: 0.5 }}>
								Total Sessions
							</Typography>
							<Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary' }}>{interviews.length}</Typography>
						</Box>
						<Divider orientation="vertical" flexItem sx={{ borderColor: 'divider' }} />
						<Box>
							<Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.65rem', display: 'block', mb: 0.5 }}>
								Cleared
							</Typography>
							<Typography variant="h5" sx={{ fontWeight: 800, color: 'success.main' }}>{overallStats.cleared}</Typography>
						</Box>
						<Divider orientation="vertical" flexItem sx={{ borderColor: 'divider' }} />
						<Box>
							<Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.65rem', display: 'block', mb: 0.5 }}>
								Overall Avg Rating
							</Typography>
							<Typography variant="h5" sx={{ fontWeight: 800, color: 'info.main' }}>{overallStats.avgRating}/10</Typography>
						</Box>
					</Box>

					{/* Mock Interviews by Batch */}
					<Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary', mb: 2 }}>
						Mock Interviews by Training Batch
					</Typography>

					{interviewsByBatch.map(({ batch, records }, index) => {
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
												{records.length} sessions • {batchStats.cleared} cleared • Avg rating: {batchStats.avgRating}/10
											</Typography>
										</Box>
										<Box sx={{ display: 'flex', gap: 3, mr: 2 }}>
											<Box>
												<Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>Cleared</Typography>
												<Typography variant="body2" sx={{ fontWeight: 700, color: 'success.main' }}>{batchStats.cleared}</Typography>
											</Box>
											<Box>
												<Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>Avg Rating</Typography>
												<Typography variant="body2" sx={{ fontWeight: 700, color: 'info.main' }}>{batchStats.avgRating}</Typography>
											</Box>
										</Box>
									</Box>
								</AccordionSummary>
								<AccordionDetails sx={{ p: 0 }}>
									<TableContainer>
										<Table size="small">
											<TableHead sx={{ bgcolor: alpha(theme.palette.background.default, 0.5) }}>
												<TableRow>
													<TableCell sx={{ fontWeight: 700, color: 'text.secondary', py: 1.5 }}>DATE</TableCell>
													<TableCell sx={{ fontWeight: 700, color: 'text.secondary', py: 1.5 }}>INTERVIEWER</TableCell>
													<TableCell sx={{ fontWeight: 700, color: 'text.secondary', py: 1.5 }}>STATUS</TableCell>
													<TableCell sx={{ fontWeight: 700, color: 'text.secondary', py: 1.5 }}>SCORE</TableCell>
													<TableCell sx={{ fontWeight: 700, color: 'text.secondary', py: 1.5 }}>FEEDBACK</TableCell>
												</TableRow>
											</TableHead>
											<TableBody>
												{records.map((row) => (
													<TableRow key={row.id} hover>
														<TableCell sx={{ color: 'text.primary', fontWeight: 500 }}>
															{formatDate(row.interview_date)}
														</TableCell>
														<TableCell sx={{ color: 'text.primary' }}>
															{row.interviewer_name || 'Unassigned'}
														</TableCell>
														<TableCell>{getStatusChip(row.status)}</TableCell>
														<TableCell sx={{ minWidth: 100 }}>
															{renderRating(row.overall_rating ?? undefined, row.status)}
														</TableCell>
														<TableCell sx={{ color: 'text.secondary', maxWidth: 300 }}>
															<Stack direction="row" alignItems="center" spacing={1}>
																<Typography variant="body2" noWrap>
																	{row.feedback || 'No feedback provided'}
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
				</>
			) : (
				<Box sx={{ textAlign: 'center', py: 8, bgcolor: alpha(theme.palette.background.default, 0.5), border: '1px dashed', borderColor: 'divider', borderRadius: '2px' }}>
					<InterviewIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
					<Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 600 }}>No Mock Interviews Recorded</Typography>
					<Typography variant="body2" color="text.secondary">
						Once the candidate begins their mock interview sessions, the feedback and ratings will be aggregated here.
					</Typography>
				</Box>
			)}
		</SectionCard>
	);
};

export default CandidateMockInterviewTab;
