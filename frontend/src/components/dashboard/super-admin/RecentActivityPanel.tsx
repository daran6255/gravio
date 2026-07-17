import React, { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
	Card, CardContent, Typography, Box, useTheme, Skeleton, alpha,
	Avatar, Chip, Link, Divider
} from '@mui/material';
import {
	History, Business, PersonOutline, ChevronRight,
	CheckCircleOutline, HourglassEmpty, Block
} from '@mui/icons-material';
import orgAdminService from '../../../services/orgAdminService';
import type { Organization } from '../../../models/auth';

const getStatusMeta = (
	status: string,
	primaryColor: string,
	warningColor: string,
	errorColor: string,
	successColor: string
) => {
	switch (status) {
		case 'trial': return { label: 'Trial', color: warningColor, icon: <HourglassEmpty sx={{ fontSize: 12 }} /> };
		case 'active': return { label: 'Active', color: successColor, icon: <CheckCircleOutline sx={{ fontSize: 12 }} /> };
		case 'expired': return { label: 'Expired', color: errorColor, icon: <Block sx={{ fontSize: 12 }} /> };
		default: return { label: status, color: primaryColor, icon: <CheckCircleOutline sx={{ fontSize: 12 }} /> };
	}
};

const getInitials = (name: string) => {
	const parts = name.trim().split(' ');
	if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
	return name.slice(0, 2).toUpperCase();
};

const AVATAR_PALETTE = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
const getAvatarColor = (name: string) => AVATAR_PALETTE[name.charCodeAt(0) % AVATAR_PALETTE.length];

export const RecentActivityPanel: React.FC = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const [orgs, setOrgs] = useState<Organization[] | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;
		// Fetch most recent 8 orgs
		orgAdminService.listOrganizations(1, 8)
			.then((res) => { if (!cancelled) setOrgs(res.items); })
			.catch(() => { if (!cancelled) setOrgs(null); })
			.finally(() => { if (!cancelled) setLoading(false); });
		return () => { cancelled = true; };
	}, []);

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
						<History color="primary" sx={{ fontSize: 20 }} />
						<Typography variant="subtitle2" sx={{ fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '0.78rem', color: 'text.primary' }}>
							Recent Registrations
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
						{[1, 2, 3, 4, 5].map((n) => <Skeleton key={n} variant="rounded" height={50} sx={{ borderRadius: 2 }} />)}
					</Box>
				) : !orgs || orgs.length === 0 ? (
					<Typography variant="body2" color="text.secondary">No organizations registered yet.</Typography>
				) : (
					<Box sx={{ display: 'flex', flexDirection: 'column' }}>
						{orgs.map((org, idx) => {
							const status = getStatusMeta(
								org.subscription_status,
								theme.palette.primary.main,
								theme.palette.warning.main,
								theme.palette.error.main,
								theme.palette.success.main
							);
							const avatarColor = getAvatarColor(org.name);
							const isTeam = org.account_type === 'organization';

							return (
								<React.Fragment key={org.public_id}>
									<Box
										component={RouterLink}
										to="/organizations"
										sx={{
											display: 'flex', alignItems: 'center', gap: 1.5,
											py: 1.25, px: 1, borderRadius: 2,
											textDecoration: 'none',
											transition: 'all 0.2s ease',
											'&:hover': {
												bgcolor: isDark ? alpha('#fff', 0.03) : alpha(theme.palette.primary.main, 0.04),
											}
										}}
									>
										<Avatar sx={{
											width: 36, height: 36, bgcolor: alpha(avatarColor, 0.15),
											color: avatarColor, fontWeight: 800, fontSize: '0.75rem',
											border: `1px solid ${alpha(avatarColor, 0.2)}`
										}}>
											{getInitials(org.name)}
										</Avatar>
										<Box sx={{ flex: 1, minWidth: 0 }}>
											<Box display="flex" alignItems="center" gap={0.75}>
												<Typography
													variant="body2"
													sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.82rem' }}
													noWrap
												>
													{org.name}
												</Typography>
												{isTeam
													? <Business sx={{ fontSize: 12, color: 'text.secondary' }} />
													: <PersonOutline sx={{ fontSize: 12, color: 'text.secondary' }} />
												}
											</Box>
											<Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
												{org.plan_name || 'Free'} · {org.location || 'No location'}
											</Typography>
										</Box>
										<Chip
											icon={status.icon}
											label={status.label}
											size="small"
											sx={{
												height: 22, fontSize: '0.65rem', fontWeight: 700,
												bgcolor: alpha(status.color, 0.1),
												color: status.color,
												border: `1px solid ${alpha(status.color, 0.2)}`,
												'& .MuiChip-icon': { color: status.color, fontSize: 11, ml: 0.5 }
											}}
										/>
									</Box>
									{idx < orgs.length - 1 && (
										<Divider sx={{ opacity: 0.4, mx: 1 }} />
									)}
								</React.Fragment>
							);
						})}
					</Box>
				)}
			</CardContent>
		</Card>
	);
};

export default RecentActivityPanel;
