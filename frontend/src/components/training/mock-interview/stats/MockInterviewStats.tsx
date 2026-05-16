import React from 'react';
import { Grid, useTheme } from '@mui/material';
import {
	AssignmentOutlined as TotalIcon,
	CheckCircleOutline as ClearedIcon,
	PeopleOutline as CandidateIcon,
	EventBusy as AbsentIcon,
	StarOutline as RatingIcon
} from '@mui/icons-material';
import StatCard from '../../../common/stats/StatCard';

interface MockInterviewStatsProps {
	stats: {
		total: number;
		cleared: number;
		uniqueCandidates: number;
		absent: number;
		avgRating: number | string;
	};
}

const MockInterviewStats: React.FC<MockInterviewStatsProps> = ({ stats }) => {
	const theme = useTheme();

	return (
		<Grid container spacing={3} sx={{ mb: 4 }}>
			<Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
				<StatCard
					title="Total Sessions"
					value={stats.total}
					icon={TotalIcon}
					color={theme.palette.primary.main}
				/>
			</Grid>
			<Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
				<StatCard
					title="Cleared"
					value={stats.cleared}
					icon={ClearedIcon}
					color={theme.palette.success.main}
					subtitle={`${((stats.cleared / (stats.total || 1)) * 100).toFixed(0)}% success rate`}
				/>
			</Grid>
			<Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
				<StatCard
					title="Candidates"
					value={stats.uniqueCandidates}
					icon={CandidateIcon}
					color={theme.palette.info.main}
				/>
			</Grid>
			<Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
				<StatCard
					title="Absent"
					value={stats.absent}
					icon={AbsentIcon}
					color={theme.palette.error.main}
					subtitle={`${((stats.absent / (stats.total || 1)) * 100).toFixed(0)}% absence rate`}
				/>
			</Grid>
			<Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
				<StatCard
					title="Avg Rating"
					value={stats.avgRating}
					unit="/ 10"
					icon={RatingIcon}
					color={theme.palette.warning.main}
				/>
			</Grid>
		</Grid>
	);
};

export default MockInterviewStats;
