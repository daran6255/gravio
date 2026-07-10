import React, { useMemo } from 'react';
import {
	Paper,
	Typography,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Button,
	useTheme
} from '@mui/material';
import type { ProjectTimeLog, TimesheetStatus } from '../../../models/timesheet';
import TimesheetStatusBadge from '../shared/TimesheetStatusBadge';
import { computeWeekStatus } from '../shared/weekStatus';
import { formatHoursDisplay } from '../weekly-grid';

interface SubmissionHistoryPanelProps {
	/** Logs covering the past window (any week before the current one) -- not the
	 * same as myTimeLogs, which only ever holds whichever single week is displayed. */
	historyLogs: ProjectTimeLog[];
	loading: boolean;
	currentWeekMonday: Date;
	numWeeks?: number;
	onSelectWeek: (monday: Date) => void;
}

const formatDateStr = (d: Date): string => {
	const year = d.getFullYear();
	const month = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
};

const SubmissionHistoryPanel: React.FC<SubmissionHistoryPanelProps> = ({
	historyLogs,
	loading,
	currentWeekMonday,
	numWeeks = 8,
	onSelectWeek
}) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';

	const weeks = useMemo(() => {
		const result: { monday: Date; sunday: Date; status: TimesheetStatus; totalHours: number; entryCount: number }[] = [];
		for (let i = 1; i <= numWeeks; i++) {
			const monday = new Date(currentWeekMonday);
			monday.setDate(monday.getDate() - 7 * i);
			const sunday = new Date(monday);
			sunday.setDate(monday.getDate() + 6);

			const mondayStr = formatDateStr(monday);
			const sundayStr = formatDateStr(sunday);
			const weekLogs = historyLogs.filter((l) => l.log_date >= mondayStr && l.log_date <= sundayStr);

			result.push({
				monday,
				sunday,
				status: computeWeekStatus(weekLogs),
				totalHours: weekLogs.reduce((sum, l) => sum + Number(l.hours), 0),
				entryCount: weekLogs.length
			});
		}
		return result;
	}, [historyLogs, currentWeekMonday, numWeeks]);

	const weeksWithActivity = weeks.filter((w) => w.entryCount > 0);

	return (
		<Paper
			elevation={0}
			sx={{
				p: 3,
				border: `1px solid ${isDark ? '#2D3748' : '#E2E8F0'}`,
				borderRadius: '12px',
				bgcolor: isDark ? '#141822' : '#ffffff'
			}}
		>
			<Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
				Previously Submitted Timesheets
			</Typography>
			<TableContainer>
				<Table size="small">
					<TableHead>
						<TableRow>
							<TableCell sx={{ fontWeight: 700 }}>Week</TableCell>
							<TableCell align="center" sx={{ fontWeight: 700 }}>Status</TableCell>
							<TableCell align="right" sx={{ fontWeight: 700 }}>Total Hours</TableCell>
							<TableCell align="right" sx={{ fontWeight: 700 }} />
						</TableRow>
					</TableHead>
					<TableBody>
						{loading ? (
							<TableRow>
								<TableCell colSpan={4} align="center" sx={{ py: 4 }}>
									<Typography variant="body2" color="text.secondary">
										Loading...
									</Typography>
								</TableCell>
							</TableRow>
						) : weeksWithActivity.length === 0 ? (
							<TableRow>
								<TableCell colSpan={4} align="center" sx={{ py: 4 }}>
									<Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
										No previous timesheets found in the last {numWeeks} weeks.
									</Typography>
								</TableCell>
							</TableRow>
						) : (
							weeksWithActivity.map((w) => (
								<TableRow key={formatDateStr(w.monday)}>
									<TableCell>
										{w.monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
										{' — '}
										{w.sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
									</TableCell>
									<TableCell align="center">
										<TimesheetStatusBadge status={w.status} />
									</TableCell>
									<TableCell align="right">{formatHoursDisplay(w.totalHours)}</TableCell>
									<TableCell align="right">
										<Button
											size="small"
											onClick={() => onSelectWeek(w.monday)}
											sx={{ textTransform: 'none', fontWeight: 600 }}
										>
											View
										</Button>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</TableContainer>
		</Paper>
	);
};

export default SubmissionHistoryPanel;
