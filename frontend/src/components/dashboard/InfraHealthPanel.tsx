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

				<Grid container spacing={2}>
					{loading ? (
						[1, 2, 3].map((n) => (
							<Grid size={{ xs: 12, sm: 6, md: 4 }} key={n}>
								<Skeleton variant="rounded" height={104} sx={{ borderRadius: '12px' }} />
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
								<Grid size={{ xs: 12, sm: 6, md: 4 }} key={service.name}>
									<Box
										sx={{
											p: 2,
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
														bgcolor: alpha(meta.color, 0.1),
														border: `1px solid ${alpha(meta.color, 0.2)}`,
														color: meta.color,
													}}
												>
													{meta.icon}
													<Typography variant="caption" sx={{ fontWeight: 800, color: meta.color, fontSize: '0.62rem' }}>
														{meta.label.toUpperCase()}
													</Typography>
												</Box>
											</Box>
											<Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
												{service.detail || '—'}
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
