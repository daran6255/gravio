import React, { useState, useEffect } from 'react';
import { Box, Skeleton, useTheme } from '@mui/material';
import {
	ListAlt as ActivityIcon,
	PendingActions as InProgressIcon,
	DoneAll as CompletedIcon,
	EventNote as PlannedIcon
} from '@mui/icons-material';
import StatCard from '../../../common/stats/StatCard';
import dsrActivityService from '../../../../services/dsrActivityService';
import { DSRActivityStatusValues } from '../../../../models/dsr';

interface ActivityStatsProps {
	projectId: string;
	refreshKey?: number;
}

/**
 * ActivityStats - Modernized with common StatCard integration
 * Features skeleton loading and descriptive metadata for project activities.
 */
const ActivityStats: React.FC<ActivityStatsProps> = ({ projectId, refreshKey = 0 }) => {
	const theme = useTheme();
	const [loading, setLoading] = useState(true);
	const [stats, setStats] = useState({
		total: 0,
		inProgress: 0,
		completed: 0,
		planned: 0
	});

	useEffect(() => {
		const fetchStats = async () => {
			if (!projectId) return;
			setLoading(true);
			try {
				const [totalRes, inProgressRes, completedRes, plannedRes] = await Promise.all([
					dsrActivityService.getActivities(0, 1, projectId),
					dsrActivityService.getActivities(0, 1, projectId, DSRActivityStatusValues.IN_PROGRESS),
					dsrActivityService.getActivities(0, 1, projectId, DSRActivityStatusValues.COMPLETED),
					dsrActivityService.getActivities(0, 1, projectId, DSRActivityStatusValues.PLANNED)
				]);

				setStats({
					total: totalRes.total,
					inProgress: inProgressRes.total,
					completed: completedRes.total,
					planned: plannedRes.total
				});
			} catch (error) {
				console.error('Failed to fetch activity stats', error);
			} finally {
				setLoading(false);
			}
		};
		fetchStats();
	}, [projectId, refreshKey]);

	const skeleton = <Skeleton variant="text" sx={{ fontSize: '2rem', width: '40%' }} />;

	return (
		<Box 
			sx={{ 
				display: 'grid', 
				gridTemplateColumns: {
					xs: '1fr',
					sm: '1fr 1fr',
					lg: '1fr 1fr 1fr 1fr'
				},
				gap: 3, 
				mb: 4 
			}}
		>
			<StatCard
				title="Total Activities"
				count={loading ? skeleton : stats.total}
				icon={ActivityIcon}
				color={theme.palette.secondary.main}
				subtitle="Total tracked actions"
			/>
			<StatCard
				title="Planned"
				count={loading ? skeleton : stats.planned}
				icon={PlannedIcon}
				color="#64748b" // slate-500
				subtitle="Yet to be started"
			/>
			<StatCard
				title="In Progress"
				count={loading ? skeleton : stats.inProgress}
				icon={InProgressIcon}
				color={theme.palette.primary.main}
				subtitle="Currently being worked on"
			/>
			<StatCard
				title="Completed"
				count={loading ? skeleton : stats.completed}
				icon={CompletedIcon}
				color={theme.palette.success.main}
				subtitle="Successfully finished"
			/>
		</Box>
	);
};

export default ActivityStats;
