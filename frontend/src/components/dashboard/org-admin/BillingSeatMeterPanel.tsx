import React, { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Card, CardContent, Typography, Box, useTheme, Skeleton, Link, CircularProgress } from '@mui/material';
import { Payment, ChevronRight } from '@mui/icons-material';
import userService from '../../../services/userService';
import { useAppSelector } from '../../../store/hooks';

export const BillingSeatMeterPanel: React.FC = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const org = useAppSelector((state) => state.auth.user?.organization);
	
	const [memberCount, setMemberCount] = useState<number | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;
		userService.list(1, 1)
			.then((res) => { if (!cancelled) setMemberCount(res.total); })
			.catch(() => { if (!cancelled) setMemberCount(null); })
			.finally(() => { if (!cancelled) setLoading(false); });
		return () => { cancelled = true; };
	}, []);

	if (!org) return null;

	const seatLimit = org.user_limit ?? org.plan?.user_limit ?? 10;
	const activeSeats = memberCount ?? 1;
	const seatPercent = Math.min(100, Math.round((activeSeats / seatLimit) * 100));

	// AI quota calculation
	const aiLimit = org.plan?.ai_monthly_limit ?? 100;
	// Mock/retrieve consumed AI credits from org.others or default
	const aiUsed = (org.others as any)?.ai_actions_used ?? 18; 
	const aiPercent = Math.min(100, Math.round((aiUsed / aiLimit) * 100));

	const cardBg = isDark
		? 'linear-gradient(135deg, rgba(20, 24, 34, 0.75) 0%, rgba(11, 13, 18, 0.9) 100%)'
		: 'linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(248, 250, 252, 0.95) 100%)';

	const renderMeter = (title: string, value: number, limit: number, percent: number, color: string) => {
		return (
			<Box display="flex" flexDirection="column" alignItems="center" sx={{ flex: 1 }}>
				<Box sx={{ position: 'relative', display: 'inline-flex', mb: 1.5 }}>
					<CircularProgress
						variant="determinate"
						value={100}
						size={80}
						thickness={5}
						sx={{ color: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', position: 'absolute' }}
					/>
					<CircularProgress
						variant="determinate"
						value={percent}
						size={80}
						thickness={5}
						sx={{ color, '& .MuiCircularProgress-circle': { strokeLinecap: 'round' } }}
					/>
					<Box sx={{
						position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
						alignItems: 'center', justifyContent: 'center',
					}}>
						<Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1 }}>
							{percent}%
						</Typography>
						<Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.52rem', fontWeight: 700, textTransform: 'uppercase' }}>
							Used
						</Typography>
					</Box>
				</Box>
				<Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.78rem' }}>
					{title}
				</Typography>
				<Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
					{value} / {limit}
				</Typography>
			</Box>
		);
	};

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
						<Payment color="primary" sx={{ fontSize: 20 }} />
						<Typography variant="subtitle2" sx={{ fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '0.78rem', color: 'text.primary' }}>
							Capacity & Billing
						</Typography>
					</Box>
					<Link component={RouterLink} to="/billing" sx={{ display: 'flex', alignItems: 'center', color: 'primary.main', fontWeight: 700, fontSize: '0.8rem', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
						Billing Info <ChevronRight sx={{ fontSize: 16 }} />
					</Link>
				</Box>

				{loading ? (
					<Box display="flex" gap={3} sx={{ flexGrow: 1, py: 1 }}>
						<Skeleton variant="circular" width={80} height={80} sx={{ flexGrow: 1 }} />
						<Skeleton variant="circular" width={80} height={80} sx={{ flexGrow: 1 }} />
					</Box>
				) : (
					<Box display="flex" gap={2} alignItems="center" justifyContent="space-around" sx={{ flexGrow: 1, py: 0.5 }}>
						{renderMeter('Seat Usage', activeSeats, seatLimit, seatPercent, theme.palette.primary.main)}
						
						<Box sx={{ alignSelf: 'stretch', width: '1px', bgcolor: theme.palette.divider, my: 1 }} />
						
						{renderMeter('AI Actions', aiUsed, aiLimit, aiPercent, theme.palette.info.main)}
					</Box>
				)}
			</CardContent>
		</Card>
	);
};

export default BillingSeatMeterPanel;
