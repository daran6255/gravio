import React from 'react';
import { Grid, useTheme } from '@mui/material';
import { useAppSelector } from '../../../../store/hooks';
import {
	Work as JobIcon,
	Visibility as VisibilityIcon,
	Groups as VacancyIcon,
	CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import StatCard from '../../../common/stats/StatCard';
import { JOB_ROLE_STATUS } from '../../../../models/jobRole';

interface JobRoleStatsProps {
	list: any[];
	total: number;
}

const JobRoleStats: React.FC<JobRoleStatsProps> = ({ list, total }) => {
	const theme = useTheme();
	const { stats } = useAppSelector((state) => state.candidates);

	return (
		<Grid container spacing={3} sx={{ mb: 4 }}>
			<Grid size={{ xs: 12, sm: 6, md: 3 }}>
				<StatCard
					title="Total Job Roles"
					value={total}
					subtitle="Overall positions created"
					icon={<JobIcon />}
					color={theme.palette.primary.main}
				/>
			</Grid>
			<Grid size={{ xs: 12, sm: 6, md: 3 }}>
				<StatCard
					title="Active Openings"
					value={list.filter(j => {
						const isExpired = j.close_date && new Date(j.close_date) < new Date(new Date().setHours(0, 0, 0, 0));
						return j.status === JOB_ROLE_STATUS.ACTIVE && !isExpired;
					}).length}
					subtitle="Accepting applications"
					icon={<VisibilityIcon />}
					color={theme.palette.success.main}
				/>
			</Grid>
			<Grid size={{ xs: 12, sm: 6, md: 3 }}>
				<StatCard
					title="Total Vacancies"
					value={list.reduce((acc, j) => acc + (j.no_of_vacancies || 0), 0)}
					subtitle="Across all active roles"
					icon={<VacancyIcon />}
					color={theme.palette.warning.main}
				/>
			</Grid>
			<Grid size={{ xs: 12, sm: 6, md: 3 }}>
				<StatCard
					title="Placed Candidates"
					value={(stats?.got_job || 0).toLocaleString()}
					subtitle="Successfully placed"
					icon={<CheckCircleIcon />}
					color={theme.palette.secondary.main}
				/>
			</Grid>
		</Grid>
	);
};

export default JobRoleStats;
