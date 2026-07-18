import React, { useEffect, useState } from 'react';
import {
	Card, CardContent, Typography, Box, useTheme, Skeleton, alpha, Chip
} from '@mui/material';
import {
	DonutSmall, BusinessOutlined, PersonOutline,
	HourglassEmpty, CheckCircle, Block
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useAppDispatch } from '../../../store/hooks';
import { fetchAdminStats } from '../../../store/slices/orgAdminSlice';
import type { AdminStats } from '../../../models/admin';

interface DistributionRow {
	label: string;
	count: number;
	percentage: number;
	color: string;
	icon: React.ReactElement;
}

export const PlanDistributionPanel: React.FC = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const dispatch = useAppDispatch();
	const [stats, setStats] = useState<AdminStats | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;
		dispatch(fetchAdminStats()).unwrap()
			.then((data) => { if (!cancelled) setStats(data); })
			.catch(() => { if (!cancelled) setStats(null); })
			.finally(() => { if (!cancelled) setLoading(false); });
		return () => { cancelled = true; };
	}, [dispatch]);

	const total = stats?.total_organizations ?? 0;
	const pct = (n: number) => total > 0 ? Math.round((n / total) * 100) : 0;

	const rows: DistributionRow[] = stats ? [
		{
			label: 'Team Orgs',
			count: stats.team_organizations,
			percentage: pct(stats.team_organizations),
			color: theme.palette.info.main,
			icon: <BusinessOutlined sx={{ fontSize: 14 }} />
		},
		{
			label: 'Individual',
			count: stats.individual_organizations,
			percentage: pct(stats.individual_organizations),
			color: theme.palette.success.main,
			icon: <PersonOutline sx={{ fontSize: 14 }} />
		},
		{
			label: 'Paid',
			count: stats.paid_organizations,
			percentage: pct(stats.paid_organizations),
			color: theme.palette.primary.main,
			icon: <CheckCircle sx={{ fontSize: 14 }} />
		},
		{
			label: 'Trials Active',
			count: stats.active_trials,
			percentage: pct(stats.active_trials),
			color: theme.palette.warning.main,
			icon: <HourglassEmpty sx={{ fontSize: 14 }} />
		},
		{
			label: 'Trials Expired',
			count: stats.expired_trials,
			percentage: pct(stats.expired_trials),
			color: theme.palette.error.main,
			icon: <Block sx={{ fontSize: 14 }} />
		},
		{
			label: 'Inactive',
			count: stats.inactive_organizations,
			percentage: pct(stats.inactive_organizations),
			color: theme.palette.text.disabled as string,
			icon: <Block sx={{ fontSize: 14 }} />
		},
	] : [];

	const pieData = rows.slice(0, 4).filter(r => r.count > 0);

	const cardBg = theme.gradients.card;

	return (
		<Card sx={{
			borderRadius: '16px',
			border: `1px solid ${theme.palette.divider}`,
			boxShadow: isDark ? '0 8px 32px 0 rgba(0, 0, 0, 0.2)' : '0 8px 32px 0 rgba(139, 124, 246, 0.04)',
			height: '100%',
			background: cardBg,
			backdropFilter: 'blur(20px)',
		}}>
			<CardContent sx={{ p: 2.5 }}>
				<Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
					<Box display="flex" alignItems="center" gap={1.25}>
						<DonutSmall color="primary" sx={{ fontSize: 20 }} />
						<Typography variant="subtitle2" sx={{ fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '0.78rem', color: 'text.primary' }}>
							Tenant Distribution
						</Typography>
					</Box>
					<Chip label={`${total} total`} size="small" sx={{ fontWeight: 700, fontSize: '0.7rem', bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }} />
				</Box>

				{loading ? (
					<Skeleton variant="rounded" height={220} sx={{ borderRadius: 2 }} />
				) : !stats ? (
					<Typography variant="body2" color="text.secondary">Couldn't load distribution data.</Typography>
				) : (
					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
						{/* Donut chart */}
						<Box sx={{ height: 160, mb: 1.5 }}>
							<ResponsiveContainer width="100%" height="100%">
								<PieChart>
									<Pie
										data={pieData}
										dataKey="count"
										nameKey="label"
										innerRadius={48}
										outerRadius={70}
										paddingAngle={3}
										stroke="none"
									>
										{pieData.map((entry, i) => (
											<Cell key={i} fill={entry.color} />
										))}
									</Pie>
									<Tooltip
										contentStyle={{
											background: theme.palette.background.paper,
											border: `1px solid ${theme.palette.divider}`,
											borderRadius: 8,
											fontSize: 12
										}}
									/>
								</PieChart>
							</ResponsiveContainer>
						</Box>

						{/* Distribution rows */}
						<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
							{rows.map((row) => (
								<Box key={row.label}>
									<Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 0.6 }}>
										<Box display="flex" alignItems="center" gap={0.75}>
											<Box sx={{ color: row.color, display: 'flex' }}>{row.icon}</Box>
											<Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.78rem', color: 'text.primary' }}>
												{row.label}
											</Typography>
										</Box>
										<Box display="flex" alignItems="center" gap={1}>
											<Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.75rem' }}>
												{row.count}
											</Typography>
											<Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem', minWidth: 28, textAlign: 'right' }}>
												{row.percentage}%
											</Typography>
										</Box>
									</Box>
									<Box sx={{ height: 5, bgcolor: isDark ? alpha('#fff', 0.05) : alpha('#000', 0.04), borderRadius: 2, overflow: 'hidden' }}>
										<Box sx={{
											width: `${row.percentage}%`, height: '100%',
											bgcolor: row.color, borderRadius: 2,
											boxShadow: `0 0 6px ${alpha(row.color, 0.5)}`,
											transition: 'width 0.6s ease-in-out'
										}} />
									</Box>
								</Box>
							))}
						</Box>
					</Box>
				)}
			</CardContent>
		</Card>
	);
};

export default PlanDistributionPanel;
