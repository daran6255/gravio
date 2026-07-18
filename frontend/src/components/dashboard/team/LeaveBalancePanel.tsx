import React, { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Card, CardContent, Typography, Box, useTheme, Skeleton, Link, LinearProgress, alpha } from '@mui/material';
import { BeachAccessOutlined, ChevronRight } from '@mui/icons-material';
import { hrLeaveBalanceApi } from '../../../services/hrService';
import type { HRLeaveBalanceResponse } from '../../../models/hr/leave';

const BAR_COLORS = ['#8B7CF6', '#4EA8FF', '#10B981', '#F59E0B'];

export const LeaveBalancePanel: React.FC = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const [balances, setBalances] = useState<HRLeaveBalanceResponse[] | null>(null);
	const [available, setAvailable] = useState(true);

	useEffect(() => {
		let cancelled = false;
		hrLeaveBalanceApi.getMyBalances()
			.then((data) => { if (!cancelled) setBalances(data); })
			.catch(() => { if (!cancelled) { setAvailable(false); setBalances([]); } });
		return () => { cancelled = true; };
	}, []);

	if (!available) return null;

	return (
		<Card
			sx={{
				borderRadius: '16px',
				height: '100%',
				background: theme.gradients.card,
				backdropFilter: 'blur(20px)',
				border: `1px solid ${theme.palette.divider}`,
				boxShadow: isDark ? '0 8px 32px 0 rgba(0, 0, 0, 0.2)' : '0 8px 32px 0 rgba(139, 124, 246, 0.04)',
			}}
		>
			<CardContent sx={{ p: 2.5 }}>
				<Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
					<Box display="flex" alignItems="center" gap={1.25}>
						<BeachAccessOutlined color="primary" sx={{ fontSize: 20 }} />
						<Typography variant="subtitle2" sx={{ fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '0.78rem', color: 'text.primary' }}>
							My Leave Balance
						</Typography>
					</Box>
					<Link component={RouterLink} to="/hr/user/leaves" sx={{ display: 'flex', alignItems: 'center', color: 'primary.main', fontWeight: 700, fontSize: '0.8rem', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
						Request <ChevronRight sx={{ fontSize: 16 }} />
					</Link>
				</Box>

				{balances === null ? (
					<Skeleton variant="rounded" height={130} sx={{ borderRadius: '12px' }} />
				) : balances.length === 0 ? (
					<Typography variant="body2" color="text.secondary">No leave types configured yet.</Typography>
				) : (
					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
						{balances.slice(0, 4).map((b, idx) => {
							const remaining = Math.max(0, b.allocated - b.used - b.pending);
							const percentUsed = b.allocated > 0 ? Math.min(100, ((b.used + b.pending) / b.allocated) * 100) : 0;
							const color = BAR_COLORS[idx % BAR_COLORS.length];
							return (
								<Box key={b.id}>
									<Box display="flex" justifyContent="space-between" sx={{ mb: 0.5 }}>
										<Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
											{b.leave_type_name || 'Leave'}
										</Typography>
										<Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
											{remaining} / {b.allocated} left
										</Typography>
									</Box>
									<LinearProgress
										variant="determinate"
										value={percentUsed}
										sx={{
											height: 6, borderRadius: 3,
											bgcolor: alpha(color, isDark ? 0.15 : 0.1),
											'& .MuiLinearProgress-bar': { borderRadius: 3, bgcolor: color },
										}}
									/>
								</Box>
							);
						})}
					</Box>
				)}
			</CardContent>
		</Card>
	);
};

export default LeaveBalancePanel;
