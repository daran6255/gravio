import React, { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Card, CardContent, Typography, Box, useTheme, Skeleton, Link, LinearProgress } from '@mui/material';
import { GroupsOutlined, ChevronRight } from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import userService from '../../../services/userService';
import { useAppSelector } from '../../../store/hooks';
import type { TeamMember } from '../../../models/user';

export const TeamSnapshotPanel: React.FC = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const org = useAppSelector((state) => state.auth.user?.organization);
	const [members, setMembers] = useState<TeamMember[] | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;
		userService.list(1, 200)
			.then((res) => { if (!cancelled) setMembers(res.items); })
			.catch(() => { if (!cancelled) setMembers(null); })
			.finally(() => { if (!cancelled) setLoading(false); });
		return () => { cancelled = true; };
	}, []);

	const active = (members || []).filter((m) => m.is_active && m.is_verified).length;
	const pending = (members || []).filter((m) => m.is_active && !m.is_verified).length;
	const inactive = (members || []).filter((m) => !m.is_active).length;
	const total = members?.length ?? 0;
	const seatLimit = org?.user_limit ?? org?.plan?.user_limit ?? null;

	const pieData = [
		{ name: 'Active', value: active, color: theme.palette.success.main },
		{ name: 'Pending Invite', value: pending, color: theme.palette.warning.main },
		{ name: 'Inactive', value: inactive, color: theme.palette.text.secondary },
	].filter((d) => d.value > 0);

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
			<CardContent sx={{ p: 4 }}>
				<Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
					<Box display="flex" alignItems="center" gap={1.5}>
						<GroupsOutlined color="primary" sx={{ fontSize: 24 }} />
						<Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '0.02em', color: 'text.primary' }}>
							TEAM SNAPSHOT
						</Typography>
					</Box>
					<Link component={RouterLink} to="/team" sx={{ display: 'flex', alignItems: 'center', color: 'primary.main', fontWeight: 700, fontSize: '0.8rem', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
						Manage <ChevronRight sx={{ fontSize: 16 }} />
					</Link>
				</Box>

				{loading ? (
					<Skeleton variant="rounded" height={180} sx={{ borderRadius: '12px' }} />
				) : (
					<Box display="flex" alignItems="center" gap={3}>
						<Box sx={{ width: 130, height: 130, flexShrink: 0 }}>
							<ResponsiveContainer width="100%" height="100%">
								<PieChart>
									<Pie data={pieData} dataKey="value" nameKey="name" innerRadius={40} outerRadius={62} paddingAngle={3} stroke="none">
										{pieData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
									</Pie>
									<Tooltip contentStyle={{ background: isDark ? '#141822' : '#ffffff', border: `1px solid ${theme.palette.divider}`, borderRadius: 8, fontSize: 12 }} />
								</PieChart>
							</ResponsiveContainer>
						</Box>

						<Box sx={{ flex: 1, minWidth: 0 }}>
							<Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1 }}>
								{total}{seatLimit ? ` / ${seatLimit}` : ''}
							</Typography>
							<Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 1.5 }}>
								{seatLimit ? 'Seats used' : 'Total members'}
							</Typography>
							{seatLimit && (
								<LinearProgress
									variant="determinate"
									value={Math.min(100, (total / seatLimit) * 100)}
									sx={{
										height: 6, borderRadius: 3, mb: 1.5,
										bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
										'& .MuiLinearProgress-bar': { borderRadius: 3, bgcolor: theme.palette.primary.main },
									}}
								/>
							)}
							<Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
								{pieData.map((d) => (
									<Box key={d.name} display="flex" alignItems="center" gap={0.75}>
										<Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: d.color }} />
										<Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
											{d.name} ({d.value})
										</Typography>
									</Box>
								))}
							</Box>
						</Box>
					</Box>
				)}
			</CardContent>
		</Card>
	);
};

export default TeamSnapshotPanel;
