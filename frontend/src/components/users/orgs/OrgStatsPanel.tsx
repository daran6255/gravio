import React from 'react';
import { Grid, Card, CardContent, Typography, Box } from '@mui/material';
import { Business, CalendarToday, Group, Speed } from '@mui/icons-material';
import type { AdminStats } from '../../../models/admin';

interface OrgStatsPanelProps {
	stats: AdminStats | null;
}

export const OrgStatsPanel: React.FC<OrgStatsPanelProps> = ({ stats }) => {
	const statsCards = [
		{
			title: 'TOTAL ORGANIZATIONS',
			value: stats?.total_organizations ?? 0,
			subtitle: 'Total registered tenants',
			icon: <Business color="primary" sx={{ fontSize: 24 }} />,
			bg: 'linear-gradient(135deg, rgba(99, 102, 241, 0.03) 0%, rgba(168, 85, 247, 0.03) 100%)',
			border: '1px solid rgba(99, 102, 241, 0.12)'
		},
		{
			title: 'ACTIVE TRIALS',
			value: stats?.active_trials ?? 0,
			subtitle: 'Free / Trial orgs with time left',
			icon: <CalendarToday color="warning" sx={{ fontSize: 24 }} />,
			bg: 'linear-gradient(135deg, rgba(245, 158, 11, 0.03) 0%, rgba(251, 191, 36, 0.03) 100%)',
			border: '1px solid rgba(245, 158, 11, 0.12)'
		},
		{
			title: 'PLATFORM SEATS',
			value: stats?.total_users ?? 0,
			subtitle: 'Total user accounts',
			icon: <Group color="success" sx={{ fontSize: 24 }} />,
			bg: 'linear-gradient(135deg, rgba(16, 185, 129, 0.03) 0%, rgba(5, 150, 105, 0.03) 100%)',
			border: '1px solid rgba(16, 185, 129, 0.12)'
		},
		{
			title: 'AVG. SEAT DENSITY',
			value: stats?.avg_users_per_org ?? 0,
			subtitle: 'Average users per tenant',
			icon: <Speed color="info" sx={{ fontSize: 24 }} />,
			bg: 'linear-gradient(135deg, rgba(59, 130, 246, 0.03) 0%, rgba(29, 78, 216, 0.03) 100%)',
			border: '1px solid rgba(59, 130, 246, 0.12)'
		}
	];

	return (
		<Grid container spacing={3} sx={{ mb: 4 }}>
			{statsCards.map((card, idx) => (
				<Grid size={{ xs: 12, sm: 6, md: 3 }} key={idx}>
					<Card
						sx={{
							background: card.bg,
							border: card.border,
							boxShadow: '0 4px 20px 0 rgba(0,0,0,0.01)',
							borderRadius: 4,
							transition: 'transform 0.2s, box-shadow 0.2s',
							'&:hover': {
								transform: 'translateY(-2px)',
								boxShadow: '0 12px 30px 0 rgba(0,0,0,0.04)',
							}
						}}
					>
						<CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3, '&:last-child': { pb: 3 } }}>
							<Box>
								<Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1.1 }}>
									{card.title}
								</Typography>
								<Typography variant="h4" sx={{ fontWeight: 700, mt: 1, mb: 0.5 }}>
									{card.value}
								</Typography>
								<Typography variant="caption" color="text.secondary">
									{card.subtitle}
								</Typography>
							</Box>
							<Box sx={{ p: 1.5, borderRadius: 3, bgcolor: 'background.paper', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
								{card.icon}
							</Box>
						</CardContent>
					</Card>
				</Grid>
			))}
		</Grid>
	);
};
