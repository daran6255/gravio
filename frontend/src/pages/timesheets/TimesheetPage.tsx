import React, { useState, useEffect, useMemo } from 'react';
import {
	Container,
	Box,
	Tab,
	Tabs,
	Typography,
	Button,
	Stack,
	Alert,
	IconButton
} from '@mui/material';
import {
	ChevronLeft as PrevIcon,
	ChevronRight as NextIcon,
	Today as CurrentIcon
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
	fetchMyTimeLogs,
	fetchTeamTimeLogs,
	fetchHolidays,
	submitWeek,
	approveWeek,
	rejectWeek,
	unapproveWeek
} from '../../store/slices/timesheetSlice';
import PageHeader from '../../components/common/page-header';
import WeeklyTimesheetGrid from '../../components/timesheets/WeeklyTimesheetGrid';
import TeamTimesheetTable from '../../components/timesheets/TeamTimesheetTable';
import TimesheetReportPanel from '../../components/timesheets/TimesheetReportPanel';
import TimeLogEntryDrawer from '../../components/timesheets/TimeLogEntryDrawer';
import ManagerAllocationPanel from '../../components/timesheets/manager-allocation';
import HolidayCalendarPanel from '../../components/timesheets/HolidayCalendarPanel';
import type { ProjectTimeLog } from '../../models/timesheet';

// Date utility functions
const getMondayOfDate = (d: Date): Date => {
	const day = d.getDay();
	const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
	const mon = new Date(d.setDate(diff));
	mon.setHours(0, 0, 0, 0);
	return mon;
};

const getWeekDates = (mon: Date): Date[] => {
	const dates: Date[] = [];
	for (let i = 0; i < 7; i++) {
		const next = new Date(mon);
		next.setDate(mon.getDate() + i);
		dates.push(next);
	}
	return dates;
};

const formatDateStr = (d: Date): string => {
	const year = d.getFullYear();
	const month = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
};

const TimesheetPage: React.FC = () => {
	const dispatch = useAppDispatch();
	const currentUser = useAppSelector((state) => state.auth.user);

	const { myTimeLogs, teamTimeLogs, holidays, actionLoading, actionError } = useAppSelector(
		(state) => state.timesheets
	);

	const isManagerOrAdmin = currentUser?.role === 'admin' || currentUser?.role === 'manager';
	const hasReportingManager = currentUser?.reporting_manager_id != null;

	// Navigation Date State (defaults to current week's Monday)
	const [currentMonday, setCurrentMonday] = useState<Date>(() => getMondayOfDate(new Date()));
	const [activeTab, setActiveTab] = useState(0);

	const tabLabels = useMemo(() => {
		const labels = ['My Timesheet'];
		if (isManagerOrAdmin) {
			labels.push('Team Approvals');
			labels.push('Reports');
		}
		if (currentUser?.role === 'admin') {
			labels.push('Manager Allocation');
		}
		if (isManagerOrAdmin) {
			labels.push('Holiday List');
		}
		return labels;
	}, [isManagerOrAdmin, currentUser?.role]);

	useEffect(() => {
		if (activeTab >= tabLabels.length) {
			setActiveTab(0);
		}
	}, [tabLabels, activeTab]);

	// Dialog & Drawer States
	const [drawerOpen, setDrawerOpen] = useState(false);
	const [selectedLog, setSelectedLog] = useState<ProjectTimeLog | undefined>(undefined);
	const [selectedCellDate, setSelectedCellDate] = useState<string | undefined>(undefined);


	const weekDates = useMemo(() => getWeekDates(currentMonday), [currentMonday]);
	const startDateStr = formatDateStr(weekDates[0]);
	const endDateStr = formatDateStr(weekDates[6]);

	// Fetch My Timesheets & Holidays for selected week
	const loadMyTimesheet = () => {
		dispatch(fetchMyTimeLogs({ startDate: startDateStr, endDate: endDateStr }));
		dispatch(fetchHolidays({ startDate: startDateStr, endDate: endDateStr }));
	};

	// Fetch Team Timesheets
	const loadTeamTimesheet = () => {
		dispatch(
			fetchTeamTimeLogs({
				start_date: startDateStr,
				end_date: endDateStr
			})
		);
	};

	useEffect(() => {
		if (currentUser) {
			loadMyTimesheet();
			if (activeTab === 1) {
				loadTeamTimesheet();
			}
		}
	}, [currentMonday, activeTab, currentUser]);

	// Navigate weeks
	const handlePrevWeek = () => {
		const prev = new Date(currentMonday);
		prev.setDate(currentMonday.getDate() - 7);
		setCurrentMonday(prev);
	};

	const handleNextWeek = () => {
		const next = new Date(currentMonday);
		next.setDate(currentMonday.getDate() + 7);
		setCurrentMonday(next);
	};

	const handleCurrentWeek = () => {
		setCurrentMonday(getMondayOfDate(new Date()));
	};

	// Handlers for logging
	const handleCellClick = (dateStr: string, log?: ProjectTimeLog) => {
		setSelectedCellDate(dateStr);
		setSelectedLog(log);
		setDrawerOpen(true);
	};

	const handleAddRow = () => {
		setSelectedLog(undefined);
		setSelectedCellDate(undefined);
		setDrawerOpen(true);
	};

	// Submissions
	const handleSubmitWeek = async () => {
		try {
			await dispatch(submitWeek({ startDate: startDateStr, endDate: endDateStr })).unwrap();
			loadMyTimesheet();
		} catch (err) {
			// handled in state or locally
		}
	};

	// Approvals (direct manager actions)
	const handleApproveTeamMember = async (userId: number) => {
		try {
			await dispatch(approveWeek({ targetUserId: userId, startDate: startDateStr, endDate: endDateStr })).unwrap();
			loadTeamTimesheet();
		} catch (err) {}
	};

	const handleRejectTeamMember = async (userId: number, reason: string) => {
		try {
			await dispatch(
				rejectWeek({
					targetUserId: userId,
					startDate: startDateStr,
					endDate: endDateStr,
					rejectionNote: reason
				})
			).unwrap();
			loadTeamTimesheet();
		} catch (err) {}
	};

	const handleUnapproveTeamMember = async (userId: number) => {
		try {
			await dispatch(unapproveWeek({ targetUserId: userId, startDate: startDateStr, endDate: endDateStr })).unwrap();
			loadTeamTimesheet();
		} catch (err) {}
	};





	const formatWeekRangeDisplay = () => {
		const startMonth = weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
		const endMonth = weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
		return `${startMonth} — ${endMonth}`;
	};

	return (
		<Container maxWidth="xl" sx={{ py: 4 }}>
			{/* Page Title & Navigation Header */}
			<Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }} spacing={2} sx={{ mb: 4 }}>
				<PageHeader title="Timesheet Workspace" subtitle="Log and approve hours across projects and operations." />
				
				{/* Week Navigator */}
				<Stack direction="row" alignItems="center" spacing={1} sx={{ alignSelf: { xs: 'center', md: 'auto' } }}>
					<IconButton onClick={handlePrevWeek} size="small">
						<PrevIcon />
					</IconButton>
					<Button
						variant="outlined"
						size="small"
						startIcon={<CurrentIcon />}
						onClick={handleCurrentWeek}
						sx={{ borderRadius: '6px' }}
					>
						This Week
					</Button>
					<Typography variant="body2" sx={{ fontWeight: 700, px: 2, minWidth: 200, textAlign: 'center' }}>
						{formatWeekRangeDisplay()}
					</Typography>
					<IconButton onClick={handleNextWeek} size="small">
						<NextIcon />
					</IconButton>
				</Stack>
			</Stack>

			{actionError && (
				<Alert severity="error" sx={{ mb: 3, borderRadius: '8px' }}>
					{actionError}
				</Alert>
			)}

			{/* Tabs Header */}
			<Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
				<Tabs value={activeTab} onChange={(_, val) => setActiveTab(val)}>
					{tabLabels.map((label, idx) => (
						<Tab key={idx} label={label} />
					))}
				</Tabs>
			</Box>

			{/* My Timesheet Grid */}
			{tabLabels[activeTab] === 'My Timesheet' && (
				<Stack spacing={3}>
					{!hasReportingManager && (
						<Alert
							severity="warning"
							sx={{ borderRadius: '8px' }}
						>
							You do not have a Reporting Manager assigned. Please contact your organization administrator to configure one for you to enable timesheet weekly submissions.
						</Alert>
					)}
					<WeeklyTimesheetGrid
						dates={weekDates}
						logs={myTimeLogs}
						holidays={holidays}
						onCellClick={handleCellClick}
						onAddRow={handleAddRow}
						onSubmitWeek={handleSubmitWeek}
						submitLoading={actionLoading}
						reportingManagerSet={hasReportingManager}
					/>
				</Stack>
			)}

			{/* Team Approvals Table */}
			{tabLabels[activeTab] === 'Team Approvals' && isManagerOrAdmin && (
				<TeamTimesheetTable
					logs={teamTimeLogs}
					startDate={startDateStr}
					endDate={endDateStr}
					onApprove={handleApproveTeamMember}
					onReject={handleRejectTeamMember}
					onUnapprove={handleUnapproveTeamMember}
					actionLoading={actionLoading}
					currentUserRole={currentUser?.role || ''}
				/>
			)}

			{/* Reports Panel */}
			{tabLabels[activeTab] === 'Reports' && isManagerOrAdmin && <TimesheetReportPanel />}

			{/* Manager Allocation Panel */}
			{tabLabels[activeTab] === 'Manager Allocation' && currentUser?.role === 'admin' && <ManagerAllocationPanel />}

			{/* Holiday List Panel */}
			{tabLabels[activeTab] === 'Holiday List' && isManagerOrAdmin && <HolidayCalendarPanel />}

			{/* Quick Entry Drawer */}
			<TimeLogEntryDrawer
				open={drawerOpen}
				onClose={() => setDrawerOpen(false)}
				log={selectedLog}
				defaultDate={selectedCellDate}
				onSave={loadMyTimesheet}
			/>


		</Container>
	);
};

export default TimesheetPage;
