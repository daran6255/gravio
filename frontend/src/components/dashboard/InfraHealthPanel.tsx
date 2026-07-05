import React from 'react';
import { Card, CardContent, Typography, Box, useTheme, Grid } from '@mui/material';
import { CloudQueue } from '@mui/icons-material';

export const InfraHealthPanel: React.FC = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';

	const healthServices = [
		{ name: 'Core PostgreSQL Database', status: 'Healthy', latency: '4ms latency', desc: 'Main transactional data store connection' },
		{ name: 'SMTP Transporter', status: 'Operational', latency: '12ms response', desc: 'Platform outgoing email server status' },
		{ name: 'Redis Task Queue', status: 'Idle', latency: '0 pending jobs', desc: 'Asynchronous event worker and scheduler' },
	];

	return (
		<Card
			sx={{
				position: 'relative',
				overflow: 'hidden',
				borderRadius: '16px',
				background: isDark 
					? 'linear-gradient(135deg, rgba(20, 24, 34, 0.75) 0%, rgba(11, 13, 18, 0.9) 100%)'
					: 'linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(248, 250, 252, 0.95) 100%)',
				backdropFilter: 'blur(20px)',
				border: `1px solid ${theme.palette.divider}`,
				boxShadow: isDark
					? '0 8px 32px 0 rgba(0, 0, 0, 0.2)'
					: '0 8px 32px 0 rgba(139, 124, 246, 0.04)',
				transition: 'transform 0.3s ease, box-shadow 0.3s ease',
				'&:hover': {
					transform: 'translateY(-2px)',
					boxShadow: isDark
						? '0 12px 40px 0 rgba(0, 0, 0, 0.35)'
						: '0 12px 40px 0 rgba(139, 124, 246, 0.08)',
				}
			}}
		>
			<CardContent sx={{ p: 4 }}>
				<Box display="flex" alignItems="center" gap={1.5} sx={{ mb: 3 }}>
					<CloudQueue color="primary" sx={{ fontSize: 24 }} />
					<Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '0.02em', color: 'text.primary' }}>
						INFRASTRUCTURE SERVICES HEALTH
					</Typography>
				</Box>

				<Grid container spacing={{ xs: 2, md: 3 }}>
					{healthServices.map((service) => (
						<Grid size={{ xs: 12, sm: 6, md: 4 }} key={service.name}>
							<Box 
								sx={{ 
									p: 2.5, 
									borderRadius: '12px',
									bgcolor: isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.005)',
									border: `1px solid ${isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'}`,
									height: '100%',
									display: 'flex',
									flexDirection: 'column',
									justifyContent: 'space-between',
									transition: 'all 0.2s ease',
									'&:hover': {
										bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(139,124,246,0.02)',
										borderColor: 'primary.light'
									}
								}}
							>
								<Box>
									<Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
										<Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
											{service.name}
										</Typography>
										
										<Box 
											sx={{ 
												display: 'inline-flex', 
												alignItems: 'center', 
												gap: 0.75, 
												px: 1, 
												py: 0.25, 
												borderRadius: '4px', 
												bgcolor: 'rgba(16, 185, 129, 0.1)',
												border: '1px solid rgba(16, 185, 129, 0.2)'
											}}
										>
											<Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#10B981', boxShadow: '0 0 6px #10B981' }} />
											<Typography variant="caption" sx={{ fontWeight: 800, color: '#10B981', fontSize: '0.62rem' }}>
												{service.status.toUpperCase()}
											</Typography>
										</Box>
									</Box>
									<Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
										{service.desc}
									</Typography>
								</Box>

								<Box sx={{ borderTop: `1px solid ${theme.palette.divider}`, pt: 1.5, mt: 'auto' }}>
									<Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
										{service.latency}
									</Typography>
								</Box>
							</Box>
						</Grid>
					))}
				</Grid>
			</CardContent>
		</Card>
	);
};

export default InfraHealthPanel;
