import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Box, useTheme, alpha, Skeleton } from '@mui/material';
import { Bolt } from '@mui/icons-material';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAppSelector } from '../../../store/hooks';
import aiService, { type AIUsageSummary } from '../../../services/aiService';

interface AiUsageChartPanelProps {
	/** 'organization' combines every member's usage (org-admin view); 'mine' is just the caller's own. */
	scope?: 'mine' | 'organization';
}

export const AiUsageChartPanel: React.FC<AiUsageChartPanelProps> = ({ scope = 'mine' }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const org = useAppSelector((state) => state.auth.user?.organization);

	const [usage, setUsage] = useState<AIUsageSummary | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;
		setLoading(true);
		aiService.getUsageSummary(scope)
			.then((u) => {
				if (!cancelled) setUsage(u);
			})
			.catch(() => {})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [scope]);

	const aiLimit = org?.plan?.ai_monthly_limit ?? 100;

	const chartData = (usage?.daily_trend || []).slice(-7).map((d) => ({
		date: new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
		usage: d.credits,
	}));
	const totalUsedThisWeek = chartData.reduce((sum, d) => sum + d.usage, 0);

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
			<CardContent sx={{ p: 2.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
				<Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
					<Box display="flex" alignItems="center" gap={1.25}>
						<Bolt color="primary" sx={{ fontSize: 20 }} />
						<Typography variant="subtitle2" sx={{ fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '0.78rem', color: 'text.primary' }}>
							AI Operations Usage
						</Typography>
					</Box>
					<Box sx={{ px: 1, py: 0.25, borderRadius: 1.5, bgcolor: alpha(theme.palette.success.main, 0.1), border: `1px solid ${alpha(theme.palette.success.main, 0.15)}` }}>
						<Typography variant="caption" sx={{ fontWeight: 800, color: theme.palette.success.main, fontSize: '0.66rem' }}>
							Limit: {aiLimit}/mo
						</Typography>
					</Box>
				</Box>

				{loading ? (
					<>
						<Box display="flex" gap={2} sx={{ mb: 2 }}>
							<Skeleton variant="text" width={80} height={40} />
							<Skeleton variant="text" width={80} height={40} />
						</Box>
						<Skeleton variant="rounded" sx={{ flexGrow: 1, minHeight: 110 }} />
					</>
				) : (
					<>
						<Box display="flex" gap={2} sx={{ mb: 2 }}>
							<Box>
								<Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1 }}>
									{totalUsedThisWeek}
								</Typography>
								<Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
									Consumed this week
								</Typography>
							</Box>
							<Box sx={{ width: '1px', bgcolor: theme.palette.divider }} />
							<Box>
								<Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1 }}>
									{Math.max(0, aiLimit - (usage?.total_credits_consumed ?? 0))}
								</Typography>
								<Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
									Remaining quota
								</Typography>
							</Box>
						</Box>

						<Box sx={{ flexGrow: 1, minHeight: 110, width: '100%' }}>
							{chartData.length > 0 ? (
								<ResponsiveContainer width="100%" height="100%">
									<AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
										<defs>
											<linearGradient id="aiUsageGradient" x1="0" y1="0" x2="0" y2="1">
												<stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={isDark ? 0.35 : 0.25} />
												<stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0} />
											</linearGradient>
										</defs>
										<CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'} />
										<XAxis dataKey="date" tickLine={false} axisLine={false} style={{ fontSize: '0.62rem', fontWeight: 600, fill: theme.palette.text.secondary }} />
										<YAxis tickLine={false} axisLine={false} style={{ fontSize: '0.62rem', fontWeight: 600, fill: theme.palette.text.secondary }} />
										<Tooltip contentStyle={{ background: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}`, borderRadius: 8, fontSize: 11 }} />
										<Area type="monotone" dataKey="usage" stroke={theme.palette.primary.main} strokeWidth={2.5} fillOpacity={1} fill="url(#aiUsageGradient)" />
									</AreaChart>
								</ResponsiveContainer>
							) : (
								<Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
									<Typography variant="caption" color="text.secondary">
										No AI usage yet this week.
									</Typography>
								</Box>
							)}
						</Box>
					</>
				)}
			</CardContent>
		</Card>
	);
};

export default AiUsageChartPanel;
