import React, { useMemo, useState } from 'react';
import { Box, Typography, Stack, IconButton, Tooltip, Paper, alpha, useTheme } from '@mui/material';
import { ChevronLeft as PrevIcon, ChevronRight as NextIcon, Today as TodayIcon } from '@mui/icons-material';
import { AddButton } from '../../../common/button';
import type { HRLeaveRequestResponse } from '../../../../models/hr';

interface LeaveCalendarViewProps {
	requests: HRLeaveRequestResponse[];
	/** Whose leave this calendar is showing -- changes the empty-state copy. */
	scope: 'mine' | 'team';
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const toDateKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Only approved/pending requests ever end up in leavesByDate below (rejected and
// cancelled ones never actually took the day), so this only needs those two.
const STATUS_COLOR: Record<string, 'success' | 'warning'> = {
	approved: 'success',
	pending: 'warning',
};

export const LeaveCalendarView: React.FC<LeaveCalendarViewProps> = ({ requests, scope }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const [cursor, setCursor] = useState(() => {
		const d = new Date();
		d.setDate(1);
		return d;
	});

	// Map each calendar date -> the leave requests (approved/pending only -- rejected
	// and cancelled ones never actually took the day) that cover it.
	const leavesByDate = useMemo(() => {
		const map = new Map<string, HRLeaveRequestResponse[]>();
		for (const req of requests) {
			if (req.status !== 'approved' && req.status !== 'pending') continue;
			const start = new Date(req.from_date);
			const end = new Date(req.to_date);
			const d = new Date(start);
			while (d <= end) {
				const key = toDateKey(d);
				const list = map.get(key) || [];
				list.push(req);
				map.set(key, list);
				d.setDate(d.getDate() + 1);
			}
		}
		return map;
	}, [requests]);

	const gridDays = useMemo(() => {
		const year = cursor.getFullYear();
		const month = cursor.getMonth();
		const firstOfMonth = new Date(year, month, 1);
		const startOffset = firstOfMonth.getDay(); // 0 = Sunday
		const gridStart = new Date(year, month, 1 - startOffset);

		const days: { date: Date; inMonth: boolean }[] = [];
		for (let i = 0; i < 42; i++) {
			const d = new Date(gridStart);
			d.setDate(gridStart.getDate() + i);
			days.push({ date: d, inMonth: d.getMonth() === month });
		}
		return days;
	}, [cursor]);

	const todayKey = toDateKey(new Date());
	const monthLabel = cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

	const handlePrev = () => setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1));
	const handleNext = () => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1));
	const handleToday = () => setCursor(() => { const d = new Date(); d.setDate(1); return d; });

	return (
		<Paper sx={{ border: '1px solid', borderColor: 'divider', borderRadius: theme.layout.radius.card, overflow: 'hidden', bgcolor: 'background.paper' }}>
			<Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
				<Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{monthLabel}</Typography>
				<Stack direction="row" alignItems="center" spacing={1}>
					<IconButton size="small" onClick={handlePrev} aria-label="Previous month"><PrevIcon fontSize="small" /></IconButton>
					<AddButton hideIcon size="small" onClick={handleToday} startIcon={<TodayIcon fontSize="small" />} sx={{ px: 1.5 }}>Today</AddButton>
					<IconButton size="small" onClick={handleNext} aria-label="Next month"><NextIcon fontSize="small" /></IconButton>
				</Stack>
			</Stack>

			<Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid', borderColor: 'divider' }}>
				{WEEKDAYS.map((w) => (
					<Box key={w} sx={{ py: 1, textAlign: 'center' }}>
						<Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.65rem' }}>{w}</Typography>
					</Box>
				))}
			</Box>

			<Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
				{gridDays.map(({ date, inMonth }) => {
					const key = toDateKey(date);
					const dayLeaves = leavesByDate.get(key) || [];
					const isToday = key === todayKey;
					const visible = dayLeaves.slice(0, 3);
					const overflow = dayLeaves.length - visible.length;

					return (
						<Box
							key={key}
							sx={{
								minHeight: 92,
								p: 0.75,
								borderRight: '1px solid',
								borderBottom: '1px solid',
								borderColor: 'divider',
								bgcolor: isToday ? alpha(theme.palette.primary.main, isDark ? 0.1 : 0.05) : 'transparent',
								opacity: inMonth ? 1 : 0.35,
							}}
						>
							<Typography
								variant="caption"
								sx={{
									fontWeight: isToday ? 900 : 700,
									color: isToday ? 'primary.main' : 'text.secondary',
									display: 'block',
									mb: 0.5,
								}}
							>
								{date.getDate()}
							</Typography>
							<Stack spacing={0.5}>
								{visible.map((req) => {
									const color = STATUS_COLOR[req.status] || 'warning';
									const label = scope === 'team' ? (req.employee_name || 'Employee') : (req.leave_type_code || req.leave_type_name || 'Leave');
									return (
										<Tooltip
											key={req.public_id}
											title={`${req.employee_name || 'You'} — ${req.leave_type_name || 'Leave'} (${req.status})`}
										>
											<Box
												sx={{
													px: 0.75,
													py: 0.25,
													borderRadius: '5px',
													fontSize: '0.62rem',
													fontWeight: 700,
													whiteSpace: 'nowrap',
													overflow: 'hidden',
													textOverflow: 'ellipsis',
													bgcolor: alpha(theme.palette[color].main, isDark ? 0.18 : 0.12),
													color: `${color}.main`,
												}}
											>
												{label}
											</Box>
										</Tooltip>
									);
								})}
								{overflow > 0 && (
									<Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.disabled', fontWeight: 700, pl: 0.5 }}>
										+{overflow} more
									</Typography>
								)}
							</Stack>
						</Box>
					);
				})}
			</Box>

			{requests.length === 0 && (
				<Box sx={{ py: 4, textAlign: 'center' }}>
					<Typography variant="body2" color="text.secondary">
						{scope === 'team' ? 'No leave requests from your team yet.' : 'You have no leave requests yet.'}
					</Typography>
				</Box>
			)}
		</Paper>
	);
};

export default LeaveCalendarView;
