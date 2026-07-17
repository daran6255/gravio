import React from 'react';
import { Grid, useTheme } from '@mui/material';
import { Business, CalendarToday, Group, Speed } from '@mui/icons-material';
import type { AdminStats } from '../../../../models/admin';
import StatCard from '../../../common/stats/StatCard';

interface OrgStatsPanelProps {
	stats: AdminStats | null;
}

export const OrgStatsPanel: React.FC<OrgStatsPanelProps> = ({ stats }) => {
	const theme = useTheme();
	const statsCards = [
		{
			title: 'TOTAL ORGANIZATIONS',
			value: stats?.total_organizations ?? 0,
			subtitle: 'Total registered tenants',
			icon: <Business sx={{ color: theme.palette.primary.main, fontSize: 26 }} />,
			color: theme.palette.primary.main
		},
		{
			title: 'ACTIVE TRIALS',
			value: stats?.active_trials ?? 0,
			subtitle: 'Free / Trial orgs with time left',
			icon: <CalendarToday sx={{ color: theme.palette.warning.main, fontSize: 24 }} />,
			color: theme.palette.warning.main
		},
		{
			title: 'PLATFORM SEATS',
			value: stats?.total_users ?? 0,
			subtitle: 'Total user accounts',
			icon: <Group sx={{ color: theme.palette.success.main, fontSize: 26 }} />,
			color: theme.palette.success.main
		},
		{
			title: 'AVG. SEAT DENSITY',
			value: stats?.avg_users_per_org ?? 0,
			subtitle: 'Average users per tenant',
			icon: <Speed sx={{ color: theme.palette.info.main, fontSize: 26 }} />,
			color: theme.palette.info.main
		}
	];

	return (
		<Grid container spacing={3} sx={{ mb: 4, position: 'relative', zIndex: 1 }}>
			{statsCards.map((card, idx) => (
				<Grid size={{ xs: 12, sm: 6, md: 3 }} key={idx}>
					<StatCard {...card} />
				</Grid>
			))}
		</Grid>
	);
};

export default OrgStatsPanel;
