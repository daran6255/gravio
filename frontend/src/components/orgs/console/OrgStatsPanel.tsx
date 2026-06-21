import React from 'react';
import { Grid, Card, CardContent, Typography, Box, useTheme, alpha } from '@mui/material';
import { Business, CalendarToday, Group, Speed } from '@mui/icons-material';
import type { AdminStats } from '../../../models/admin';

interface OrgStatsPanelProps {
	stats: AdminStats | null;
}

export const OrgStatsPanel: React.FC<OrgStatsPanelProps> = ({ stats }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';

	const statsCards = [
		{
			title: 'TOTAL ORGANIZATIONS',
			value: stats?.total_organizations ?? 0,
			subtitle: 'Total registered tenants',
			icon: <Business sx={{ color: '#8B7CF6', fontSize: 26 }} />,
			color: '#8B7CF6',
			glowColor: 'rgba(139, 124, 246, 0.3)',
			borderColor: isDark ? 'rgba(139, 124, 246, 0.15)' : 'rgba(139, 124, 246, 0.12)',
			iconBg: isDark 
				? 'linear-gradient(135deg, rgba(139, 124, 246, 0.15) 0%, rgba(139, 124, 246, 0.03) 100%)' 
				: 'linear-gradient(135deg, rgba(139, 124, 246, 0.08) 0%, rgba(139, 124, 246, 0.02) 100%)',
			shadowColor: 'rgba(139, 124, 246, 0.2)'
		},
		{
			title: 'ACTIVE TRIALS',
			value: stats?.active_trials ?? 0,
			subtitle: 'Free / Trial orgs with time left',
			icon: <CalendarToday sx={{ color: '#F59E0B', fontSize: 24 }} />,
			color: '#F59E0B',
			glowColor: 'rgba(245, 158, 11, 0.3)',
			borderColor: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.12)',
			iconBg: isDark 
				? 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.03) 100%)' 
				: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(245, 158, 11, 0.02) 100%)',
			shadowColor: 'rgba(245, 158, 11, 0.2)'
		},
		{
			title: 'PLATFORM SEATS',
			value: stats?.total_users ?? 0,
			subtitle: 'Total user accounts',
			icon: <Group sx={{ color: '#10B981', fontSize: 26 }} />,
			color: '#10B981',
			glowColor: 'rgba(16, 185, 129, 0.3)',
			borderColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.12)',
			iconBg: isDark 
				? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.03) 100%)' 
				: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0.02) 100%)',
			shadowColor: 'rgba(16, 185, 129, 0.2)'
		},
		{
			title: 'AVG. SEAT DENSITY',
			value: stats?.avg_users_per_org ?? 0,
			subtitle: 'Average users per tenant',
			icon: <Speed sx={{ color: '#4EA8FF', fontSize: 26 }} />,
			color: '#4EA8FF',
			glowColor: 'rgba(78, 168, 255, 0.3)',
			borderColor: isDark ? 'rgba(78, 168, 255, 0.15)' : 'rgba(78, 168, 255, 0.12)',
			iconBg: isDark 
				? 'linear-gradient(135deg, rgba(78, 168, 255, 0.15) 0%, rgba(78, 168, 255, 0.03) 100%)' 
				: 'linear-gradient(135deg, rgba(78, 168, 255, 0.08) 0%, rgba(78, 168, 255, 0.02) 100%)',
			shadowColor: 'rgba(78, 168, 255, 0.2)'
		}
	];

	return (
		<Grid container spacing={3} sx={{ mb: 4, position: 'relative', zIndex: 1 }}>
			{statsCards.map((card, idx) => (
				<Grid size={{ xs: 12, sm: 6, md: 3 }} key={idx}>
					<Card
						sx={{
							position: 'relative',
							overflow: 'hidden',
							background: isDark 
								? 'linear-gradient(135deg, rgba(20, 24, 34, 0.75) 0%, rgba(11, 13, 18, 0.9) 100%)'
								: 'linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(248, 250, 252, 0.95) 100%)',
							backdropFilter: 'blur(20px)',
							border: `1px solid ${card.borderColor}`,
							borderRadius: '16px',
							boxShadow: isDark
								? '0 8px 32px 0 rgba(0, 0, 0, 0.3), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)'
								: '0 8px 32px 0 rgba(139, 124, 246, 0.05), inset 0 1px 0 0 rgba(255, 255, 255, 0.8)',
							transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
							'&:hover': { 
								transform: 'translateY(-4px)', 
								boxShadow: isDark
									? `0 12px 40px 0 rgba(0, 0, 0, 0.55), 0 0 20px 2px ${alpha(card.color, 0.35)}`
									: `0 12px 40px 0 ${alpha(card.color, 0.15)}, 0 0 20px 0 ${alpha(card.color, 0.08)}`,
								'& .glow-bubble': {
									transform: 'scale(1.2)',
									opacity: 0.25,
								}
							}
						}}
					>
						{/* Glow Bubble inside card for Aurora effect */}
						<Box
							className="glow-bubble"
							sx={{
								position: 'absolute',
								top: -40,
								right: -40,
								width: 140,
								height: 140,
								borderRadius: '50%',
								background: `radial-gradient(circle, ${card.glowColor} 0%, rgba(255,255,255,0) 70%)`,
								filter: 'blur(15px)',
								opacity: 0.18,
								zIndex: 0,
								pointerEvents: 'none',
								transition: 'all 0.4s ease-in-out'
							}}
						/>

						<CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3, position: 'relative', zIndex: 1, '&:last-child': { pb: 3 } }}>
							<Box>
								<Typography 
									variant="caption" 
									sx={{ 
										fontWeight: 700, 
										letterSpacing: '0.08em',
										color: isDark ? 'text.secondary' : 'text.secondary',
										fontSize: '0.72rem',
										textTransform: 'uppercase'
									}}
								>
									{card.title}
								</Typography>
								<Typography variant="h4" sx={{ fontWeight: 800, mt: 1, mb: 0.5, letterSpacing: '-0.03em', color: 'text.primary' }}>
									{card.value}
								</Typography>
								<Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.78rem', display: 'block', mt: 0.25 }}>
									{card.subtitle}
								</Typography>
							</Box>

							<Box 
								sx={{ 
									p: 1.75, 
									borderRadius: '14px', 
									background: card.iconBg,
									border: `1px solid ${alpha(card.glowColor, 0.15)}`,
									display: 'flex', 
									alignItems: 'center', 
									justifyContent: 'center', 
									boxShadow: `0 4px 12px ${alpha(card.shadowColor, 0.15)}`,
									transition: 'transform 0.3s ease'
								}}
							>
								{card.icon}
							</Box>
						</CardContent>
					</Card>
				</Grid>
			))}
		</Grid>
	);
};

export default OrgStatsPanel;
