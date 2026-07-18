import React, { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
	Card, CardContent, Typography, Box, useTheme, Skeleton, alpha, Link, LinearProgress
} from '@mui/material';
import { PeopleAlt, ChevronRight, WarningAmber } from '@mui/icons-material';
import orgAdminService from '../../../services/orgAdminService';
import type { Organization } from '../../../models/auth';

export const OrgSeatUsagePanel: React.FC = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const [orgs, setOrgs] = useState<Organization[] | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;
		orgAdminService.listOrganizations(1, 50)
			.then((res) => { if (!cancelled) setOrgs(res.items); })
			.catch(() => { if (!cancelled) setOrgs(null); })
			.finally(() => { if (!cancelled) setLoading(false); });
		return () => { cancelled = true; };
	}, []);

	// Orgs with a known user limit and at least 50% filled
	const atRisk = (orgs || [])
		.filter((o) => {
			const limit = o.user_limit ?? o.plan?.user_limit;
			const count = o.user_count ?? 0;
			return limit && limit > 0 && count / limit >= 0.5;
		})
		.map((o) => {
			const limit = (o.user_limit ?? o.plan?.user_limit ?? 1) as number;
			const count = o.user_count ?? 0;
			const pct = Math.min(Math.round((count / limit) * 100), 100);
			return { org: o, count, limit, pct };
		})
		.sort((a, b) => b.pct - a.pct)
		.slice(0, 6);

	const cardBg = isDark
		? 'linear-gradient(135deg, rgba(20, 24, 34, 0.75) 0%, rgba(11, 13, 18, 0.9) 100%)'
		: 'linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(248, 250, 252, 0.95) 100%)';

	return (
		<Card sx={{
			borderRadius: '16px',
			border: `1px solid ${theme.palette.divider}`,
			boxShadow: isDark ? '0 8px 32px 0 rgba(0, 0, 0, 0.2)' : '0 8px 32px 0 rgba(139, 124, 246, 0.04)',
			height: '100%',
			background: cardBg,
			backdropFilter: 'blur(20px)',
		}}>
			<CardContent sx={{ p: 2.5 }}>
				<Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
					<Box display="flex" alignItems="center" gap={1.25}>
						<PeopleAlt color="primary" sx={{ fontSize: 20 }} />
						<Typography variant="subtitle2" sx={{ fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '0.78rem', color: 'text.primary' }}>
							Seat Usage Monitor
						</Typography>
					</Box>
					<Link
						component={RouterLink}
						to="/organizations"
						sx={{
							display: 'flex', alignItems: 'center', fontSize: '0.75rem',
							fontWeight: 700, color: 'primary.main', textDecoration: 'none',
							'&:hover': { textDecoration: 'underline' }
						}}
					>
						View all <ChevronRight sx={{ fontSize: 15 }} />
					</Link>
				</Box>

				{loading ? (
					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
						{[1, 2, 3, 4].map((n) => <Skeleton key={n} variant="rounded" height={52} sx={{ borderRadius: 2 }} />)}
					</Box>
				) : atRisk.length === 0 ? (
					<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4, gap: 1 }}>
						<PeopleAlt sx={{ fontSize: 32, color: 'success.main' }} />
						<Typography variant="body2" color="text.secondary">All orgs are within healthy seat limits.</Typography>
					</Box>
				) : (
					<Box
						sx={{
							display: 'flex',
							flexDirection: 'column',
							gap: 1.5,
							maxHeight: '400px',
							overflowY: 'auto',
							pr: 1,
							'&::-webkit-scrollbar': { width: '6px' },
							'&::-webkit-scrollbar-track': { background: 'transparent' },
							'&::-webkit-scrollbar-thumb': {
								background: theme.palette.divider,
								borderRadius: '4px',
							},
							'&::-webkit-scrollbar-thumb:hover': {
								background: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
							},
						}}
					>
						{atRisk.map(({ org, count, limit, pct }) => {
							const isCritical = pct >= 90;
							const isWarning = pct >= 70 && pct < 90;
							const color = isCritical
								? theme.palette.error.main
								: isWarning
									? theme.palette.warning.main
									: theme.palette.info.main;

							return (
								<Box
									key={org.public_id}
									component={RouterLink}
									to="/organizations"
									sx={{
										p: 1.5, borderRadius: 2,
										border: `1px solid ${alpha(color, 0.2)}`,
										bgcolor: isDark ? alpha('#fff', 0.02) : alpha(color, 0.02),
										textDecoration: 'none',
										transition: 'all 0.2s ease',
										'&:hover': { bgcolor: alpha(color, 0.06), borderColor: alpha(color, 0.35) }
									}}
								>
									<Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 0.75 }}>
										<Box display="flex" alignItems="center" gap={0.75}>
											{isCritical && <WarningAmber sx={{ fontSize: 14, color }} />}
											<Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.8rem' }} noWrap>
												{org.name}
											</Typography>
										</Box>
										<Typography variant="caption" sx={{ fontWeight: 800, color, fontSize: '0.72rem', flexShrink: 0, ml: 1 }}>
											{count}/{limit} seats
										</Typography>
									</Box>
									<Box sx={{ position: 'relative' }}>
										<LinearProgress
											variant="determinate"
											value={pct}
											sx={{
												height: 6, borderRadius: 3,
												bgcolor: isDark ? alpha('#fff', 0.06) : alpha('#000', 0.05),
												'& .MuiLinearProgress-bar': {
													bgcolor: color,
													borderRadius: 3,
													boxShadow: `0 0 6px ${alpha(color, 0.4)}`
												}
											}}
										/>
									</Box>
									<Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', mt: 0.5, display: 'block' }}>
										{pct}% capacity used · {org.plan_name || 'Free'}
									</Typography>
								</Box>
							);
						})}
					</Box>
				)}
			</CardContent>
		</Card>
	);
};

export default OrgSeatUsagePanel;
