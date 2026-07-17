import React, { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Card, CardContent, Typography, Box, useTheme, Skeleton, alpha } from '@mui/material';
import { FactCheckOutlined, LockOpen, EventBusyOutlined, TaskAlt, ChevronRight } from '@mui/icons-material';
import timesheetService from '../../../services/timesheetService';
import { hrLeaveRequestApi } from '../../../services/hrService';

interface ApprovalRow {
	label: string;
	count: number;
	icon: React.ReactElement;
	to: string;
	color: string;
}

export const ApprovalsQueuePanel: React.FC = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const [rows, setRows] = useState<ApprovalRow[] | null>(null);

	useEffect(() => {
		let cancelled = false;

		const loadUnlocks = timesheetService.getTeamWeekUnlockRequests()
			.then((reqs) => reqs.filter((r) => r.status === 'pending').length)
			.catch(() => null);

		const loadLeaves = hrLeaveRequestApi.listPending()
			.then((reqs) => reqs.length)
			.catch(() => null);

		Promise.all([loadUnlocks, loadLeaves]).then(([unlockCount, leaveCount]) => {
			if (cancelled) return;
			const built: ApprovalRow[] = [];
			if (unlockCount !== null) {
				built.push({ label: 'Timesheet Unlock Requests', count: unlockCount, icon: <LockOpen sx={{ fontSize: 18 }} />, to: '/timesheets', color: theme.palette.warning.main });
			}
			if (leaveCount !== null) {
				built.push({ label: 'Leave Requests', count: leaveCount, icon: <EventBusyOutlined sx={{ fontSize: 18 }} />, to: '/hr/user/leaves', color: theme.palette.info.main });
			}
			setRows(built);
		});

		return () => { cancelled = true; };
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const totalPending = (rows || []).reduce((sum, r) => sum + r.count, 0);

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
				<Box display="flex" alignItems="center" gap={1.25} sx={{ mb: 2 }}>
					<FactCheckOutlined color="primary" sx={{ fontSize: 20 }} />
					<Typography variant="subtitle2" sx={{ fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '0.78rem', color: 'text.primary' }}>
						Approvals Needed
					</Typography>
				</Box>

				{rows === null ? (
					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
						{[1, 2].map((n) => <Skeleton key={n} variant="rounded" height={52} sx={{ borderRadius: '10px' }} />)}
					</Box>
				) : rows.length === 0 || totalPending === 0 ? (
					<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2, gap: 0.75 }}>
						<TaskAlt sx={{ fontSize: 32, color: 'success.main' }} />
						<Typography variant="body2" color="text.secondary">Nothing pending your approval right now.</Typography>
					</Box>
				) : (
					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
						{rows.filter((r) => r.count > 0).map((row) => (
							<Box
								key={row.label}
								component={RouterLink}
								to={row.to}
								sx={{
									display: 'flex', alignItems: 'center', justifyContent: 'space-between',
									p: 1.5, borderRadius: '10px', textDecoration: 'none',
									bgcolor: isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.005)',
									border: `1px solid ${alpha(row.color, 0.15)}`,
									transition: 'all 0.2s ease',
									'&:hover': { bgcolor: alpha(row.color, 0.06), borderColor: alpha(row.color, 0.3) },
								}}
							>
								<Box display="flex" alignItems="center" gap={1.5}>
									<Box sx={{ width: 34, height: 34, borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: alpha(row.color, 0.12), color: row.color }}>
										{row.icon}
									</Box>
									<Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
										{row.label}
									</Typography>
								</Box>
								<Box display="flex" alignItems="center" gap={0.5}>
									<Box sx={{ px: 1.25, py: 0.4, borderRadius: '6px', bgcolor: alpha(row.color, 0.12), color: row.color }}>
										<Typography variant="caption" sx={{ fontWeight: 800 }}>{row.count}</Typography>
									</Box>
									<ChevronRight sx={{ fontSize: 18, color: 'text.secondary' }} />
								</Box>
							</Box>
						))}
					</Box>
				)}
			</CardContent>
		</Card>
	);
};

export default ApprovalsQueuePanel;
