import React, { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Card, CardContent, Typography, Box, useTheme, Skeleton, Link, LinearProgress } from '@mui/material';
import { GroupsOutlined, ChevronRight } from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useAppDispatch } from '../../../store/hooks';
import { fetchTeamUsers } from '../../../store/slices/userSlice';
import type { TeamMember } from '../../../models/user';

const ROLE_LABELS: Record<string, string> = {
	admin: 'Admin',
	manager: 'Manager',
	sourcing: 'Sourcing',
	placement: 'Placement',
	trainer: 'Trainer',
	counselor: 'Counselor',
	project_coordinator: 'PM',
	developer: 'Developer',
	marketing: 'Marketing',
	hr_admin: 'HR Admin',
	hr_manager: 'HR Manager',
	leadership: 'Leadership',
};

const ROLE_COLORS: Record<string, string> = {
	admin: '#6366f1',
	developer: '#06b6d4',
	manager: '#10b981',
	project_coordinator: '#8b5cf6',
	sourcing: '#f59e0b',
	placement: '#ec4899',
	hr_admin: '#ef4444',
	hr_manager: '#14b8a6',
	leadership: '#64748b',
};

const DEFAULT_COLOR = '#94a3b8';

export const TeamRoleDistributionPanel: React.FC = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const dispatch = useAppDispatch();
	const [members, setMembers] = useState<TeamMember[] | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;
		dispatch(fetchTeamUsers({ page: 1, pageSize: 200 })).unwrap()
			.then((res) => { if (!cancelled) setMembers(res.items); })
			.catch(() => { if (!cancelled) setMembers(null); })
			.finally(() => { if (!cancelled) setLoading(false); });
		return () => { cancelled = true; };
	}, [dispatch]);

	// Process roles
	const roleCounts = (members || []).reduce((acc, m) => {
		const r = m.role || 'developer';
		acc[r] = (acc[r] || 0) + 1;
		return acc;
	}, {} as Record<string, number>);

	const pieData = Object.entries(roleCounts)
		.map(([role, count]) => ({
			name: ROLE_LABELS[role] || role,
			value: count,
			color: ROLE_COLORS[role] || DEFAULT_COLOR,
		}))
		.sort((a, b) => b.value - a.value);

	const total = (members || []).length;

	const cardBg = theme.gradients.card;

	return (
		<Card sx={{
			borderRadius: '16px',
			border: `1px solid ${theme.palette.divider}`,
			boxShadow: isDark ? '0 8px 32px 0 rgba(0, 0, 0, 0.2)' : '0 8px 32px 0 rgba(139, 124, 246, 0.04)',
			height: '100%',
			background: cardBg,
			backdropFilter: 'blur(20px)',
		}}>
			<CardContent sx={{ p: 2.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
				<Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
					<Box display="flex" alignItems="center" gap={1.25}>
						<GroupsOutlined color="primary" sx={{ fontSize: 20 }} />
						<Typography variant="subtitle2" sx={{ fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '0.78rem', color: 'text.primary' }}>
							Team Roles
						</Typography>
					</Box>
					<Link component={RouterLink} to="/team" sx={{ display: 'flex', alignItems: 'center', color: 'primary.main', fontWeight: 700, fontSize: '0.8rem', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
						Manage <ChevronRight sx={{ fontSize: 16 }} />
					</Link>
				</Box>

				{loading ? (
					<Skeleton variant="rounded" height={220} sx={{ borderRadius: '12px', flexGrow: 1 }} />
				) : total === 0 ? (
					<Box display="flex" alignItems="center" justifyContent="center" sx={{ py: 4, flexGrow: 1 }}>
						<Typography variant="body2" color="text.secondary">No team members registered.</Typography>
					</Box>
				) : (
					<Box display="flex" flexDirection="column" alignItems="center" sx={{ flexGrow: 1 }}>
						{/* Donut Chart with Centered Metric */}
						<Box sx={{ position: 'relative', width: 130, height: 130, mb: 2.5, flexShrink: 0 }}>
							<ResponsiveContainer width="100%" height="100%">
								<PieChart>
									<Pie
										data={pieData}
										dataKey="value"
										nameKey="name"
										innerRadius={45}
										outerRadius={58}
										paddingAngle={4}
										cornerRadius={3}
										stroke="none"
									>
										{pieData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
									</Pie>
								</PieChart>
							</ResponsiveContainer>
							
							{/* Center Text */}
							<Box sx={{
								position: 'absolute', inset: 0,
								display: 'flex', flexDirection: 'column',
								alignItems: 'center', justifyContent: 'center',
							}}>
								<Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1 }}>
									{total}
								</Typography>
								<Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.52rem', fontWeight: 800, letterSpacing: '0.04em' }}>
									TOTAL
								</Typography>
							</Box>
						</Box>

						{/* Proportional Role Distribution Indicators */}
						<Box sx={{
							width: '100%',
							maxHeight: '110px',
							overflowY: 'auto',
							pr: 0.5,
							display: 'flex',
							flexDirection: 'column',
							gap: 1.25,
							'&::-webkit-scrollbar': { width: '4px' },
							'&::-webkit-scrollbar-track': { background: 'transparent' },
							'&::-webkit-scrollbar-thumb': { background: theme.palette.divider, borderRadius: '2px' }
						}}>
							{pieData.map((d) => {
								const percentage = Math.round((d.value / total) * 100);
								return (
									<Box key={d.name} sx={{ width: '100%' }}>
										<Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 0.5 }}>
											<Box display="flex" alignItems="center" gap={0.75} sx={{ minWidth: 0 }}>
												<Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: d.color, flexShrink: 0 }} />
												<Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.72rem' }} noWrap>
													{d.name}
												</Typography>
											</Box>
											<Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.72rem' }}>
												{d.value} ({percentage}%)
											</Typography>
										</Box>
										<LinearProgress
											variant="determinate"
											value={percentage}
											sx={{
												height: 4,
												borderRadius: 2,
												bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
												'& .MuiLinearProgress-bar': {
													borderRadius: 2,
													bgcolor: d.color,
												}
											}}
										/>
									</Box>
								);
							})}
						</Box>
					</Box>
				)}
			</CardContent>
		</Card>
	);
};

export default TeamRoleDistributionPanel;
