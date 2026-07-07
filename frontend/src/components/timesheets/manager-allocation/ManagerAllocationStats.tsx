import React from 'react';
import { Grid, Box, useTheme } from '@mui/material';
import { Group as GroupIcon, Warning as WarningIcon, CheckCircle as SuccessIcon } from '@mui/icons-material';
import { StatCard } from '../../common/stats/StatCard';

interface ManagerAllocationStatsProps {
	totalTeammates: number;
	unassignedCount: number;
	eligibleManagersCount: number;
	filterUnassignedOnly: boolean;
	onToggleUnassignedFilter: () => void;
}

export const ManagerAllocationStats: React.FC<ManagerAllocationStatsProps> = ({
	totalTeammates,
	unassignedCount,
	eligibleManagersCount,
	filterUnassignedOnly,
	onToggleUnassignedFilter
}) => {
	const theme = useTheme();

	return (
		<Grid container spacing={3}>
			<Grid size={{ xs: 12, sm: 4 }}>
				<StatCard
					title="TOTAL TEAMMATES"
					value={totalTeammates}
					icon={<GroupIcon sx={{ fontSize: 24 }} />}
					color={theme.palette.primary.main}
					tooltip="Total active members registered in your organization"
				/>
			</Grid>

			<Grid size={{ xs: 12, sm: 4 }}>
				<Box 
					onClick={onToggleUnassignedFilter} 
					sx={{ 
						cursor: 'pointer',
						height: '100%',
						'& > div': filterUnassignedOnly ? {
							borderColor: 'warning.main',
							boxShadow: theme.palette.mode === 'dark'
								? `0 12px 40px 0 rgba(0,0, 0, 0.55), 0 0 20px 2px rgba(243, 156, 18, 0.35)`
								: `0 12px 40px 0 rgba(243, 156, 18, 0.15), 0 0 20px 0 rgba(243, 156, 18, 0.08)`
						} : {}
					}}
				>
					<StatCard
						title="UNASSIGNED TEAMMATES"
						value={unassignedCount}
						subtitle={filterUnassignedOnly ? "Click to show all" : "Click to filter"}
						icon={<WarningIcon sx={{ fontSize: 24 }} />}
						color={theme.palette.warning.main}
						tooltip="Teammates without an assigned reporting manager (submissions disabled)"
					/>
				</Box>
			</Grid>

			<Grid size={{ xs: 12, sm: 4 }}>
				<StatCard
					title="ELIGIBLE MANAGERS"
					value={eligibleManagersCount}
					icon={<SuccessIcon sx={{ fontSize: 24 }} />}
					color={theme.palette.success.main}
					tooltip="Active Admins and Managers eligible to act as reporting managers"
				/>
			</Grid>
		</Grid>
	);
};

export default ManagerAllocationStats;
