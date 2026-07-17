import React from 'react';
import { Card, CardContent, Typography, Box, useTheme, alpha, Avatar, Chip, LinearProgress, Button } from '@mui/material';
import { CreditCard as BillingIcon, People as PeopleIcon, Stars as PlanIcon } from '@mui/icons-material';
import { useAppSelector } from '../../../../store/hooks';
import { useNavigate } from 'react-router-dom';

export const OrgSummaryCard: React.FC = () => {
	const theme = useTheme();
	const navigate = useNavigate();
	const isDark = theme.palette.mode === 'dark';

	const { user } = useAppSelector((state) => state.auth);
	const { total } = useAppSelector((state) => state.users);

	const org = user?.organization;
	if (!org) return null;

	const planName = org.plan_name || 'Free Trial';
	const userLimit = org.user_limit || 0;
	const subscriptionStatus = org.subscription_status || 'active';
	const trialExpiresAt = org.trial_expires_at;

	// Calculate seat utilization
	const currentSeats = total || 0;
	const seatPercentage = userLimit > 0 ? Math.min(100, (currentSeats / userLimit) * 100) : 0;

	// Determine if trial has been extended and by how much
	const trialDetails = React.useMemo(() => {
		if (!org.trial_started_at || !org.trial_expires_at) {
			return { isExtended: false, durationDays: 0, extendedDays: 0 };
		}
		const started = new Date(org.trial_started_at);
		const expires = new Date(org.trial_expires_at);
		const diffTime = expires.getTime() - started.getTime();
		const durationDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
		const extendedDays = Math.max(0, durationDays - 30);
		return {
			isExtended: durationDays > 30,
			durationDays,
			extendedDays
		};
	}, [org.trial_started_at, org.trial_expires_at]);

	// Premium aesthetic colors
	const primaryColor = theme.palette.primary.main;
	const statusColor = subscriptionStatus === 'active' ? theme.palette.success.main : theme.palette.warning.main;
	const statusBg = alpha(statusColor, 0.15);

	const handleManageBilling = () => {
		navigate('/billing');
	};

	return (
		<Card
			sx={{
				height: 'auto',
				minHeight: 'fit-content',
				position: 'relative',
				overflow: 'hidden',
				borderRadius: '16px',
				background: isDark 
					? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.75)} 0%, ${alpha(theme.palette.background.default, 0.9)} 100%)`
					: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.85)} 0%, ${alpha(theme.palette.background.default, 0.95)} 100%)`,
				backdropFilter: 'blur(20px)',
				border: `1px solid ${theme.palette.divider}`,
				boxShadow: isDark
					? '0 8px 32px 0 rgba(0, 0, 0, 0.25), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)'
					: `0 8px 32px 0 ${alpha(primaryColor, 0.04)}, inset 0 1px 0 0 rgba(255, 255, 255, 0.8)`,
				display: 'flex',
				flexDirection: 'column',
				transition: 'transform 0.3s ease, box-shadow 0.3s ease',
				'&:hover': {
					transform: 'translateY(-2px)',
					boxShadow: isDark
						? '0 12px 40px 0 rgba(0, 0, 0, 0.35)'
						: `0 12px 40px 0 ${alpha(primaryColor, 0.08)}`,
				}
			}}
		>
			<CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%', gap: 3 }}>
				{/* Org identity section */}
				<Box display="flex" alignItems="center" gap={2}>
					<Avatar
						sx={{
							bgcolor: alpha(primaryColor, 0.1),
							color: primaryColor,
							border: `1px solid ${alpha(primaryColor, 0.2)}`,
							width: 44,
							height: 44,
							fontWeight: 700,
						}}
					>
						{org.name.charAt(0).toUpperCase()}
					</Avatar>
					<Box>
						<Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.2 }}>
							{org.name}
						</Typography>
						{org.location && (
							<Typography variant="caption" color="text.secondary">
								{org.location}
							</Typography>
						)}
					</Box>
				</Box>

				{/* Plan and Status row */}
				<Box display="flex" justifyContent="space-between" alignItems="center" sx={{ bgcolor: isDark ? alpha(theme.palette.common.white, 0.02) : alpha(theme.palette.common.black, 0.015), p: 2, borderRadius: '12px', border: `1px solid ${theme.palette.divider}` }}>
					<Box display="flex" alignItems="center" gap={1}>
						<PlanIcon sx={{ color: primaryColor, fontSize: 18 }} />
						<Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
							{planName.toUpperCase()}
						</Typography>
					</Box>
					<Chip
						label={subscriptionStatus.toUpperCase()}
						size="small"
						sx={{
							fontWeight: 800,
							fontSize: '0.62rem',
							height: 20,
							bgcolor: statusBg,
							color: statusColor,
							border: `1px solid ${alpha(statusColor, 0.3)}`,
						}}
					/>
				</Box>

				{/* Seat Usage metrics */}
				<Box>
					<Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
						<Box display="flex" alignItems="center" gap={0.75}>
							<PeopleIcon sx={{ color: 'text.secondary', fontSize: 16 }} />
							<Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
								SEAT USAGE
							</Typography>
						</Box>
						<Typography variant="caption" sx={{ fontWeight: 800, color: 'text.primary' }}>
							{currentSeats} / {userLimit > 0 ? userLimit : '∞'}
						</Typography>
					</Box>
					{userLimit > 0 ? (
						<Box sx={{ width: '100%', mr: 1 }}>
							<LinearProgress
								variant="determinate"
								value={seatPercentage}
								sx={{
									height: 8,
									borderRadius: 4,
									bgcolor: isDark ? alpha(theme.palette.common.white, 0.05) : alpha(theme.palette.common.black, 0.05),
									'& .MuiLinearProgress-bar': {
										borderRadius: 4,
										background: `linear-gradient(90deg, ${primaryColor} 0%, ${alpha(primaryColor, 0.8)} 100%)`
									}
								}}
							/>
						</Box>
					) : (
						<Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', fontStyle: 'italic' }}>
							Unlimited seats available on your custom plan.
						</Typography>
					)}
					{userLimit > 0 && seatPercentage >= 90 && (
						<Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.75, fontWeight: 600 }}>
							Warning: Almost out of teammate seats!
						</Typography>
					)}
				</Box>

				{/* Subscription trial info or tips */}
				<Box sx={{ mt: 'auto' }}>
					{trialExpiresAt && subscriptionStatus === 'trial' ? (
						<Box>
							{trialDetails.isExtended && (
								<Chip
									label={`Trial Extended (+${trialDetails.extendedDays}d)`}
									size="small"
									sx={{
										mb: 1,
										fontWeight: 800,
										fontSize: '0.62rem',
										height: 20,
										textTransform: 'uppercase',
										bgcolor: alpha(theme.palette.info.main, 0.15),
										color: theme.palette.info.main,
										border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`,
									}}
								/>
							)}
							<Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
								Trial active. Expires on{' '}
								<Box component="span" sx={{ fontWeight: 700, color: 'text.primary' }}>
									{new Date(trialExpiresAt).toLocaleDateString()}
								</Box>
							</Typography>
							{trialDetails.isExtended && (
								<Box
									sx={{
										mb: 2,
										p: 1.25,
										borderRadius: '8px',
										bgcolor: isDark ? alpha(theme.palette.info.main, 0.05) : alpha(theme.palette.info.main, 0.03),
										border: `1px solid ${alpha(theme.palette.info.main, 0.15)}`
									}}
								>
									<Typography variant="caption" sx={{ color: 'info.main', fontWeight: 700, display: 'block', mb: 0.25 }}>
										Extension Details:
									</Typography>
									<Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.72rem' }}>
										• Standard trial: 30 days
									</Typography>
									<Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.72rem' }}>
										• Extended by: {trialDetails.extendedDays} days
									</Typography>
									<Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.72rem' }}>
										• Total trial: {trialDetails.durationDays} days
									</Typography>
								</Box>
							)}
						</Box>
					) : (
						<Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2, fontSize: '0.75rem', lineHeight: 1.4 }}>
							Tip: Admins can manage teammate roles, deactivate users, or delete invitations at any time.
						</Typography>
					)}

					<Button
						variant="outlined"
						size="small"
						fullWidth
						startIcon={<BillingIcon />}
						onClick={handleManageBilling}
						sx={{
							textTransform: 'none',
							fontWeight: 700,
							borderRadius: 2.5,
							borderColor: theme.palette.divider,
							color: 'text.primary',
							'&:hover': {
								borderColor: primaryColor,
								bgcolor: alpha(primaryColor, 0.04),
							}
						}}
					>
						Manage Plan & Billing
					</Button>
				</Box>
			</CardContent>
		</Card>
	);
};

export default OrgSummaryCard;
