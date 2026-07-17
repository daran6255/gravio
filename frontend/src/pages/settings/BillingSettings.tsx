import React, { useState } from 'react';
import {
	Box,
	Container,
	Grid,
	Card,
	CardContent,
	CardActions,
	Button,
	Typography,
	LinearProgress,
	Chip,
	List,
	ListItem,
	ListItemIcon,
	ListItemText,
	Divider,
	useTheme,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	TextField,
	Alert,
	InputAdornment,
	CircularProgress
} from '@mui/material';
import {
	CheckCircleOutline as CheckIcon,
	People as SeatsIcon,
	Star as StarIcon,
	CreditCard as CardIcon,
	Lock as LockIcon
} from '@mui/icons-material';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { fetchCurrentUser } from '../../store/slices/authSlice';
import userService from '../../services/userService';
import useToast from '../../hooks/useToast';
import PageHeader from '../../components/common/page-header';

interface PlanDetail {
	tier: 'free' | 'basic' | 'pro' | 'enterprise';
	name: string;
	/** ₹ per user per month; 0 for the free tier */
	pricePerUser: number;
	seats: string;
	aiLimit: string;
	features: string[];
	popular?: boolean;
}

// Per-user pricing, undercutting typical competitor per-seat rates in this
// space (₹300–800+/user/month) — starts at ₹149/user and scales with a
// straightforward 2x/3x ladder rather than opaque tiered seat blocks.
const PLAN_CARDS: PlanDetail[] = [
	{
		tier: 'free',
		name: 'Free Plan',
		pricePerUser: 0,
		seats: 'Up to 10 users',
		aiLimit: '10 actions/mo',
		features: [
			'30-Day Free Trial Included',
			'Project Management Module',
			'10 AI Actions Per Month',
			'Up to 10 Team Members',
			'Standard Email Support'
		]
	},
	{
		tier: 'basic',
		name: 'Starter Plan',
		pricePerUser: 149,
		seats: 'No seat limit — pay per user',
		aiLimit: '200 actions/mo',
		features: [
			'Project & Timesheet Management',
			'CRM Management',
			'200 AI Actions Per Month',
			'Unlimited Team Members',
			'Priority Email Support'
		]
	},
	{
		tier: 'pro',
		name: 'Growth Plan',
		pricePerUser: 299,
		seats: 'No seat limit — pay per user',
		aiLimit: '1,000 actions/mo',
		features: [
			'All Starter Features',
			'Candidate & Placement Modules',
			'Advanced Reports',
			'1,000 AI Actions Per Month',
			'Priority Chat Support'
		],
		popular: true
	},
	{
		tier: 'enterprise',
		name: 'Enterprise Plan',
		pricePerUser: 499,
		seats: 'No seat limit — pay per user',
		aiLimit: '5,000 actions/mo',
		features: [
			'Full Suite Modules Unlocked',
			'Training & Placement Tracking',
			'5,000 AI Actions Per Month',
			'24/7 Phone & Email Support',
			'Dedicated Account Manager'
		]
	}
];

const formatINR = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

const TIER_RANKS: Record<string, number> = {
	free: 0,
	basic: 1,
	pro: 2,
	enterprise: 3
};

const BillingSettings: React.FC = () => {
	const theme = useTheme();
	const dispatch = useAppDispatch();
	const toast = useToast();
	const user = useAppSelector((state) => state.auth.user);
	const [loadingTier, setLoadingTier] = useState<string | null>(null);

	const organization = user?.organization;
	const activePlanTier = organization?.plan?.tier || 'free';
	const userCount = organization?.user_count || 1;
	const userLimit = organization?.user_limit || 10;

	// Percentage of seats used
	const seatPercentage = userLimit ? Math.min((userCount / userLimit) * 100, 100) : 0;

	const isTrial = organization?.subscription_status === 'trial';
	const trialDaysLeft = organization?.trial_expires_at
		? Math.max(0, Math.ceil((new Date(organization.trial_expires_at).getTime() - Date.now()) / 86_400_000))
		: null;
	const [requestingExtension, setRequestingExtension] = useState(false);

	const [selectedPlan, setSelectedPlan] = useState<PlanDetail | null>(null);
	const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
	const [processingPayment, setProcessingPayment] = useState(false);
	const [cardNumber, setCardNumber] = useState('');
	const [cardExpiry, setCardExpiry] = useState('');
	const [cardCvc, setCardCvc] = useState('');
	const [cardName, setCardName] = useState('');

	const handleUpgrade = async (tier: string) => {
		setLoadingTier(tier);
		try {
			await userService.updatePlan(tier);
			toast.success(`Successfully switched to the ${tier.toUpperCase()} plan.`);
			// Refresh user profile details in Redux to update local plan details
			dispatch(fetchCurrentUser());
		} catch (error: any) {
			toast.error(
				error?.response?.data?.error?.message ||
				error?.message ||
				'Failed to upgrade plan'
			);
		} finally {
			setLoadingTier(null);
		}
	};

	const handleSwitchPlanClick = (plan: PlanDetail) => {
		if (plan.pricePerUser === 0) {
			// Free plan can be upgraded directly or simple confirmation
			handleUpgrade(plan.tier);
		} else {
			setSelectedPlan(plan);
			setCardNumber('');
			setCardExpiry('');
			setCardCvc('');
			setCardName('');
			setPaymentDialogOpen(true);
		}
	};

	const handlePaymentSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!selectedPlan) return;
		if (!cardNumber || !cardExpiry || !cardCvc || !cardName) {
			toast.error('Please fill in all card details.');
			return;
		}

		setProcessingPayment(true);
		
		// Simulate payment gateway delay (2 seconds)
		setTimeout(async () => {
			try {
				await userService.updatePlan(selectedPlan.tier);
				toast.success(`Payment successful! Switched to the ${selectedPlan.name}.`);
				dispatch(fetchCurrentUser());
				setPaymentDialogOpen(false);
			} catch (error: any) {
				toast.error(
					error?.response?.data?.error?.message ||
					error?.message ||
					'Payment failed or failed to update plan'
				);
			} finally {
				setProcessingPayment(false);
			}
		}, 2000);
	};

	const handleRequestExtension = async () => {
		setRequestingExtension(true);
		try {
			const result = await userService.requestTrialExtension();
			toast.success(result.message || 'Your request has been sent.');
		} catch (error: any) {
			toast.error(
				error?.response?.data?.error?.message ||
				error?.message ||
				'Failed to send your request'
			);
		} finally {
			setRequestingExtension(false);
		}
	};

	return (
		<Box component="main" sx={{ bgcolor: 'background.default', minHeight: '100vh', py: { xs: 2, sm: 4 } }}>
			<Container maxWidth="xl">
				<PageHeader
					title="Billing & Plan"
					subtitle="Manage your organization plan, billing tier, and team capacity"
				/>

				{/* Organization Seat Utilization Summary */}
				<Card sx={{ mb: 4, borderRadius: 3, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
					<CardContent sx={{ p: 3 }}>
						<Grid container spacing={3} alignItems="center">
							<Grid size={{ xs: 12, md: 6 }}>
								<Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
									<SeatsIcon color="primary" /> Seat Utilization
								</Typography>
								<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
									You have used <strong>{userCount}</strong> of <strong>{userLimit ? `${userLimit}` : 'Unlimited'}</strong> available team seats under your plan.
								</Typography>
								{userLimit && (
									<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
										<Box sx={{ flexGrow: 1 }}>
											<LinearProgress
												variant="determinate"
												value={seatPercentage}
												color={seatPercentage > 85 ? 'error' : seatPercentage > 65 ? 'warning' : 'primary'}
												sx={{ height: 8, borderRadius: 4 }}
											/>
										</Box>
										<Typography variant="caption" sx={{ fontWeight: 700 }}>
											{Math.round(seatPercentage)}% Used
										</Typography>
									</Box>
								)}
							</Grid>
							<Grid size={{ xs: 12, md: 6 }} sx={{ borderLeft: { md: `1px solid ${theme.palette.divider}` }, pl: { md: 4 } }}>
								<Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
									<StarIcon color="warning" /> Active Pricing Plan
								</Typography>
								<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
									Current Plan: <Chip label={activePlanTier.toUpperCase()} color="primary" size="small" sx={{ fontWeight: 700, borderRadius: 1 }} />
								</Typography>
								<Typography variant="caption" color="text.secondary" display="block">
									Billing status: <strong>{organization?.subscription_status?.toUpperCase() || 'ACTIVE'}</strong>
								</Typography>
							</Grid>
						</Grid>
					</CardContent>
				</Card>

				{/* Pricing Cards Grid */}
				<Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
					Available Pricing Plans
				</Typography>

				<Grid container spacing={3}>
					{PLAN_CARDS.map((plan) => {
						const isActive = plan.tier === activePlanTier;
						const isDowngrade = TIER_RANKS[plan.tier] < TIER_RANKS[activePlanTier];
						return (
							<Grid size={{ xs: 12, sm: 6, md: 3 }} key={plan.tier}>
								<Card
									sx={{
										height: '100%',
										display: 'flex',
										flexDirection: 'column',
										borderRadius: 3,
										position: 'relative',
										border: isActive ? `2px solid ${theme.palette.primary.main}` : '1px solid',
										borderColor: isActive ? 'primary.main' : 'divider',
										boxShadow: isActive ? '0 8px 24px rgba(0, 115, 187, 0.12)' : 'none',
										transition: 'all 0.3s ease',
										'&:hover': {
											boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
											transform: 'translateY(-2px)'
										}
									}}
								>
									{plan.popular && (
										<Chip
											label="POPULAR"
											color="warning"
											size="small"
											sx={{
												position: 'absolute',
												top: 16,
												right: 16,
												fontWeight: 700,
												fontSize: '0.65rem',
												height: 20
											}}
										/>
									)}
									<CardContent sx={{ p: 3, flexGrow: 1 }}>
										<Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
											{plan.name}
										</Typography>
										<Box sx={{ display: 'flex', alignItems: 'baseline', mb: plan.pricePerUser > 0 ? 0.5 : 2 }}>
											<Typography variant="h3" sx={{ fontWeight: 800 }}>
												{formatINR(plan.pricePerUser)}
											</Typography>
											<Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
												{plan.pricePerUser > 0 ? '/ user / month' : '/ month'}
											</Typography>
										</Box>

										{plan.pricePerUser > 0 && (
											<Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
												≈ {formatINR(plan.pricePerUser * userCount)}/month for your team of {userCount}
											</Typography>
										)}

										{plan.tier === 'free' && isTrial && trialDaysLeft !== null && (
											<Chip
												label={`${trialDaysLeft} day${trialDaysLeft === 1 ? '' : 's'} left in your trial`}
												size="small"
												color="warning"
												sx={{ mb: 2, fontWeight: 700, fontSize: '0.72rem' }}
											/>
										)}

										<Chip label={plan.seats} size="small" variant="outlined" sx={{ mb: 1, fontWeight: 600, fontSize: '0.72rem' }} />
										<Chip label={plan.aiLimit} size="small" variant="outlined" sx={{ mb: 2, ml: 1, fontWeight: 600, fontSize: '0.72rem' }} />
										
										<Divider sx={{ my: 2 }} />

										<List sx={{ p: 0 }}>
											{plan.features.map((feature, i) => (
												<ListItem key={i} sx={{ p: 0, mb: 1, alignItems: 'flex-start' }}>
													<ListItemIcon sx={{ minWidth: 24, mt: 0.25 }}>
														<CheckIcon color="success" sx={{ fontSize: 16 }} />
													</ListItemIcon>
													<ListItemText
														primary={feature}
														primaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
													/>
												</ListItem>
											))}
										</List>
									</CardContent>
									<CardActions sx={{ p: 3, pt: 0, flexDirection: 'column', alignItems: 'stretch', gap: 1 }}>
										<Button
											fullWidth
											variant={isActive ? 'outlined' : 'contained'}
											color={isActive ? 'inherit' : isDowngrade ? 'inherit' : 'primary'}
											disabled={isActive || isDowngrade || loadingTier !== null}
											onClick={() => handleSwitchPlanClick(plan)}
											sx={{
												textTransform: 'none',
												fontWeight: 700,
												borderRadius: 2,
												py: 1,
												boxShadow: 'none',
												'&:hover': { boxShadow: 'none' }
											}}
										>
											{isActive 
												? 'Current Plan' 
												: isDowngrade 
													? 'Downgrade Disabled' 
													: loadingTier === plan.tier 
														? 'Switching...' 
														: 'Upgrade Plan'}
										</Button>

										{plan.tier === 'free' && isActive && isTrial && (
											<Button
												fullWidth
												variant="text"
												disabled={requestingExtension}
												onClick={handleRequestExtension}
												sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.8rem' }}
											>
												{requestingExtension ? 'Sending request...' : 'Request Trial Extension'}
											</Button>
										)}
									</CardActions>
								</Card>
							</Grid>
						);
					})}
				</Grid>

				{/* Checkout / Payment Modal Dialog */}
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
							boxShadow: '0 24px 48px rgba(0,0,0,0.2)'
						}
					}}
				>
					<DialogTitle sx={{ 
						background: theme.gradients.brand, 
						color: '#ffffff', 
						fontWeight: 800,
						py: 2.5,
						display: 'flex',
						alignItems: 'center',
						gap: 1.5
					}}>
						<CardIcon /> Checkout & Payment Gateway
					</DialogTitle>
					
					<form onSubmit={handlePaymentSubmit}>
						<DialogContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
							<Alert severity="info" sx={{ borderRadius: 2 }}>
								You are upgrading to the <strong>{selectedPlan?.name}</strong>. Total price is calculated based on your team size ({userCount} active users).
							</Alert>

							{/* Order Summary box */}
							<Box sx={{ 
								p: 2.5, 
								borderRadius: 2.5, 
								bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)',
								border: `1px solid ${theme.palette.divider}`
							}}>
								<Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
									Order Summary
								</Typography>
								<Box display="flex" justifyContent="space-between" mb={1}>
									<Typography variant="body2" color="text.secondary">
										{selectedPlan?.name} ({userCount} users @ {formatINR(selectedPlan?.pricePerUser || 0)}/mo)
									</Typography>
									<Typography variant="body2" sx={{ fontWeight: 700 }}>
										{formatINR((selectedPlan?.pricePerUser || 0) * userCount)}
									</Typography>
								</Box>
								<Box display="flex" justifyContent="space-between" mb={1}>
									<Typography variant="body2" color="text.secondary">GST (18%)</Typography>
									<Typography variant="body2" sx={{ fontWeight: 700 }}>
										{formatINR(Math.round((selectedPlan?.pricePerUser || 0) * userCount * 0.18))}
									</Typography>
								</Box>
								<Divider sx={{ my: 1.5 }} />
								<Box display="flex" justifyContent="space-between">
									<Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Total Monthly Cost</Typography>
									<Typography variant="subtitle1" color="primary" sx={{ fontWeight: 800 }}>
										{formatINR(Math.round((selectedPlan?.pricePerUser || 0) * userCount * 1.18))}
									</Typography>
								</Box>
							</Box>

							{/* Card Details form */}
							<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
								<Typography variant="subtitle2" sx={{ fontWeight: 800, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
									Payment Details
								</Typography>
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
										)
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
												if (val.length > 2) {
													val = val.slice(0, 2) + '/' + val.slice(2, 4);
												}
												setCardExpiry(val.slice(0, 5));
											}}
											disabled={processingPayment}
										/>
									</Grid>
									<Grid size={6}>
										<TextField
											required
											fullWidth
											label="CVC / CVV"
											placeholder="123"
											type="password"
											value={cardCvc}
											onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
											disabled={processingPayment}
											InputProps={{
												startAdornment: (
													<InputAdornment position="start">
														<LockIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
													</InputAdornment>
												)
											}}
										/>
									</Grid>
								</Grid>
								<TextField
									required
									fullWidth
									label="Cardholder Name"
									placeholder="John Doe"
									value={cardName}
									onChange={(e) => setCardName(e.target.value)}
									disabled={processingPayment}
								/>
							</Box>

							<Box display="flex" alignItems="center" gap={1} sx={{ mt: 1 }}>
								<LockIcon sx={{ color: 'text.secondary', fontSize: 16 }} />
								<Typography variant="caption" color="text.secondary">
									Payments are secure and encrypted. In production, this integrates with Stripe or Razorpay.
								</Typography>
							</Box>
						</DialogContent>
						<DialogActions sx={{ px: 3, pb: 3, pt: 0, justifyContent: 'space-between' }}>
							<Button 
								variant="text" 
								onClick={() => setPaymentDialogOpen(false)}
								disabled={processingPayment}
								sx={{ textTransform: 'none', fontWeight: 700 }}
							>
								Cancel
							</Button>
							<Button
								type="submit"
								variant="contained"
								color="primary"
								disabled={processingPayment}
								sx={{ 
									textTransform: 'none', 
									fontWeight: 700, 
									px: 3,
									borderRadius: 2.5,
									background: theme.gradients.brand,
									boxShadow: 'none',
									'&:hover': { boxShadow: 'none' }
								}}
								startIcon={processingPayment ? <CircularProgress size={18} color="inherit" /> : <LockIcon />}
							>
								{processingPayment ? 'Processing Payment...' : `Pay & Upgrade`}
							</Button>
						</DialogActions>
					</form>
				</Dialog>
			</Container>
		</Box>
	);
};

export default BillingSettings;
