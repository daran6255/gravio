import { Card, CardContent, Typography, Box, useTheme, Avatar, alpha } from '@mui/material';
import { Speed, CheckCircle, Block, HourglassEmpty, People } from '@mui/icons-material';
import type { AdminStats } from '../../../../models/admin';

interface TenantDistributionProps {
	stats: AdminStats | null;
}

export const TenantDistribution: React.FC<TenantDistributionProps> = ({ stats }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';

	const totalOrgs = stats?.total_organizations ?? 0;
	const activeTrials = stats?.active_trials ?? 0;
	const expiredTrials = stats?.expired_trials ?? 0;
	const inactiveOrgs = stats?.inactive_organizations ?? 0;
	const paidUsers = stats?.paid_users ?? 0;
	const paidOrgs = stats?.paid_organizations ?? 0;

	// Helper for computing percentage safely
	const getPercentage = (value: number) => {
		if (totalOrgs === 0) return 0;
		return Math.round((value / totalOrgs) * 100);
	};

	const distributionItems = [
		{
			label: 'Paid Organizations',
			count: paidOrgs,
			percentage: getPercentage(paidOrgs),
			color: theme.palette.primary.main,
			icon: <CheckCircle sx={{ color: theme.palette.primary.main, fontSize: 16 }} />,
			desc: 'Tenants active on paid subscription tiers'
		},
		{
			label: 'Active Free Trials',
			count: activeTrials,
			percentage: getPercentage(activeTrials),
			color: theme.palette.warning.main,
			icon: <HourglassEmpty sx={{ color: theme.palette.warning.main, fontSize: 16 }} />,
			desc: 'Free trial instances with time remaining'
		},
		{
			label: 'Trial Completed Orgs',
			count: expiredTrials,
			percentage: getPercentage(expiredTrials),
			color: theme.palette.error.main,
			icon: <Block sx={{ color: theme.palette.error.main, fontSize: 16 }} />,
			desc: 'Trials expired but not yet subscribed'
		},
		{
			label: 'Inactive Organizations',
			count: inactiveOrgs,
			percentage: getPercentage(inactiveOrgs),
			color: theme.palette.text.secondary,
			icon: <Block sx={{ color: theme.palette.text.secondary, fontSize: 16 }} />,
			desc: 'Manually deactivated tenant environments'
		}
	];

	return (
		<Card
			sx={{
				borderRadius: '16px',
				background: isDark 
					? `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.75)} 0%, ${alpha(theme.palette.background.default, 0.9)} 100%)`
					: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.85)} 0%, ${alpha(theme.palette.background.default, 0.95)} 100%)`,
				backdropFilter: 'blur(20px)',
				border: `1px solid ${theme.palette.divider}`,
				boxShadow: isDark
					? '0 8px 32px 0 rgba(0, 0, 0, 0.2)'
					: `0 8px 32px 0 ${alpha(theme.palette.primary.main, 0.04)}`,
				transition: 'transform 0.3s ease',
				'&:hover': {
					transform: 'translateY(-2px)'
				}
			}}
		>
			<CardContent sx={{ p: 3 }}>
				{/* Header Section */}
				<Box display="flex" alignItems="center" gap={1.25} sx={{ mb: 3 }}>
					<Speed color="primary" sx={{ fontSize: 22 }} />
					<Typography variant="subtitle2" sx={{ fontWeight: 800, letterSpacing: '0.04em', color: 'text.primary' }}>
						TENANT DISTRIBUTION
					</Typography>
				</Box>

				{/* High-level Paid Seats Banner */}
				<Box 
					sx={{ 
						mb: 3, 
						p: 2, 
						borderRadius: '12px', 
						background: isDark 
							? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.12)} 0%, ${alpha(theme.palette.info.main, 0.03)} 100%)`
							: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.06)} 0%, ${alpha(theme.palette.info.main, 0.02)} 100%)`,
						border: `1px solid ${isDark ? alpha(theme.palette.primary.main, 0.18) : alpha(theme.palette.primary.main, 0.12)}`,
						display: 'flex',
						alignItems: 'center',
						gap: 2
					}}
				>
					<Avatar 
						sx={{ 
							bgcolor: alpha(theme.palette.primary.main, 0.15), 
							color: theme.palette.primary.main, 
							width: 38, 
							height: 38,
							boxShadow: `0 4px 10px ${alpha(theme.palette.primary.main, 0.1)}`
						}}
					>
						<People sx={{ fontSize: 20 }} />
					</Avatar>
					<Box>
						<Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
							Paid Tier Seat Volume
						</Typography>
						<Typography variant="body1" sx={{ fontWeight: 800, color: 'text.primary', mt: 0.25 }}>
							{paidUsers} Users
						</Typography>
					</Box>
				</Box>

				{/* Detailed Distribution Items List */}
				<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
					{distributionItems.map((item) => (
						<Box key={item.label}>
							<Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 0.75 }}>
								<Box display="flex" alignItems="center" gap={1}>
									<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
										{item.icon}
									</Box>
									<Box>
										<Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.82rem' }}>
											{item.label}
										</Typography>
										<Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', lg: 'block' }, fontSize: '0.7rem' }}>
											{item.desc}
										</Typography>
									</Box>
								</Box>
								<Box textAlign="right">
									<Typography variant="body2" sx={{ fontWeight: 800, color: 'text.primary', fontSize: '0.82rem' }}>
										{item.count} org{item.count === 1 ? '' : 's'}
									</Typography>
									<Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', fontWeight: 600 }}>
										{item.percentage}%
									</Typography>
								</Box>
							</Box>
							
							{/* Glowing Progress bar */}
							<Box sx={{ width: '100%', height: 6, bgcolor: isDark ? alpha(theme.palette.common.white, 0.06) : alpha(theme.palette.common.black, 0.03), borderRadius: 3, overflow: 'hidden' }}>
								<Box 
									sx={{ 
										width: `${item.percentage}%`, 
										height: '100%', 
										bgcolor: item.color, 
										borderRadius: 3,
										boxShadow: `0 0 6px ${alpha(item.color, 0.5)}`,
										transition: 'width 0.4s ease-in-out'
									}} 
								/>
							</Box>
						</Box>
					))}
				</Box>
			</CardContent>
		</Card>
	);
};

export default TenantDistribution;
