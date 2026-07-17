import React, { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Card, CardContent, Typography, Box, useTheme, Skeleton, Link, alpha } from '@mui/material';
import { NotificationsActive, ChevronRight, TaskAlt } from '@mui/icons-material';
import orgAdminService from '../../../services/orgAdminService';
import type { Organization } from '../../../models/auth';
import { getTrialDaysLeft } from '../../../utils/trial';

const ATTENTION_WINDOW_DAYS = 7;

export const AttentionQueuePanel: React.FC = () => {
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

	const expiringSoon = (orgs || [])
		.filter((o) => o.subscription_status === 'trial' && o.trial_expires_at)
		.map((o) => ({ org: o, daysLeft: getTrialDaysLeft(o.trial_expires_at) }))
		.filter((o) => o.daysLeft <= ATTENTION_WINDOW_DAYS)
		.sort((a, b) => a.daysLeft - b.daysLeft)
		.slice(0, 5);

	return (
		<Card
			sx={{
				borderRadius: '16px',
				height: '100%',
				background: isDark
					? 'linear-gradient(135deg, rgba(20, 24, 34, 0.75) 0%, rgba(11, 13, 18, 0.9) 100%)'
					: 'linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(248, 250, 252, 0.95) 100%)',
				backdropFilter: 'blur(20px)',
				border: `1px solid ${theme.palette.divider}`,
				boxShadow: isDark ? '0 8px 32px 0 rgba(0, 0, 0, 0.2)' : '0 8px 32px 0 rgba(139, 124, 246, 0.04)',
			}}
		>
			<CardContent sx={{ p: 2.5 }}>
				<Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
					<Box display="flex" alignItems="center" gap={1.5}>
						<NotificationsActive color="warning" sx={{ fontSize: 24 }} />
						<Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '0.02em', color: 'text.primary' }}>
							NEEDS ATTENTION
						</Typography>
					</Box>
					<Link component={RouterLink} to="/organizations" sx={{ display: 'flex', alignItems: 'center', color: 'primary.main', fontWeight: 700, fontSize: '0.8rem', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
						View all <ChevronRight sx={{ fontSize: 16 }} />
					</Link>
				</Box>

				{loading ? (
					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
						{[1, 2, 3].map((n) => <Skeleton key={n} variant="rounded" height={56} sx={{ borderRadius: '10px' }} />)}
					</Box>
				) : expiringSoon.length === 0 ? (
					<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2, gap: 0.75 }}>
						<TaskAlt sx={{ fontSize: 26, color: 'success.main' }} />
						<Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.78rem' }}>No trials expiring in the next {ATTENTION_WINDOW_DAYS} days.</Typography>
					</Box>
				) : (
					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
						{expiringSoon.map(({ org, daysLeft }) => {
							const urgent = daysLeft <= 2;
							const color = urgent ? theme.palette.error.main : theme.palette.warning.main;
							return (
								<Box
									key={org.public_id}
									component={RouterLink}
									to="/organizations"
									sx={{
										display: 'flex', alignItems: 'center', justifyContent: 'space-between',
										p: 1.75, borderRadius: '10px', textDecoration: 'none',
										bgcolor: isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.005)',
										border: `1px solid ${alpha(color, 0.15)}`,
										transition: 'all 0.2s ease',
										'&:hover': { bgcolor: alpha(color, 0.06), borderColor: alpha(color, 0.3) },
									}}
								>
									<Box sx={{ minWidth: 0 }}>
										<Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }} noWrap>
											{org.name}
										</Typography>
										<Typography variant="caption" color="text.secondary">
											{org.plan_name || 'Free'} plan
										</Typography>
									</Box>
									<Box sx={{
										px: 1.25, py: 0.4, borderRadius: '6px', flexShrink: 0, ml: 1.5,
										bgcolor: alpha(color, 0.12), color,
									}}>
										<Typography variant="caption" sx={{ fontWeight: 800 }}>
											{daysLeft < 0 ? 'Expired' : daysLeft === 0 ? 'Today' : `${daysLeft}d left`}
										</Typography>
									</Box>
								</Box>
							);
						})}
					</Box>
				)}
			</CardContent>
		</Card>
	);
};

export default AttentionQueuePanel;
