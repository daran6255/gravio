import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Box, useTheme, Grid, Skeleton, alpha } from '@mui/material';
import { CloudQueue, CheckCircle, WarningAmber, ErrorOutline } from '@mui/icons-material';
import orgAdminService from '../../services/orgAdminService';
import type { SystemHealth, SystemMetric } from '../../models/admin';

const statusMeta: Record<SystemMetric['status'], { label: string; color: string; icon: React.ReactElement }> = {
	operational: { label: 'Operational', color: '#10B981', icon: <CheckCircle sx={{ fontSize: 13 }} /> },
	degraded: { label: 'Degraded', color: '#F59E0B', icon: <WarningAmber sx={{ fontSize: 13 }} /> },
	down: { label: 'Down', color: '#EF4444', icon: <ErrorOutline sx={{ fontSize: 13 }} /> },
};

export const InfraHealthPanel: React.FC = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const [health, setHealth] = useState<SystemHealth | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;
		orgAdminService.getSystemHealth()
			.then((data) => { if (!cancelled) setHealth(data); })
			.catch(() => { if (!cancelled) setHealth(null); })
			.finally(() => { if (!cancelled) setLoading(false); });
		return () => { cancelled = true; };
	}, []);

	return (
		<Card
			sx={{
				position: 'relative',
				overflow: 'hidden',
				borderRadius: '16px',
				background: theme.gradients.card,
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
			<CardContent sx={{ p: 2.5 }}>
				<Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
					<Box display="flex" alignItems="center" gap={1.25}>
						<CloudQueue color="primary" sx={{ fontSize: 20 }} />
						<Typography variant="subtitle2" sx={{ fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '0.78rem', color: 'text.primary' }}>
							Infrastructure Health
						</Typography>
					</Box>
					{health && (
						<Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
							v{health.version} · {health.environment}
						</Typography>
					)}
				</Box>

				<Grid container spacing={1.5}>
					{loading ? (
						[1, 2, 3].map((n) => (
							<Grid size={12} key={n}>
								<Skeleton variant="rounded" height={52} sx={{ borderRadius: '12px' }} />
							</Grid>
						))
					) : !health ? (
						<Grid size={12}>
							<Typography variant="body2" color="text.secondary">
								Couldn't reach the health endpoint — the API may be unreachable.
							</Typography>
						</Grid>
					) : (
						health.metrics.map((service) => {
							const meta = statusMeta[service.status];
							return (
								<Grid size={12} key={service.name}>
									<Box
										sx={{
											p: 1.5,
											borderRadius: '12px',
											bgcolor: isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.005)',
											border: `1px solid ${theme.palette.divider}`,
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'space-between',
											transition: 'all 0.2s ease',
											'&:hover': {
												bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(139,124,246,0.02)',
												borderColor: 'primary.light'
											}
										}}
									>
										<Box sx={{ minWidth: 0, mr: 1.5 }}>
											<Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.78rem' }} noWrap>
												{service.name}
											</Typography>
											<Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.66rem', display: 'block' }} noWrap>
												{service.detail || '—'}
											</Typography>
										</Box>
										
										<Box
											sx={{
												display: 'inline-flex',
												alignItems: 'center',
												gap: 0.5,
												px: 1,
												py: 0.25,
												borderRadius: '4px',
												bgcolor: alpha(meta.color, 0.1),
												border: `1px solid ${alpha(meta.color, 0.2)}`,
												color: meta.color,
												flexShrink: 0
											}}
										>
											{meta.icon}
											<Typography variant="caption" sx={{ fontWeight: 800, color: meta.color, fontSize: '0.58rem' }}>
												{meta.label.toUpperCase()}
											</Typography>
										</Box>
									</Box>
								</Grid>
							);
						})
					)}
				</Grid>
			</CardContent>
		</Card>
	);
};

export default InfraHealthPanel;
