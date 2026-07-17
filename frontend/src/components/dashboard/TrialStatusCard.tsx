import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Card, CardContent, Typography, Box, useTheme, CircularProgress, Button, alpha } from '@mui/material';
import { WorkspacePremiumOutlined, ArrowForward } from '@mui/icons-material';
import { useAppSelector } from '../../store/hooks';
import { getTrialDaysLeft } from '../../utils/trial';

export const TrialStatusCard: React.FC = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const org = useAppSelector((state) => state.auth.user?.organization);

	if (!org) return null;

	const isTrial = org.subscription_status === 'trial';
	const daysLeft = getTrialDaysLeft(org.trial_expires_at);
	const totalDays = org.trial_started_at && org.trial_expires_at
		? Math.max(1, Math.round((new Date(org.trial_expires_at).getTime() - new Date(org.trial_started_at).getTime()) / 86400000))
		: 30;
	const percentLeft = isTrial ? Math.max(0, Math.min(100, (daysLeft / totalDays) * 100)) : 100;
	const urgent = isTrial && daysLeft <= 5;
	const expired = isTrial && daysLeft < 0;
	const color = expired ? theme.palette.error.main : urgent ? theme.palette.warning.main : theme.palette.primary.main;

	return (
		<Card
			sx={{
				borderRadius: '16px',
				height: '100%',
				position: 'relative',
				overflow: 'hidden',
				background: isDark
					? `linear-gradient(135deg, ${alpha(color, 0.1)} 0%, rgba(11, 13, 18, 0.9) 100%)`
					: `linear-gradient(135deg, ${alpha(color, 0.05)} 0%, rgba(248, 250, 252, 0.95) 100%)`,
				backdropFilter: 'blur(20px)',
				border: `1px solid ${theme.palette.divider}`,
				boxShadow: isDark ? '0 8px 32px 0 rgba(0, 0, 0, 0.2)' : '0 8px 32px 0 rgba(139, 124, 246, 0.04)',
			}}
		>
			<CardContent sx={{ p: 2.5, display: 'flex', flexDirection: 'column', height: '100%' }}>
				<Box display="flex" alignItems="center" gap={1.25} sx={{ mb: 2 }}>
					<WorkspacePremiumOutlined sx={{ fontSize: 20, color }} />
					<Typography variant="subtitle2" sx={{ fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '0.78rem', color: 'text.primary' }}>
						{isTrial ? 'Free Trial' : 'Subscription'}
					</Typography>
				</Box>

				<Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 2.5 }}>
					<Box sx={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
						<CircularProgress
							variant="determinate"
							value={100}
							size={84}
							thickness={4}
							sx={{ color: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', position: 'absolute' }}
						/>
						<CircularProgress
							variant="determinate"
							value={percentLeft}
							size={84}
							thickness={4}
							sx={{ color, '& .MuiCircularProgress-circle': { strokeLinecap: 'round' } }}
						/>
						<Box sx={{
							position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
							alignItems: 'center', justifyContent: 'center',
						}}>
							<Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1 }}>
								{isTrial ? (expired ? '0' : daysLeft) : '∞'}
							</Typography>
							<Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.6rem', fontWeight: 700 }}>
								{isTrial ? 'DAYS LEFT' : 'ACTIVE'}
							</Typography>
						</Box>
					</Box>

					<Box sx={{ minWidth: 0 }}>
						<Typography variant="body1" sx={{ fontWeight: 700, color: 'text.primary' }}>
							{org.plan_name || 'Free'} Plan
						</Typography>
						<Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
							{isTrial
								? expired
									? 'Your trial has ended.'
									: `Trial ends ${org.trial_expires_at ? new Date(org.trial_expires_at).toLocaleDateString() : ''}.`
								: 'Thanks for being a subscriber.'}
						</Typography>
						<Button
							component={RouterLink}
							to="/billing"
							size="small"
							variant={urgent || expired ? 'contained' : 'outlined'}
							endIcon={<ArrowForward sx={{ fontSize: 16 }} />}
							sx={{
								textTransform: 'none', fontWeight: 700, borderRadius: '10px',
								...(urgent || expired ? {
									background: theme.gradients.brandDiagonal, color: '#fff',
									'&:hover': { background: theme.gradients.brandDiagonalHover },
								} : {}),
							}}
						>
							{isTrial ? 'Upgrade Plan' : 'Manage Billing'}
						</Button>
					</Box>
				</Box>
			</CardContent>
		</Card>
	);
};

export default TrialStatusCard;
