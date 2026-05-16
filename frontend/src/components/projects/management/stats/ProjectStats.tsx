import React, { useEffect } from 'react';
import { Grid, useTheme } from '@mui/material';
import {
	Assignment as ProjectIcon,
	CheckCircle as ActiveIcon,
	ListAlt as ActivityIcon,
	DoneAll as CompletedIcon
} from '@mui/icons-material';
import StatCard from '../../../common/stats/StatCard';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { fetchProjectManagementStats } from '../../../../store/slices/dsrSlice';

interface ProjectStatsProps {
	refreshKey?: number;
}

const ProjectStats: React.FC<ProjectStatsProps> = ({ refreshKey = 0 }) => {
	const theme = useTheme();
	const dispatch = useAppDispatch();
	const { projectManagementStats: stats } = useAppSelector((state) => state.dsr);

	useEffect(() => {
		dispatch(fetchProjectManagementStats());
	}, [refreshKey, dispatch]);

	const displayStats = stats || {
		totalProjects: 0,
		activeProjects: 0,
		totalActivities: 0,
		completedActivities: 0
	};

	return (
		<Grid container spacing={3} sx={{ mb: 4 }}>
			<Grid size={{ xs: 12, sm: 6, md: 3 }}>
				<StatCard
					title="Total Projects"
					value={displayStats.totalProjects}
					icon={ProjectIcon}
					color={theme.palette.primary.main}
					subtitle="Across all domains"
				/>
			</Grid>
			<Grid size={{ xs: 12, sm: 6, md: 3 }}>
				<StatCard
					title="Active Projects"
					value={displayStats.activeProjects}
					icon={ActiveIcon}
					color={theme.palette.success.main}
					subtitle="Operational entities"
				/>
			</Grid>
			<Grid size={{ xs: 12, sm: 6, md: 3 }}>
				<StatCard
					title="Total Activities"
					value={displayStats.totalActivities}
					icon={ActivityIcon}
					color={theme.palette.secondary.main}
					subtitle="Logged task executions"
				/>
			</Grid>
			<Grid size={{ xs: 12, sm: 6, md: 3 }}>
				<StatCard
					title="Completed"
					value={displayStats.completedActivities}
					icon={CompletedIcon}
					color={theme.palette.warning.main}
					subtitle="Verified outcomes"
				/>
			</Grid>
		</Grid>
	);
};

export default ProjectStats;
