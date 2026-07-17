import React, { useEffect, useState } from 'react';
import { Grid, useTheme } from '@mui/material';
import { Business, Group, CheckCircleOutline, HourglassEmpty } from '@mui/icons-material';
import orgAdminService from '../../../services/orgAdminService';
import StatCard from '../../common/stats/StatCard';
import type { AdminStats } from '../../../models/admin';

export const PlatformKPIPanel: React.FC = () => {
	const theme = useTheme();
	const [stats, setStats] = useState<AdminStats | null>(null);

	useEffect(() => {
		let cancelled = false;
		orgAdminService.getAdminStats()
			.then((data) => { if (!cancelled) setStats(data); })
			.catch(() => { if (!cancelled) setStats(null); });
		return () => { cancelled = true; };
	}, []);

	const kpis = [
		{
			title: 'Total Organizations',
			value: stats?.total_organizations ?? 0,
			subtitle: `${stats?.team_organizations ?? 0} team · ${stats?.individual_organizations ?? 0} individual`,
			icon: <Business sx={{ color: theme.palette.primary.main, fontSize: 22 }} />,
			color: theme.palette.primary.main,
		},
		{
			title: 'Platform Users',
			value: stats?.total_users ?? 0,
			subtitle: `Avg ${stats?.avg_users_per_org ?? 0} users per org`,
			icon: <Group sx={{ color: theme.palette.info.main, fontSize: 22 }} />,
			color: theme.palette.info.main,
		},
		{
			title: 'Paid Organizations',
			value: stats?.paid_organizations ?? 0,
			subtitle: `${stats?.paid_users ?? 0} total paid seats`,
			icon: <CheckCircleOutline sx={{ color: theme.palette.success.main, fontSize: 22 }} />,
			color: theme.palette.success.main,
		},
		{
			title: 'Active Trials',
			value: stats?.active_trials ?? 0,
			subtitle: `${stats?.expired_trials ?? 0} expired · ${stats?.inactive_organizations ?? 0} inactive`,
			icon: <HourglassEmpty sx={{ color: theme.palette.warning.main, fontSize: 22 }} />,
			color: theme.palette.warning.main,
		},
	];

	return (
		<Grid container spacing={2}>
			{kpis.map((kpi, idx) => (
				<Grid size={{ xs: 12, sm: 6, lg: 3 }} key={idx}>
					<StatCard {...kpi} />
				</Grid>
			))}
		</Grid>
	);
};

export default PlatformKPIPanel;
