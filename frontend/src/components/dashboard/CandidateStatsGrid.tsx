import React from 'react';
import Grid from '@mui/material/Grid';
import PeopleIcon from '@mui/icons-material/People';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SchoolIcon from '@mui/icons-material/School';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import StatCard from '../common/stats/StatCard';

interface CandidateStatsGridProps {
	stats: {
		total: number;
		in_training: number;
		moved_to_placement: number;
		got_job: number;
		[key: string]: any;
	};
}

const CandidateStatsGrid: React.FC<CandidateStatsGridProps> = ({ stats }) => {
	return (
		<Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: 4 }}>
			<Grid size={{ xs: 12, sm: 6, md: 3 }}>
				<StatCard
					title="Total Candidates"
					count={(stats.total || 0).toLocaleString()}
					subtitle="Total registered candidates"
					icon={<PeopleIcon />}
					color="#1976d2"
				/>
			</Grid>
			<Grid size={{ xs: 12, sm: 6, md: 3 }}>
				<StatCard
					title="In Training"
					count={(stats.in_training || 0).toLocaleString()}
					subtitle="Candidates currently in batches"
					icon={<SchoolIcon />}
					color="#ed6c02"
				/>
			</Grid>
			<Grid size={{ xs: 12, sm: 6, md: 3 }}>
				<StatCard
					title="Moved to Placement"
					count={(stats.moved_to_placement || 0).toLocaleString()}
					subtitle="Candidates in pipeline"
					icon={<TrendingUpIcon />}
					color="#2e7d32"
				/>
			</Grid>
			<Grid size={{ xs: 12, sm: 6, md: 3 }}>
				<StatCard
					title="Placed"
					count={(stats.got_job || 0).toLocaleString()}
					subtitle="Successfully placed"
					icon={<CheckCircleIcon />}
					color="#9c27b0"
				/>
			</Grid>
		</Grid>
	);
};

export default CandidateStatsGrid;
