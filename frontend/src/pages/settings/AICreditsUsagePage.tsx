import React, { useEffect, useState } from 'react';
import {
	Box,
	Container,
	Grid,
	Card,
	CardContent,
	CardActions,
	Typography,
	Stack,
	Button,
	Chip,
	LinearProgress,
	CircularProgress,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	TextField,
	Alert,
	InputAdornment,
	useTheme,
	alpha,
} from '@mui/material';
import { BoltOutlined, TrendingUpOutlined, ForumOutlined, TokenOutlined, CreditCard as CardIcon } from '@mui/icons-material';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import PageHeader from '../../components/common/page-header';
import useToast from '../../hooks/useToast';
import aiService, { type AICreditBalance, type AIUsageSummary } from '../../services/aiService';

const prettifyActionType = (actionType: string): string =>
	actionType
		.replace(/_/g, ' ')
		.replace(/\b\w/g, (c) => c.toUpperCase());

const formatINR = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

interface CreditPackage {
	credits: number;
	price: number;
	popular?: boolean;
}

const CREDIT_PACKAGES: CreditPackage[] = [
	{ credits: 100, price: 99 },
	{ credits: 500, price: 399, popular: true },
	{ credits: 1000, price: 699 },
	{ credits: 2500, price: 1499 },
];

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
	const toast = useToast();

	const [balance, setBalance] = useState<AICreditBalance | null>(null);
	const [usage, setUsage] = useState<AIUsageSummary | null>(null);
	const [loading, setLoading] = useState(true);

	// Buy-credits mock checkout -- same pattern as plan upgrades in BillingSettings.tsx: a
	// fake card form + simulated gateway delay, then the real backend call that actually
	// applies the credit grant once "payment" succeeds.
	const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null);
	const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
	const [processingPayment, setProcessingPayment] = useState(false);
	const [cardNumber, setCardNumber] = useState('');
	const [cardExpiry, setCardExpiry] = useState('');
	const [cardCvc, setCardCvc] = useState('');
	const [cardName, setCardName] = useState('');

	useEffect(() => {
		Promise.all([aiService.getCreditBalance(), aiService.getUsageSummary('mine')])
			.then(([b, u]) => {
				setBalance(b);
				setUsage(u);
			})
			.catch(() => {})
			.finally(() => setLoading(false));
	}, []);

	const handleBuyClick = (pkg: CreditPackage) => {
		setSelectedPackage(pkg);
		setCardNumber('');
		setCardExpiry('');
		setCardCvc('');
		setCardName('');
		setPaymentDialogOpen(true);
	};

	const handlePaymentSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!selectedPackage) return;
		if (!cardNumber || !cardExpiry || !cardCvc || !cardName) {
			toast.error('Please fill in all card details.');
			return;
		}

		setProcessingPayment(true);
		// Simulate payment gateway delay (2 seconds), matching BillingSettings' checkout flow.
		setTimeout(async () => {
			try {
				const updated = await aiService.purchaseCredits(selectedPackage.credits);
				setBalance(updated);
				toast.success(`Payment successful! ${selectedPackage.credits.toLocaleString()} credits added.`);
				setPaymentDialogOpen(false);
			} catch (error: any) {
				toast.error(
					error?.response?.data?.error?.message || error?.message || 'Payment failed or credits could not be applied.'
				);
			} finally {
				setProcessingPayment(false);
			}
		}, 2000);
	};

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

				{/* Buy more credits */}
				<Card sx={{ mb: 3, borderRadius: 3, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
					<CardContent sx={{ p: 3, pb: 1.5 }}>
						<Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
							Buy more credits
						</Typography>
						<Typography variant="body2" color="text.secondary">
							Running low before the month resets? Top up your own balance any time.
						</Typography>
					</CardContent>
					<CardContent sx={{ p: 3, pt: 0 }}>
						<Grid container spacing={2}>
							{CREDIT_PACKAGES.map((pkg) => (
								<Grid size={{ xs: 6, sm: 3 }} key={pkg.credits}>
									<Card
										variant="outlined"
										sx={{
											borderRadius: 2.5,
											borderColor: pkg.popular ? brand : 'divider',
											borderWidth: pkg.popular ? 2 : 1,
											position: 'relative',
											height: '100%',
											display: 'flex',
											flexDirection: 'column',
										}}
									>
										{pkg.popular && (
											<Chip
												label="Best value"
												size="small"
												sx={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', bgcolor: brand, color: '#fff', fontWeight: 700, fontSize: '0.65rem' }}
											/>
										)}
										<CardContent sx={{ textAlign: 'center', pb: 1, flex: 1 }}>
											<Typography variant="h6" sx={{ fontWeight: 800 }}>
												{pkg.credits.toLocaleString()}
											</Typography>
											<Typography variant="caption" color="text.secondary">credits</Typography>
											<Typography variant="body2" sx={{ mt: 1, fontWeight: 700 }}>
												{formatINR(pkg.price)}
											</Typography>
										</CardContent>
										<CardActions sx={{ p: 1.5, pt: 0 }}>
											<Button fullWidth size="small" variant={pkg.popular ? 'contained' : 'outlined'} onClick={() => handleBuyClick(pkg)} sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 1.5, boxShadow: 'none' }}>
												Buy
											</Button>
										</CardActions>
									</Card>
								</Grid>
							))}
						</Grid>
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

				{/* Buy Credits — Checkout / Payment Dialog (same mock-gateway pattern as plan
				    upgrades in BillingSettings.tsx) */}
				<Dialog
					open={paymentDialogOpen}
					onClose={processingPayment ? undefined : () => setPaymentDialogOpen(false)}
					maxWidth="sm"
					fullWidth
					PaperProps={{
						sx: {
							borderRadius: 3,
							overflow: 'hidden',
							bgcolor: theme.palette.background.paper,
							border: `1px solid ${theme.palette.divider}`,
							boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
						},
					}}
				>
					<DialogTitle sx={{ background: theme.gradients?.brand, color: '#ffffff', fontWeight: 800, py: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
						<CardIcon /> Checkout & Payment Gateway
					</DialogTitle>

					<form onSubmit={handlePaymentSubmit}>
						<DialogContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
							<Alert severity="info" sx={{ borderRadius: 2 }}>
								You're buying <strong>{selectedPackage?.credits.toLocaleString()} credits</strong> for your own account.
							</Alert>

							<Box sx={{ p: 2.5, borderRadius: 2.5, bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)', border: `1px solid ${theme.palette.divider}` }}>
								<Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
									Order Summary
								</Typography>
								<Box display="flex" justifyContent="space-between" mb={1}>
									<Typography variant="body2" color="text.secondary">
										{selectedPackage?.credits.toLocaleString()} AI credits
									</Typography>
									<Typography variant="body2" sx={{ fontWeight: 700 }}>
										{formatINR(selectedPackage?.price || 0)}
									</Typography>
								</Box>
								<Box display="flex" justifyContent="space-between" mb={1}>
									<Typography variant="body2" color="text.secondary">GST (18%)</Typography>
									<Typography variant="body2" sx={{ fontWeight: 700 }}>
										{formatINR(Math.round((selectedPackage?.price || 0) * 0.18))}
									</Typography>
								</Box>
								<Box sx={{ borderTop: `1px solid ${theme.palette.divider}`, my: 1.5 }} />
								<Box display="flex" justifyContent="space-between">
									<Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Total</Typography>
									<Typography variant="subtitle1" color="primary" sx={{ fontWeight: 800 }}>
										{formatINR(Math.round((selectedPackage?.price || 0) * 1.18))}
									</Typography>
								</Box>
							</Box>

							<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
								<Typography variant="subtitle2" sx={{ fontWeight: 800, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
									Payment Details
								</Typography>
								<TextField
									required
									fullWidth
									label="Cardholder Name"
									value={cardName}
									onChange={(e) => setCardName(e.target.value)}
									disabled={processingPayment}
								/>
								<TextField
									required
									fullWidth
									label="Card Number"
									placeholder="4111 2222 3333 4444"
									value={cardNumber}
									onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim().slice(0, 19))}
									disabled={processingPayment}
									InputProps={{
										startAdornment: (
											<InputAdornment position="start">
												<CardIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
											</InputAdornment>
										),
									}}
								/>
								<Grid container spacing={2}>
									<Grid size={6}>
										<TextField
											required
											fullWidth
											label="Expiry Date"
											placeholder="MM/YY"
											value={cardExpiry}
											onChange={(e) => {
												let val = e.target.value.replace(/\D/g, '');
												if (val.length > 2) val = `${val.slice(0, 2)}/${val.slice(2, 4)}`;
												setCardExpiry(val.slice(0, 5));
											}}
											disabled={processingPayment}
										/>
									</Grid>
									<Grid size={6}>
										<TextField
											required
											fullWidth
											label="CVC"
											placeholder="123"
											value={cardCvc}
											onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
											disabled={processingPayment}
										/>
									</Grid>
								</Grid>
							</Box>
						</DialogContent>
						<DialogActions sx={{ p: 3, pt: 0 }}>
							<Button onClick={() => setPaymentDialogOpen(false)} disabled={processingPayment} sx={{ textTransform: 'none', fontWeight: 600 }}>
								Cancel
							</Button>
							<Button
								type="submit"
								variant="contained"
								disabled={processingPayment}
								startIcon={processingPayment ? <CircularProgress size={16} sx={{ color: 'inherit' }} /> : undefined}
								sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, boxShadow: 'none' }}
							>
								{processingPayment ? 'Processing...' : `Pay ${formatINR(Math.round((selectedPackage?.price || 0) * 1.18))}`}
							</Button>
						</DialogActions>
					</form>
				</Dialog>
			</Container>
		</Box>
	);
};

export default AICreditsUsagePage;
