import React, { useState, useEffect } from 'react';
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
	Button,
	Stack,
	useTheme,
	alpha,
	Avatar,
	Grid
} from '@mui/material';
import {
	School as SchoolIcon,
	AssignmentInd as AllocationIcon,
	CheckCircle as ActiveIcon,
	FactCheck as CompletedIcon,
	Group as BatchIcon,
	Layers as CategoryIcon,
	History as DurationIcon,
	Comment as RemarkIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useDateTime } from '../../../../hooks/useDateTime';
import { SectionHeader, SectionCard } from '../DetailedViewCommon';
import StatCard from '../../../common/stats/StatCard';
import trainingExtensionService from '../../../../services/trainingExtensionService';
import type { Candidate } from '../../../../models/candidate';
import type { CandidateAllocation } from '../../../../models/training';

interface TrainingAllocationTabProps {
	candidate: Candidate;
}

const TrainingAllocationTab: React.FC<TrainingAllocationTabProps> = ({ candidate }) => {
	const navigate = useNavigate();
	const theme = useTheme();
	const { formatDate } = useDateTime();
	const [allocations, setAllocations] = useState<CandidateAllocation[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const loadData = async () => {
			if (!candidate.public_id) return;
			try {
				const data = await trainingExtensionService.getCandidateAllocations(candidate.public_id);
				setAllocations(data);
			} catch (error) {
				console.error('Failed to fetch allocations:', error);
			} finally {
				setLoading(false);
			}
		};
		loadData();
	}, [candidate.public_id]);

	const getStatusChip = (allocation: CandidateAllocation) => {
		if (allocation.is_dropout) {
			return (
				<Chip 
					label="DROPOUT" 
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
		const batchStatus = allocation.batch?.status;
		if (batchStatus === 'running' || batchStatus === 'planned') {
			return (
				<Chip 
					label="ACTIVE" 
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
		return (
			<Chip 
				label="COMPLETED" 
				size="small" 
				sx={{ 
					bgcolor: alpha(theme.palette.info.main, 0.1), 
					color: 'info.main', 
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

	if (allocations.length === 0) {
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
						<SchoolIcon sx={{ fontSize: 50 }} />
					</Avatar>
					<Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5 }}>No Training Allocations</Typography>
					<Typography variant="body2" color="text.secondary" sx={{ mb: 4, lineHeight: 1.6 }}>
						This candidate has not been assigned to any training modules yet. 
						Allocating them to a batch will enable attendance tracking and performance monitoring.
					</Typography>
					<Button
						variant="contained"
						size="large"
						startIcon={<AllocationIcon />}
						sx={{ 
							borderRadius: 2, 
							px: 4, 
							py: 1.5,
							fontWeight: 700,
							boxShadow: theme.shadows[4]
						}}
						onClick={() => navigate('/training/allocation')}
					>
						Allocate to Batch
					</Button>
				</Box>
			</SectionCard>
		);
	}

	const activeCount = allocations.filter(a => !a.is_dropout && (a.batch?.status === 'running' || a.batch?.status === 'planned')).length;
	const completedCount = allocations.filter(a => !a.is_dropout && a.batch?.status === 'closed').length;

	return (
		<Stack spacing={4}>
			{/* Summary KPI Cards */}
			<Grid container spacing={3}>
				<Grid size={{ xs: 12, md: 4 }}>
					<StatCard 
						title="Total Batches" 
						value={allocations.length} 
						icon={<BatchIcon />} 
						color={theme.palette.primary.main} 
						subtitle="Lifetime training enrollment"
					/>
				</Grid>
				<Grid size={{ xs: 12, md: 4 }}>
					<StatCard 
						title="Active Tracks" 
						value={activeCount} 
						icon={<ActiveIcon />} 
						color={theme.palette.success.main} 
						subtitle="Currently ongoing training"
					/>
				</Grid>
				<Grid size={{ xs: 12, md: 4 }}>
					<StatCard 
						title="Completed" 
						value={completedCount} 
						icon={<CompletedIcon />} 
						color={theme.palette.info.main} 
						subtitle="Successfully finished courses"
					/>
				</Grid>
			</Grid>

			<SectionCard>
				<SectionHeader title="Detailed Allocation History" icon={<AllocationIcon />} />
				
				<TableContainer component={Box} sx={{ mt: 2 }}>
					<Table sx={{ minWidth: 650 }}>
						<TableHead>
							<TableRow>
								<TableCell sx={{ fontWeight: 800, color: 'text.secondary', py: 2 }}>BATCH & DISABILITY TYPE</TableCell>
								<TableCell sx={{ fontWeight: 800, color: 'text.secondary', py: 2 }}>TIMELINE</TableCell>
								<TableCell sx={{ fontWeight: 800, color: 'text.secondary', py: 2 }}>STATUS</TableCell>
								<TableCell sx={{ fontWeight: 800, color: 'text.secondary', py: 2 }}>SESSION REMARKS</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{allocations.map((allocation) => (
								<TableRow 
									key={allocation.id} 
									sx={{ 
										'&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.02) },
										transition: 'background-color 0.2s'
									}}
								>
									<TableCell>
										<Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
											<Typography 
												variant="subtitle2" 
												sx={{ 
													fontWeight: 700, 
													color: 'primary.main', 
													cursor: 'pointer',
													'&:hover': { textDecoration: 'underline' }
												}}
												onClick={() => navigate(`/training/batches/${allocation.batch?.public_id}`)}
											>
												{allocation.batch?.batch_name}
											</Typography>
											<Stack direction="row" spacing={1} alignItems="center">
												<CategoryIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
												<Typography variant="caption" color="text.secondary">
													{allocation.batch?.disability_types?.join(', ') || 'General'}
												</Typography>
											</Stack>
										</Box>
									</TableCell>
									<TableCell>
										<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
											<DurationIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
											<Typography variant="body2" sx={{ fontWeight: 500 }}>
												{allocation.batch?.start_date ? formatDate(allocation.batch.start_date) : '-'}
												<Box component="span" sx={{ mx: 0.5, color: 'text.disabled' }}>→</Box>
												{allocation.batch?.approx_close_date ? formatDate(allocation.batch.approx_close_date) : 'Present'}
											</Typography>
										</Box>
									</TableCell>
									<TableCell>
										{getStatusChip(allocation)}
									</TableCell>
									<TableCell>
										<Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
											<RemarkIcon sx={{ fontSize: 16, color: 'text.disabled', mt: 0.3 }} />
											<Typography 
												variant="body2" 
												sx={{ 
													color: allocation.dropout_remark ? 'text.primary' : 'text.disabled',
													fontStyle: allocation.dropout_remark ? 'normal' : 'italic',
													maxWidth: 250,
													lineHeight: 1.4
												}}
											>
												{allocation.dropout_remark || 'No session notes provided'}
											</Typography>
										</Box>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</TableContainer>

				<Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
					<Button
						variant="outlined"
						sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
						onClick={() => navigate('/training/batches')}
					>
						Browse All Batches
					</Button>
					<Button
						variant="contained"
						sx={{ 
							borderRadius: 2, 
							textTransform: 'none', 
							fontWeight: 700,
							bgcolor: alpha(theme.palette.primary.main, 0.9),
							'&:hover': { bgcolor: theme.palette.primary.main }
						}}
						onClick={() => navigate('/training/allocation')}
					>
						Manage Allocations
					</Button>
				</Box>
			</SectionCard>
		</Stack>
	);
};

export default TrainingAllocationTab;
