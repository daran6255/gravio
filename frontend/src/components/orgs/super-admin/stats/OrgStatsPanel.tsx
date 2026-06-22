import React from 'react';
import { Grid } from '@mui/material';
import { Business, CalendarToday, Group, Speed } from '@mui/icons-material';
import type { AdminStats } from '../../../../models/admin';
import StatCard from '../../../common/stats/StatCard';

interface OrgStatsPanelProps {
	stats: AdminStats | null;
}

export const OrgStatsPanel: React.FC<OrgStatsPanelProps> = ({ stats }) => {
	const statsCards = [
		{
			title: 'TOTAL ORGANIZATIONS',
			value: stats?.total_organizations ?? 0,
			subtitle: 'Total registered tenants',
			icon: <Business sx={{ color: '#8B7CF6', fontSize: 26 }} />,
			color: '#8B7CF6'
		},
		{
			title: 'ACTIVE TRIALS',
			value: stats?.active_trials ?? 0,
			subtitle: 'Free / Trial orgs with time left',
			icon: <CalendarToday sx={{ color: '#F59E0B', fontSize: 24 }} />,
			color: '#F59E0B'
		},
		{
			title: 'PLATFORM SEATS',
			value: stats?.total_users ?? 0,
			subtitle: 'Total user accounts',
			icon: <Group sx={{ color: '#10B981', fontSize: 26 }} />,
			color: '#10B981'
		},
		{
			title: 'AVG. SEAT DENSITY',
			value: stats?.avg_users_per_org ?? 0,
			subtitle: 'Average users per tenant',
			icon: <Speed sx={{ color: '#4EA8FF', fontSize: 26 }} />,
			color: '#4EA8FF'
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
