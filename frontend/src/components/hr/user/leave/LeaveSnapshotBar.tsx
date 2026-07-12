import React, { useMemo } from 'react';
import { Box, Divider, Stack, Typography, alpha, useTheme } from '@mui/material';
import {
	EventAvailableOutlined as AvailableIcon,
	EventBusyOutlined as UsedIcon,
	HourglassEmptyOutlined as PendingIcon,
	FlightTakeoffOutlined as UpcomingIcon,
} from '@mui/icons-material';
import type { HRLeaveBalanceResponse, HRLeaveRequestResponse } from '../../../../models/hr';

interface LeaveSnapshotBarProps {
	balances: HRLeaveBalanceResponse[];
	requests: HRLeaveRequestResponse[];
}

const LeaveSnapshotBar: React.FC<LeaveSnapshotBarProps> = ({ balances, requests }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';

	const { available, used, pendingCount, upcomingLabel, upcomingCaption } = useMemo(() => {
		const available = balances
			.filter((b) => !b.is_lop)
			.reduce((sum, b) => sum + (b.allocated - b.used - b.pending), 0);
		const used = balances.reduce((sum, b) => sum + b.used, 0);
		const pendingCount = requests.filter((r) => r.status === 'pending').length;

		const today = new Date();
		const upcoming = requests
			.filter((r) => r.status === 'approved' && new Date(r.from_date) >= today)
			.sort((a, b) => new Date(a.from_date).getTime() - new Date(b.from_date).getTime())[0];

		return {
			available,
			used,
			pendingCount,
			upcomingLabel: upcoming
				? new Date(upcoming.from_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
				: '—',
			upcomingCaption: upcoming ? upcoming.leave_type_name || 'Scheduled' : 'Nothing scheduled',
		};
	}, [balances, requests]);

	const miniStats = [
		{ label: 'Used This Year', value: `${used}`, caption: 'days taken', icon: <UsedIcon sx={{ fontSize: '1.2rem' }} />, color: theme.palette.info.main },
		{ label: 'Pending Approval', value: `${pendingCount}`, caption: pendingCount === 1 ? 'request' : 'requests', icon: <PendingIcon sx={{ fontSize: '1.2rem' }} />, color: theme.palette.warning.main },
		{ label: 'Upcoming Leave', value: upcomingLabel, caption: upcomingCaption, icon: <UpcomingIcon sx={{ fontSize: '1.2rem' }} />, color: theme.palette.success.main },
	];

	return (
		<Box
			sx={{
				position: 'relative',
				overflow: 'hidden',
				borderRadius: '24px',
				p: { xs: 3, md: 3.5 },
				border: '1px solid',
				borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.05)',
				background: isDark
					? 'linear-gradient(135deg, rgba(139,124,246,0.10) 0%, rgba(20,24,34,0.6) 55%)'
					: 'linear-gradient(135deg, rgba(139,124,246,0.06) 0%, rgba(255,255,255,0.9) 55%)',
				boxShadow: isDark
					? '0 16px 40px rgba(0,0,0,0.35)'
					: '0 16px 40px rgba(15,23,42,0.06)',
			}}
		>
			<Box
				sx={{
					position: 'absolute',
					top: -60,
					right: -60,
					width: 220,
					height: 220,
					borderRadius: '50%',
					background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.16)} 0%, rgba(255,255,255,0) 70%)`,
					pointerEvents: 'none',
				}}
			/>

			<Stack
				direction={{ xs: 'column', md: 'row' }}
				alignItems={{ xs: 'flex-start', md: 'center' }}
				spacing={{ xs: 3, md: 4 }}
				sx={{ position: 'relative', zIndex: 1 }}
			>
				<Stack direction="row" spacing={2} alignItems="center" sx={{ flexShrink: 0 }}>
					<Box
						sx={{
							width: 56,
							height: 56,
							borderRadius: '18px',
							flexShrink: 0,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							background: theme.gradients.brand,
							boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.35)}`,
							color: 'white',
						}}
					>
						<AvailableIcon sx={{ fontSize: '1.7rem' }} />
					</Box>
					<Box>
						<Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: '0.7rem' }}>
							Available Balance
						</Typography>
						<Stack direction="row" alignItems="baseline" spacing={0.75}>
							<Typography variant="h3" fontWeight={800} lineHeight={1.1}>{available}</Typography>
							<Typography variant="body2" color="text.disabled" fontWeight={600}>days remaining</Typography>
						</Stack>
					</Box>
				</Stack>

				<Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' }, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)' }} />

				<Stack
					direction={{ xs: 'column', sm: 'row' }}
					spacing={{ xs: 2, sm: 4 }}
					divider={<Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' }, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)' }} />}
					sx={{ flex: 1, width: '100%' }}
				>
					{miniStats.map((stat) => (
						<Stack key={stat.label} direction="row" spacing={1.5} alignItems="center">
							<Box
								sx={{
									width: 38,
									height: 38,
									borderRadius: '12px',
									flexShrink: 0,
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									bgcolor: alpha(stat.color, 0.12),
									color: stat.color,
								}}
							>
								{stat.icon}
							</Box>
							<Box sx={{ minWidth: 0 }}>
								<Typography variant="subtitle1" fontWeight={800} lineHeight={1.2} noWrap>{stat.value}</Typography>
								<Typography variant="caption" color="text.secondary" fontWeight={600} noWrap sx={{ display: 'block' }}>{stat.label}</Typography>
								<Typography variant="caption" color="text.disabled" noWrap>{stat.caption}</Typography>
							</Box>
						</Stack>
					))}
				</Stack>
			</Stack>
		</Box>
	);
};

export default LeaveSnapshotBar;
