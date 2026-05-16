import React from 'react';
import {
	Grid,
	Box,
	Typography,
	Divider,
	useTheme
} from '@mui/material';
import {
	MenuBook as CourseIcon,
	Person as HRIcon,
	Assignment as InterviewIcon
} from '@mui/icons-material';

import StatsSummaryCards from './StatsSummaryCards';
import DistributionMetricTable from './DistributionMetricTable';
import TrainerContributions from './TrainerContributions';
import AdditionalSessions from './AdditionalSessions';

interface WeeklyPlanStatsProps {
	hoursBreakdown: {
		course: number;
		hr_session: number;
		mock_interview: number;
		training_total: number;
		unassigned_total: number;
		details: {
			course: Record<string, number>;
			hr_session: Record<string, number>;
			mock_interview: Record<string, number>;
			trainer: Record<string, { total: number; sessions: Record<string, { hours: number; type: string }> }>;
			unassigned: Record<string, { hours: number; type: string }>;
		};
	};
}

const WeeklyPlanStats: React.FC<WeeklyPlanStatsProps> = ({ hoursBreakdown }) => {
	const theme = useTheme();

	const formatHours = (hours: number) => {
		const h = Math.floor(hours);
		const m = Math.round((hours - h) * 60);
		if (h === 0) return `${m}m`;
		if (m === 0) return `${h}h`;
		return `${h}h ${m}m`;
	};

	return (
		<Box sx={{ py: 1 }}>
			<Box sx={{ mb: 4 }}>
				<Typography variant="h5" color="secondary.light" sx={{ fontWeight: 700, mb: 1 }}>
					Training Performance Analytics
				</Typography>
				<Typography variant="body1" color="text.secondary" sx={{ maxWidth: '800px' }}>
					Deep-dive into resource allocation, curriculum coverage, and trainer productivity metrics for this batch's training lifecycle.
				</Typography>
			</Box>

			<StatsSummaryCards 
				hoursBreakdown={hoursBreakdown} 
				formatHours={formatHours} 
			/>

			<Divider sx={{ mb: 5 }} />

			<Typography variant="h6" sx={{ fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
				<Box sx={{ width: 4, height: 24, bgcolor: 'primary.main', borderRadius: 1 }} />
				Detailed Hours Breakdown
			</Typography>

			<Grid container spacing={3}>
				<Grid size={{ xs: 12, md: 4 }}>
					<DistributionMetricTable 
						title="Course Distribution"
						data={hoursBreakdown.details.course}
						icon={<CourseIcon />}
						color={theme.palette.primary.main}
						formatHours={formatHours}
					/>
				</Grid>
				<Grid size={{ xs: 12, md: 4 }}>
					<DistributionMetricTable 
						title="HR Activity Volume"
						data={hoursBreakdown.details.hr_session}
						icon={<HRIcon />}
						color={(theme.palette as any).accent?.main || theme.palette.warning.main}
						formatHours={formatHours}
					/>
				</Grid>
				<Grid size={{ xs: 12, md: 4 }}>
					<DistributionMetricTable 
						title="Mock Interviews"
						data={hoursBreakdown.details.mock_interview}
						icon={<InterviewIcon />}
						color={theme.palette.success.main}
						formatHours={formatHours}
					/>
				</Grid>

				<Grid size={{ xs: 12, md: Object.entries(hoursBreakdown.details.unassigned).length > 0 ? 6 : 12 }}>
					<TrainerContributions 
						trainerData={hoursBreakdown.details.trainer}
						formatHours={formatHours}
					/>
				</Grid>

				{Object.entries(hoursBreakdown.details.unassigned).length > 0 && (
					<Grid size={{ xs: 12, md: 6 }}>
						<AdditionalSessions 
							unassignedData={hoursBreakdown.details.unassigned}
							formatHours={formatHours}
						/>
					</Grid>
				)}
			</Grid>
		</Box>
	);
};

export default WeeklyPlanStats;
