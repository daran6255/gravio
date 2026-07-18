import React, { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Card, CardContent, Typography, Box, useTheme, Skeleton, Link, Avatar, Chip, alpha } from '@mui/material';
import { EventBusy, ChevronRight, AirlineSeatReclineNormal } from '@mui/icons-material';
import { hrLeaveRequestApi } from '../../../services/hrService';
import type { HRLeaveRequestResponse } from '../../../models/hr';

const getInitials = (name: string) => {
	const parts = name.trim().split(' ');
	if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
	return name.slice(0, 2).toUpperCase();
};

const AVATAR_PALETTE = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
const getAvatarColor = (name: string) => AVATAR_PALETTE[name.charCodeAt(0) % AVATAR_PALETTE.length];

export const WhoIsOnLeavePanel: React.FC = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const [leaves, setLeaves] = useState<HRLeaveRequestResponse[] | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;
		hrLeaveRequestApi.listTeamRequests('approved')
			.then((data) => { if (!cancelled) setLeaves(data); })
			.catch(() => { if (!cancelled) setLeaves(null); })
			.finally(() => { if (!cancelled) setLoading(false); });
		return () => { cancelled = true; };
	}, []);

	// Categorize leaves
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	const activeLeaves = (leaves || [])
		.filter((req) => {
			const start = new Date(req.from_date);
			const end = new Date(req.to_date);
			start.setHours(0, 0, 0, 0);
			end.setHours(23, 59, 59, 999);
			return start <= today && today <= end;
		});

	const upcomingLeaves = (leaves || [])
		.filter((req) => {
			const start = new Date(req.from_date);
			start.setHours(0, 0, 0, 0);
			return start > today;
		})
		.sort((a, b) => new Date(a.from_date).getTime() - new Date(b.from_date).getTime())
		.slice(0, 3);

	const cardBg = theme.gradients.card;

	const renderLeaveRow = (req: HRLeaveRequestResponse, type: 'today' | 'upcoming') => {
		const name = req.employee_name || 'Employee';
		const avatarColor = getAvatarColor(name);
		
		const startDateStr = new Date(req.from_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
		const endDateStr = new Date(req.to_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
		const dateRangeText = startDateStr === endDateStr ? startDateStr : `${startDateStr} - ${endDateStr}`;

		return (
			<Box
				key={req.public_id}
				sx={{
					display: 'flex',
					alignItems: 'center',
					gap: 1.5,
					p: 1.25,
					borderRadius: '10px',
					bgcolor: isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.005)',
					border: `1px solid ${theme.palette.divider}`,
				}}
			>
				<Avatar sx={{
					width: 32, height: 32, bgcolor: alpha(avatarColor, 0.15),
					color: avatarColor, fontWeight: 800, fontSize: '0.72rem',
					border: `1px solid ${alpha(avatarColor, 0.2)}`
				}}>
					{getInitials(name)}
				</Avatar>
				<Box sx={{ flex: 1, minWidth: 0 }}>
					<Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.8rem' }} noWrap>
						{name}
					</Typography>
					<Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>
						{req.leave_type_name || 'Annual Leave'} · {dateRangeText}
					</Typography>
				</Box>
				<Chip
					label={type === 'today' ? 'Today' : 'Upcoming'}
					size="small"
					sx={{
						height: 20,
						fontSize: '0.62rem',
						fontWeight: 800,
						bgcolor: type === 'today' ? alpha(theme.palette.error.main, 0.1) : alpha(theme.palette.info.main, 0.1),
						color: type === 'today' ? theme.palette.error.main : theme.palette.info.main,
						border: `1px solid ${type === 'today' ? alpha(theme.palette.error.main, 0.2) : alpha(theme.palette.info.main, 0.2)}`,
					}}
				/>
			</Box>
		);
	};

	const totalActive = activeLeaves.length + upcomingLeaves.length;

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
						<EventBusy color="primary" sx={{ fontSize: 20 }} />
						<Typography variant="subtitle2" sx={{ fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '0.78rem', color: 'text.primary' }}>
							Who's On Leave
						</Typography>
					</Box>
					<Link component={RouterLink} to="/hr/user/leaves" sx={{ display: 'flex', alignItems: 'center', color: 'primary.main', fontWeight: 700, fontSize: '0.8rem', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
						Leaves Calendar <ChevronRight sx={{ fontSize: 16 }} />
					</Link>
				</Box>

				{loading ? (
					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
						{[1, 2].map((n) => <Skeleton key={n} variant="rounded" height={48} sx={{ borderRadius: '10px' }} />)}
					</Box>
				) : !leaves ? (
					<Typography variant="body2" color="text.secondary">Couldn't load leave data.</Typography>
				) : totalActive === 0 ? (
					<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 4, gap: 1, flexGrow: 1 }}>
						<AirlineSeatReclineNormal sx={{ fontSize: 32, color: 'success.main' }} />
						<Typography variant="body2" color="text.secondary">Everyone is at work today.</Typography>
					</Box>
				) : (
					<Box sx={{
						display: 'flex',
						flexDirection: 'column',
						gap: 1.25,
						maxHeight: '140px',
						overflowY: 'auto',
						pr: 0.5,
						flexGrow: 1,
						'&::-webkit-scrollbar': { width: '4px' },
						'&::-webkit-scrollbar-track': { background: 'transparent' },
						'&::-webkit-scrollbar-thumb': {
							background: theme.palette.divider,
							borderRadius: '2px',
						},
					}}>
						{activeLeaves.map((l) => renderLeaveRow(l, 'today'))}
						{upcomingLeaves.map((l) => renderLeaveRow(l, 'upcoming'))}
					</Box>
				)}
			</CardContent>
		</Card>
	);
};

export default WhoIsOnLeavePanel;
