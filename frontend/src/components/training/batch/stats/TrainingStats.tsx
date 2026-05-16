import React, { useEffect, memo } from 'react';
import { Box, Typography, Divider, Grid, Stack, useTheme } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { fetchTrainingStats } from '../../../../store/slices/trainingSlice';
import StatCard from '../../../common/stats/StatCard';
import {
	BatchPrediction,
	Group,
	PersonAdd,
	CheckCircleOutline,
	TrendingUp,
	CancelOutlined
} from '@mui/icons-material';

const StatItem = ({ label, value, color, icon, align = 'center' }: { label: string, value: number | string, color: string, icon?: React.ReactNode, align?: 'center' | 'left' }) => (
	<Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: align === 'center' ? 'center' : 'flex-start', gap: icon ? 1 : 0 }}>
		{icon && React.cloneElement(icon as React.ReactElement<any>, { sx: { fontSize: 16, color } })}
		<Box sx={{ textAlign: align }}>
			<Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', mb: align === 'center' ? 0.2 : 0 }}>
				{label}
			</Typography>
			<Typography variant="body2" sx={{ color: color, fontWeight: 700, fontSize: '0.9rem' }}>
				{value}
			</Typography>
		</Box>
	</Box>
);

interface TrainingStatsProps {
	refreshKey?: number;
}

const TrainingStats: React.FC<TrainingStatsProps> = memo(({ refreshKey }) => {
	const theme = useTheme();
	const dispatch = useAppDispatch();
	const { stats } = useAppSelector((state) => state.training);

	useEffect(() => {
		dispatch(fetchTrainingStats());
	}, [dispatch, refreshKey]);

	if (!stats) return null;

	return (
		<Grid container spacing={3} sx={{ mb: 4 }}>
			{/* Card 1: Batch Overview */}
			<Grid size={{ xs: 12, md: 6, lg: 3 }}>
				<StatCard
					title="Batches Overview"
					value={stats.total ?? 0}
					icon={<BatchPrediction fontSize="small" />}
					color={theme.palette.primary.main}
					sx={{ minHeight: 140 }}
				>
					<Divider sx={{ my: 1.5, opacity: 0.4 }} />
					<Stack direction="row" spacing={1} divider={<Divider orientation="vertical" flexItem sx={{ height: 16, my: 'auto' }} />}>
						<StatItem label="Running" value={stats.running ?? 0} color={theme.palette.success.main} />
						<StatItem label="Planned" value={stats.planned ?? 0} color={theme.palette.warning.main} />
						<StatItem label="Closed" value={stats.completed ?? 0} color={theme.palette.text.disabled} />
					</Stack>
				</StatCard>
			</Grid>

			{/* Card 2: Candidates Pipeline */}
			<Grid size={{ xs: 12, md: 6, lg: 4 }}>
				<StatCard
					title="Total Selected Candidates"
					value={stats.total_selected ?? 0}
					icon={<Group fontSize="small" />}
					color={theme.palette.success.dark}
					sx={{ minHeight: 140 }}
				>
					<Divider sx={{ my: 1.5, opacity: 0.4 }} />
					<Stack direction="row" spacing={1} divider={<Divider orientation="vertical" flexItem sx={{ height: 16, my: 'auto' }} />}>
						<StatItem 
							label="In Training" 
							value={stats.in_training ?? 0} 
							color={theme.palette.primary.main} 
							icon={<TrendingUp />} 
							align="left"
						/>
						<StatItem 
							label="Ready" 
							value={stats.ready_for_training ?? 0} 
							color={theme.palette.warning.main} 
							icon={<PersonAdd />} 
							align="left"
						/>
					</Stack>
				</StatCard>
			</Grid>

			{/* Card 3: Training Outcomes */}
			<Grid size={{ xs: 12, md: 12, lg: 5 }}>
				<StatCard
					title="Training Outcomes"
					value={stats.completed_training ?? 0}
					icon={<CheckCircleOutline fontSize="small" />}
					color={theme.palette.secondary.main}
					sx={{ minHeight: 140 }}
				>
					<Divider sx={{ my: 1.5, opacity: 0.4 }} />
					<Stack direction="row" spacing={1} divider={<Divider orientation="vertical" flexItem sx={{ height: 16, my: 'auto' }} />}>
						<StatItem label="Completed" value={stats.completed_candidates ?? 0} color={theme.palette.success.main} />
						<StatItem label="Placement" value={stats.moved_to_placement ?? 0} color={theme.palette.info.main} />
						<StatItem 
							label="Dropped" 
							value={stats.dropped_out ?? 0} 
							color={theme.palette.error.main} 
							icon={<CancelOutlined />} 
							align="left"
						/>
					</Stack>
				</StatCard>
			</Grid>
		</Grid>
	);
});

TrainingStats.displayName = 'TrainingStats';

export default TrainingStats;
