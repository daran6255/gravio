import React, { useEffect, useState } from 'react';
import {
	Box,
	Container,
	Grid,
	Card,
	CardContent,
	Typography,
	Stack,
	LinearProgress,
	CircularProgress,
	useTheme,
	alpha,
} from '@mui/material';
import { BoltOutlined, TrendingUpOutlined, ForumOutlined, TokenOutlined } from '@mui/icons-material';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import PageHeader from '../../components/common/page-header';
import aiService, { type AICreditBalance, type AIUsageSummary } from '../../services/aiService';

const prettifyActionType = (actionType: string): string =>
	actionType
		.replace(/_/g, ' ')
		.replace(/\b\w/g, (c) => c.toUpperCase());

const StatTile: React.FC<{ icon: React.ReactNode; label: string; value: string | number }> = ({ icon, label, value }) => {
	const theme = useTheme();
	return (
		<Card sx={{ borderRadius: 3, boxShadow: 'none', border: '1px solid', borderColor: 'divider', height: '100%' }}>
			<CardContent sx={{ p: 2.5 }}>
				<Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1, color: theme.palette.primary.main }}>
					{icon}
					<Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
						{label}
					</Typography>
				</Stack>
				<Typography variant="h5" sx={{ fontWeight: 800 }}>{value}</Typography>
			</CardContent>
		</Card>
	);
};

const AICreditsUsagePage: React.FC = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const brand = theme.palette.primary.main;

	const [balance, setBalance] = useState<AICreditBalance | null>(null);
	const [usage, setUsage] = useState<AIUsageSummary | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		Promise.all([aiService.getCreditBalance(), aiService.getUsageSummary('mine')])
			.then(([b, u]) => {
				setBalance(b);
				setUsage(u);
			})
			.catch(() => {})
			.finally(() => setLoading(false));
	}, []);

	if (loading) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
				<CircularProgress />
			</Box>
		);
	}

	const resetsOn = (() => {
		if (!balance) return null;
		const d = new Date(balance.period_start);
		d.setMonth(d.getMonth() + 1);
		return d;
	})();

	const chartData = (usage?.daily_trend || []).map((d) => ({
		date: new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
		credits: d.credits,
	}));

	const actionRows = [...(usage?.by_action_type || [])].sort((a, b) => b.credits - a.credits);
	const maxActionCredits = Math.max(...actionRows.map((r) => r.credits), 1);

	return (
		<Box component="main" sx={{ bgcolor: 'background.default', minHeight: '100vh', py: { xs: 2, sm: 4 } }}>
			<Container maxWidth="lg">
				<PageHeader
					title="AI Credits & Usage"
					subtitle="Your personal monthly AI credit allotment and how it's been used"
				/>

				{/* Balance card */}
				<Card sx={{ mb: 3, borderRadius: 3, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
					<CardContent sx={{ p: 3 }}>
						<Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} sx={{ mb: 2 }}>
							<Stack direction="row" alignItems="center" spacing={1.5}>
								<Box
									sx={{
										width: 40,
										height: 40,
										borderRadius: '10px',
										background: theme.gradients?.brandDiagonal,
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
									}}
								>
									<BoltOutlined sx={{ color: '#fff' }} />
								</Box>
								<Box>
									<Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
										{(balance?.balance ?? 0).toLocaleString()} credits left
									</Typography>
									<Typography variant="caption" color="text.secondary">
										of {(balance?.granted ?? 0).toLocaleString()} this month
										{resetsOn && ` · resets ${resetsOn.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`}
									</Typography>
								</Box>
							</Stack>
						</Stack>
						<LinearProgress
							variant="determinate"
							value={Math.min(balance?.percent_used ?? 0, 100)}
							color={(balance?.percent_used ?? 0) >= 90 ? 'error' : (balance?.percent_used ?? 0) >= 70 ? 'warning' : 'primary'}
							sx={{ height: 8, borderRadius: 4 }}
						/>
					</CardContent>
				</Card>

				{/* Stat tiles */}
				<Grid container spacing={2} sx={{ mb: 3 }}>
					<Grid size={{ xs: 12, sm: 4 }}>
						<StatTile icon={<TrendingUpOutlined fontSize="small" />} label="Credits used" value={(usage?.total_credits_consumed ?? 0).toLocaleString()} />
					</Grid>
					<Grid size={{ xs: 12, sm: 4 }}>
						<StatTile icon={<ForumOutlined fontSize="small" />} label="AI actions" value={(usage?.total_calls ?? 0).toLocaleString()} />
					</Grid>
					<Grid size={{ xs: 12, sm: 4 }}>
						<StatTile icon={<TokenOutlined fontSize="small" />} label="Tokens used" value={(usage?.total_tokens_used ?? 0).toLocaleString()} />
					</Grid>
				</Grid>

				{/* Daily trend */}
				<Card sx={{ mb: 3, borderRadius: 3, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
					<CardContent sx={{ p: 3 }}>
						<Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
							Daily usage — last 30 days
						</Typography>
						{chartData.length > 0 ? (
							<Box sx={{ width: '100%', height: 260 }}>
								<ResponsiveContainer width="100%" height="100%">
									<AreaChart data={chartData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
										<defs>
											<linearGradient id="creditsUsageGradient" x1="0" y1="0" x2="0" y2="1">
												<stop offset="5%" stopColor={brand} stopOpacity={isDark ? 0.35 : 0.25} />
												<stop offset="95%" stopColor={brand} stopOpacity={0} />
											</linearGradient>
										</defs>
										<CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'} />
										<XAxis dataKey="date" tickLine={false} axisLine={false} style={{ fontSize: '0.7rem', fontWeight: 600, fill: theme.palette.text.secondary }} />
										<YAxis tickLine={false} axisLine={false} width={40} style={{ fontSize: '0.7rem', fontWeight: 600, fill: theme.palette.text.secondary }} />
										<Tooltip
											cursor={{ stroke: brand, strokeWidth: 1, strokeDasharray: '3 3' }}
											contentStyle={{ background: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}`, borderRadius: 8, fontSize: 12 }}
											formatter={(value) => [`${value} credits`, 'Used']}
										/>
										<Area type="monotone" dataKey="credits" stroke={brand} strokeWidth={2} fillOpacity={1} fill="url(#creditsUsageGradient)" />
									</AreaChart>
								</ResponsiveContainer>
							</Box>
						) : (
							<Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
								No AI usage yet this month.
							</Typography>
						)}
					</CardContent>
				</Card>

				{/* Breakdown by feature */}
				<Card sx={{ borderRadius: 3, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
					<CardContent sx={{ p: 3 }}>
						<Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
							Usage by feature — this month
						</Typography>
						{actionRows.length > 0 ? (
							<Stack spacing={2}>
								{actionRows.map((row) => (
									<Box key={row.action_type}>
										<Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 0.5 }}>
											<Typography variant="body2" sx={{ fontWeight: 600 }}>
												{prettifyActionType(row.action_type)}
											</Typography>
											<Typography variant="caption" color="text.secondary">
												{row.credits.toLocaleString()} credits · {row.calls} action{row.calls === 1 ? '' : 's'}
											</Typography>
										</Stack>
										<LinearProgress
											variant="determinate"
											value={(row.credits / maxActionCredits) * 100}
											sx={{
												height: 6,
												borderRadius: 3,
												bgcolor: alpha(brand, 0.1),
												'& .MuiLinearProgress-bar': { bgcolor: brand, borderRadius: 3 },
											}}
										/>
									</Box>
								))}
							</Stack>
						) : (
							<Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
								No AI usage yet this month.
							</Typography>
						)}
					</CardContent>
				</Card>
			</Container>
		</Box>
	);
};

export default AICreditsUsagePage;
