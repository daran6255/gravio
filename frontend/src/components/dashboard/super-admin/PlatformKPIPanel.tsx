import React, { useEffect, useState } from 'react';
import { Grid, Card, CardContent, Typography, Box, useTheme, Skeleton, alpha } from '@mui/material';
import { Business, Group, CheckCircleOutline, HourglassEmpty, TrendingUp } from '@mui/icons-material';
import orgAdminService from '../../../services/orgAdminService';
import type { AdminStats } from '../../../models/admin';

interface KPICardProps {
	title: string;
	value: number | string;
	subtitle: string;
	icon: React.ReactElement;
	color: string;
	loading?: boolean;
}

const KPICard: React.FC<KPICardProps> = ({ title, value, subtitle, icon, color, loading }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';

	if (loading) {
		return (
			<Card sx={{ borderRadius: 2, border: `1px solid ${theme.palette.divider}`, boxShadow: 'none', height: '100%' }}>
				<CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
					<Skeleton variant="rounded" height={82} />
				</CardContent>
			</Card>
		);
	}

	return (
		<Card sx={{
			borderRadius: 2,
			border: `1px solid ${theme.palette.divider}`,
			boxShadow: 'none',
			height: '100%',
			overflow: 'hidden',
			position: 'relative',
			transition: 'all 0.25s ease',
			'&:hover': { transform: 'translateY(-2px)', boxShadow: `0 6px 16px ${alpha(color, 0.1)}` }
		}}>
			<Box sx={{ height: 3, background: `linear-gradient(90deg, ${color}, ${alpha(color, 0.3)})` }} />
			<CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
				<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.25 }}>
					<Box sx={{
						width: 36, height: 36, borderRadius: 1.5,
						display: 'flex', alignItems: 'center', justifyContent: 'center',
						bgcolor: alpha(color, isDark ? 0.15 : 0.1),
						color
					}}>
						{icon}
					</Box>
					<TrendingUp sx={{ fontSize: 13, color: 'success.main', opacity: 0.7 }} />
				</Box>
				<Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1, mb: 0.4 }}>
					{value}
				</Typography>
				<Typography variant="caption" sx={{
					fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
					color: alpha(color, 0.85), fontSize: '0.62rem', display: 'block', mb: 0.3
				}}>
					{title}
				</Typography>
				<Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>
					{subtitle}
				</Typography>
			</CardContent>
		</Card>
	);
};

export const PlatformKPIPanel: React.FC = () => {
	const theme = useTheme();
	const [stats, setStats] = useState<AdminStats | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;
		orgAdminService.getAdminStats()
			.then((data) => { if (!cancelled) setStats(data); })
			.catch(() => { if (!cancelled) setStats(null); })
			.finally(() => { if (!cancelled) setLoading(false); });
		return () => { cancelled = true; };
	}, []);

	const kpis = [
		{
			title: 'Total Organizations',
			value: stats?.total_organizations ?? 0,
			subtitle: `${stats?.team_organizations ?? 0} team · ${stats?.individual_organizations ?? 0} individual`,
			icon: <Business sx={{ fontSize: 22 }} />,
			color: theme.palette.primary.main,
		},
		{
			title: 'Platform Users',
			value: stats?.total_users ?? 0,
			subtitle: `Avg ${stats?.avg_users_per_org ?? 0} users per org`,
			icon: <Group sx={{ fontSize: 22 }} />,
			color: theme.palette.info.main,
		},
		{
			title: 'Paid Organizations',
			value: stats?.paid_organizations ?? 0,
			subtitle: `${stats?.paid_users ?? 0} total paid seats`,
			icon: <CheckCircleOutline sx={{ fontSize: 22 }} />,
			color: theme.palette.success.main,
		},
		{
			title: 'Active Trials',
			value: stats?.active_trials ?? 0,
			subtitle: `${stats?.expired_trials ?? 0} expired · ${stats?.inactive_organizations ?? 0} inactive`,
			icon: <HourglassEmpty sx={{ fontSize: 22 }} />,
			color: theme.palette.warning.main,
		},
	];

	return (
		<Grid container spacing={2}>
			{kpis.map((kpi, idx) => (
				<Grid size={{ xs: 12, sm: 6, lg: 3 }} key={idx}>
					<KPICard {...kpi} loading={loading} />
				</Grid>
			))}
		</Grid>
	);
};

export default PlatformKPIPanel;
