import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Box, useTheme, Grid, Skeleton, alpha } from '@mui/material';
import { Insights, Business, PersonOutline, CheckCircleOutline, HourglassEmpty } from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import orgAdminService from '../../../services/orgAdminService';
import type { AdminStats } from '../../../models/admin';

const miniStat = (icon: React.ReactElement, label: string, value: number | string, color: string) => (
	<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
		<Box
			sx={{
				width: 32, height: 32, borderRadius: '8px',
				display: 'flex', alignItems: 'center', justifyContent: 'center',
				bgcolor: alpha(color, 0.12), color,
			}}
		>
			{icon}
		</Box>
		<Box sx={{ minWidth: 0 }}>
			<Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.1, fontSize: '0.92rem' }}>{value}</Typography>
			<Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.66rem', display: 'block', whiteSpace: 'nowrap' }}>{label}</Typography>
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
				display: 'flex',
				flexDirection: 'column',
				background: isDark
					? 'linear-gradient(135deg, rgba(20, 24, 34, 0.75) 0%, rgba(11, 13, 18, 0.9) 100%)'
					: 'linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(248, 250, 252, 0.95) 100%)',
				backdropFilter: 'blur(20px)',
				border: `1px solid ${theme.palette.divider}`,
				boxShadow: isDark ? '0 8px 32px 0 rgba(0, 0, 0, 0.2)' : '0 8px 32px 0 rgba(139, 124, 246, 0.04)',
			}}
		>
			<CardContent sx={{ p: 2.5, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
				<Box display="flex" alignItems="center" gap={1.25} sx={{ mb: 2 }}>
					<Insights color="primary" sx={{ fontSize: 20 }} />
					<Typography variant="subtitle2" sx={{ fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '0.78rem', color: 'text.primary' }}>
						Platform Pulse
					</Typography>
				</Box>

				{loading ? (
					<Skeleton variant="rounded" height={220} sx={{ borderRadius: '12px' }} />
				) : !stats ? (
					<Typography variant="body2" color="text.secondary">Couldn't load platform stats.</Typography>
				) : (
					<Grid container spacing={1} alignItems="center" sx={{ flexGrow: 1 }}>
						{/* Donut Chart on the Left */}
						<Grid size={{ xs: 12, sm: 5.2 }}>
							<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
								<Box sx={{ position: 'relative', width: '100%', height: 100 }}>
									<ResponsiveContainer width="100%" height="100%">
										<PieChart>
											<Pie
												data={pieData}
												dataKey="value"
												nameKey="name"
												innerRadius={28}
												outerRadius={40}
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
													fontSize: 10,
												}}
											/>
										</PieChart>
									</ResponsiveContainer>
									<Box sx={{
										position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
										textAlign: 'center', pointerEvents: 'none',
									}}>
										<Typography sx={{ fontWeight: 800, color: 'text.primary', fontSize: '0.95rem', lineHeight: 1.1 }}>
											{stats.total_organizations}
										</Typography>
										<Typography sx={{ color: 'text.secondary', fontWeight: 700, fontSize: '0.55rem', letterSpacing: '0.02em', lineHeight: 1 }}>
											ORGS
										</Typography>
									</Box>
								</Box>
								
								{/* Donut Legend */}
								<Box display="flex" flexDirection="column" alignItems="center" gap={0.25} sx={{ mt: 0.5 }}>
									{pieData.map((entry) => (
										<Box key={entry.name} display="flex" alignItems="center" gap={0.5}>
											<Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: entry.color }} />
											<Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.62rem', whiteSpace: 'nowrap' }}>
												{entry.name} ({entry.value})
											</Typography>
										</Box>
									))}
								</Box>
							</Box>
						</Grid>

						{/* Stats in Vertical Stack on the Right */}
						<Grid size={{ xs: 12, sm: 6.8 }}>
							<Box sx={{
								display: 'flex',
								flexDirection: 'column',
								gap: 1.25,
								pl: { xs: 0, sm: 1 },
								borderLeft: { xs: 'none', sm: `1px solid ${theme.palette.divider}` }
							}}>
								{miniStat(<HourglassEmpty sx={{ fontSize: 16 }} />, 'Active Trials', stats.active_trials, theme.palette.warning.main)}
								{miniStat(<CheckCircleOutline sx={{ fontSize: 16 }} />, 'Paid Orgs', stats.paid_organizations, theme.palette.primary.main)}
								{miniStat(<PersonOutline sx={{ fontSize: 16 }} />, 'Platform Users', stats.total_users, theme.palette.info.main)}
								{miniStat(<Business sx={{ fontSize: 16 }} />, 'Avg Seats / Org', stats.avg_users_per_org, theme.palette.success.main)}
							</Box>
						</Grid>
					</Grid>
				)}
			</CardContent>
		</Card>
	);
};

export default PlatformPulsePanel;
