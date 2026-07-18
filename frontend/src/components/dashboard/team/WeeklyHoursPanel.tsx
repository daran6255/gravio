import React, { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Card, CardContent, Typography, Box, useTheme, Skeleton, Link } from '@mui/material';
import { AccessTimeOutlined, ChevronRight } from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { useAppDispatch } from '../../../store/hooks';
import { fetchMyTimeLogs } from '../../../store/slices/timesheetSlice';
import type { ProjectTimeLog } from '../../../models/timesheet';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const EXPECTED_DAILY_HOURS = 8;

const getCurrentWeekRange = () => {
	const now = new Date();
	const day = (now.getDay() + 6) % 7; // Monday = 0
	const monday = new Date(now);
	monday.setDate(now.getDate() - day);
	monday.setHours(0, 0, 0, 0);
	const sunday = new Date(monday);
	sunday.setDate(monday.getDate() + 6);
	const toISO = (d: Date) => d.toISOString().slice(0, 10);
	return { start: toISO(monday), end: toISO(sunday), monday };
};

export const WeeklyHoursPanel: React.FC = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const dispatch = useAppDispatch();
	const [logs, setLogs] = useState<ProjectTimeLog[] | null>(null);
	const { start, end, monday } = useMemo(getCurrentWeekRange, []);

	useEffect(() => {
		let cancelled = false;
		dispatch(fetchMyTimeLogs({ startDate: start, endDate: end })).unwrap()
			.then((data) => { if (!cancelled) setLogs(data); })
			.catch(() => { if (!cancelled) setLogs(null); });
		return () => { cancelled = true; };
	}, [start, end, dispatch]);

	const chartData = DAY_LABELS.map((label, idx) => {
		const date = new Date(monday);
		date.setDate(monday.getDate() + idx);
		const dateStr = date.toISOString().slice(0, 10);
		const hours = (logs || [])
			.filter((l) => l.log_date === dateStr)
			.reduce((sum, l) => sum + l.hours, 0);
		return { day: label, hours: Math.round(hours * 10) / 10, isToday: dateStr === new Date().toISOString().slice(0, 10) };
	});

	const totalHours = chartData.reduce((sum, d) => sum + d.hours, 0);
	const expectedSoFar = EXPECTED_DAILY_HOURS * (((new Date().getDay() + 6) % 7) + 1);

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
				<Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 0.5 }}>
					<Box display="flex" alignItems="center" gap={1.25}>
						<AccessTimeOutlined color="primary" sx={{ fontSize: 20 }} />
						<Typography variant="subtitle2" sx={{ fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '0.78rem', color: 'text.primary' }}>
							This Week's Hours
						</Typography>
					</Box>
					<Link component={RouterLink} to="/timesheets" sx={{ display: 'flex', alignItems: 'center', color: 'primary.main', fontWeight: 700, fontSize: '0.8rem', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
						Log time <ChevronRight sx={{ fontSize: 16 }} />
					</Link>
				</Box>
				<Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
					{totalHours}h logged of ~{expectedSoFar}h expected so far
				</Typography>

				{logs === null ? (
					<Skeleton variant="rounded" height={170} sx={{ borderRadius: '12px' }} />
				) : (
					<Box sx={{ height: 175 }}>
						<ResponsiveContainer width="100%" height="100%">
							<BarChart data={chartData} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
								<XAxis dataKey="day" tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} axisLine={false} tickLine={false} />
								<YAxis tick={{ fill: theme.palette.text.secondary, fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
								<Tooltip
									cursor={{ fill: alphaFill(isDark) }}
									contentStyle={{ background: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}`, borderRadius: 8, fontSize: 12 }}
									formatter={(value) => [`${value}h`, 'Logged']}
								/>
								<Bar dataKey="hours" radius={[6, 6, 0, 0]} maxBarSize={32}>
									{chartData.map((d) => (
										<Cell key={d.day} fill={d.isToday ? theme.palette.primary.main : alphaFill(isDark, true)} />
									))}
								</Bar>
							</BarChart>
						</ResponsiveContainer>
					</Box>
				)}
			</CardContent>
		</Card>
	);
};

function alphaFill(isDark: boolean, bar = false) {
	if (bar) return isDark ? 'rgba(139, 124, 246, 0.35)' : 'rgba(139, 124, 246, 0.3)';
	return isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';
}

export default WeeklyHoursPanel;
