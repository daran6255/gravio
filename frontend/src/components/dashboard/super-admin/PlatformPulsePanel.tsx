import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Box, useTheme, Grid, Skeleton, alpha } from '@mui/material';
import { Insights, Business, PersonOutline, CheckCircleOutline, HourglassEmpty } from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import orgAdminService from '../../../services/orgAdminService';
import type { AdminStats } from '../../../models/admin';

const miniStat = (icon: React.ReactElement, label: string, value: number | string, color: string) => (
	<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
		<Box
			sx={{
				width: 40, height: 40, borderRadius: '10px',
				display: 'flex', alignItems: 'center', justifyContent: 'center',
				bgcolor: alpha(color, 0.12), color,
			}}
		>
			{icon}
		</Box>
		<Box>
			<Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.1 }}>{value}</Typography>
			<Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>{label}</Typography>
		</Box>
	</Box>
);

export const PlatformPulsePanel: React.FC = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
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

	const pieData = stats ? [
		{ name: 'Team Orgs', value: stats.team_organizations, color: theme.palette.info.main },
		{ name: 'Individual', value: stats.individual_organizations, color: theme.palette.success.main },
	] : [];

	return (
		<Card
			sx={{
				borderRadius: '16px',
				height: '100%',
				background: isDark
					? 'linear-gradient(135deg, rgba(20, 24, 34, 0.75) 0%, rgba(11, 13, 18, 0.9) 100%)'
					: 'linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(248, 250, 252, 0.95) 100%)',
				backdropFilter: 'blur(20px)',
				border: `1px solid ${theme.palette.divider}`,
				boxShadow: isDark ? '0 8px 32px 0 rgba(0, 0, 0, 0.2)' : '0 8px 32px 0 rgba(139, 124, 246, 0.04)',
			}}
		>
			<CardContent sx={{ p: 4 }}>
				<Box display="flex" alignItems="center" gap={1.5} sx={{ mb: 2 }}>
					<Insights color="primary" sx={{ fontSize: 24 }} />
					<Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '0.02em', color: 'text.primary' }}>
						PLATFORM PULSE
					</Typography>
				</Box>

				{loading ? (
					<Skeleton variant="rounded" height={220} sx={{ borderRadius: '12px' }} />
				) : !stats ? (
					<Typography variant="body2" color="text.secondary">Couldn't load platform stats.</Typography>
				) : (
					<Grid container spacing={3} alignItems="center">
						<Grid size={{ xs: 12, md: 5 }}>
							<Box sx={{ position: 'relative', height: 180 }}>
								<ResponsiveContainer width="100%" height="100%">
									<PieChart>
										<Pie
											data={pieData}
											dataKey="value"
											nameKey="name"
											innerRadius={55}
											outerRadius={80}
											paddingAngle={3}
											stroke="none"
										>
											{pieData.map((entry) => (
												<Cell key={entry.name} fill={entry.color} />
											))}
										</Pie>
										<Tooltip
											contentStyle={{
												background: isDark ? '#141822' : '#ffffff',
												border: `1px solid ${theme.palette.divider}`,
												borderRadius: 8,
												fontSize: 12,
											}}
										/>
									</PieChart>
								</ResponsiveContainer>
								<Box sx={{
									position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
									textAlign: 'center', pointerEvents: 'none',
								}}>
									<Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary' }}>
										{stats.total_organizations}
									</Typography>
									<Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
										ORGS
									</Typography>
								</Box>
							</Box>
							<Box display="flex" justifyContent="center" gap={2.5} sx={{ mt: 1 }}>
								{pieData.map((entry) => (
									<Box key={entry.name} display="flex" alignItems="center" gap={0.75}>
										<Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: entry.color }} />
										<Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
											{entry.name} ({entry.value})
										</Typography>
									</Box>
								))}
							</Box>
						</Grid>

						<Grid size={{ xs: 12, md: 7 }}>
							<Grid container spacing={2.5}>
								<Grid size={6}>
									{miniStat(<HourglassEmpty sx={{ fontSize: 20 }} />, 'Active Trials', stats.active_trials, theme.palette.warning.main)}
								</Grid>
								<Grid size={6}>
									{miniStat(<CheckCircleOutline sx={{ fontSize: 20 }} />, 'Paid Orgs', stats.paid_organizations, theme.palette.primary.main)}
								</Grid>
								<Grid size={6}>
									{miniStat(<PersonOutline sx={{ fontSize: 20 }} />, 'Platform Users', stats.total_users, theme.palette.info.main)}
								</Grid>
								<Grid size={6}>
									{miniStat(<Business sx={{ fontSize: 20 }} />, 'Avg Seats / Org', stats.avg_users_per_org, theme.palette.success.main)}
								</Grid>
							</Grid>
						</Grid>
					</Grid>
				)}
			</CardContent>
		</Card>
	);
};

export default PlatformPulsePanel;
