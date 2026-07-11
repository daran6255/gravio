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
	unapproveWeek,
	fetchMyWeekUnlockRequests,
	requestWeekUnlock,
	fetchTeamWeekUnlockRequests,
	approveWeekUnlock,
	denyWeekUnlock,
	fetchUserSettings
} from '../../store/slices/timesheetSlice';
import PageHeader from '../../components/common/page-header';
import WeeklyTimesheetGrid from '../../components/timesheets/weekly-grid';
import TeamTimesheetTable from '../../components/timesheets/team-approvals';
import TimesheetReportPanel from '../../components/timesheets/reports';
import TimeLogEntryFormDialog from '../../components/timesheets/log-entry-dialog';
import ManagerAllocationPanel from '../../components/timesheets/manager-allocation';
import HolidayCalendarPanel from '../../components/timesheets/holiday-calendar';
import WeekUnlockRequestsPanel from '../../components/timesheets/week-unlock-requests';
import useToast from '../../hooks/useToast';
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
	const toast = useToast();
	const currentUser = useAppSelector((state) => state.auth.user);

	const {
		myTimeLogs, teamTimeLogs, holidays, actionLoading, actionError,
		myUnlockRequests, teamUnlockRequests, teamUnlockRequestsLoading, unlockRequestMutating,
		userSettings
	} = useAppSelector((state) => state.timesheets);

	const isManagerOrAdmin = currentUser?.role === 'admin' || currentUser?.role === 'manager';
	const hasReportingManager = currentUser?.reporting_manager_id != null;

	// Navigation Date State (defaults to current week's Monday)
	const [currentMonday, setCurrentMonday] = useState<Date>(() => getMondayOfDate(new Date()));
	const [activeTab, setActiveTab] = useState(0);

	const tabLabels = useMemo(() => {
		const labels = ['My Timesheet'];
		if (isManagerOrAdmin) {
			labels.push('Team Approvals');
			labels.push('Unlock Requests');
		}
		labels.push('Reports');
		if (currentUser?.role === 'admin') {
			labels.push('Manager Allocation');
			labels.push('Holiday List');
		}
		return labels;
	}, [isManagerOrAdmin, currentUser?.role]);

	useEffect(() => {
		if (activeTab >= tabLabels.length) {
			setActiveTab(0);
		}
	}, [tabLabels, activeTab]);

	// Dialog States
	const [entryDialogOpen, setEntryDialogOpen] = useState(false);
	const [selectedLog, setSelectedLog] = useState<ProjectTimeLog | undefined>(undefined);
	const [selectedCellDate, setSelectedCellDate] = useState<string | undefined>(undefined);


	const weekDates = useMemo(() => getWeekDates(currentMonday), [currentMonday]);
	const startDateStr = formatDateStr(weekDates[0]);
	const endDateStr = formatDateStr(weekDates[6]);
	const isCurrentWeek = useMemo(
		() => formatDateStr(currentMonday) === formatDateStr(getMondayOfDate(new Date())),
		[currentMonday]
	);

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
			dispatch(fetchMyWeekUnlockRequests());
			if (tabLabels[activeTab] === 'Team Approvals') {
				loadTeamTimesheet();
			}
		}
	}, [currentMonday, activeTab, currentUser, tabLabels]);



	useEffect(() => {
		if (isManagerOrAdmin && tabLabels[activeTab] === 'Unlock Requests') {
			dispatch(fetchTeamWeekUnlockRequests());
		}
	}, [activeTab, tabLabels, isManagerOrAdmin]);

	// Own holiday-logging override, so the grid knows whether to lock holiday/Sunday cells
	useEffect(() => {
		if (currentUser) {
			dispatch(fetchUserSettings(currentUser.id));
		}
	}, [currentUser?.id]);

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
		setEntryDialogOpen(true);
	};

	const handleAddRow = () => {
		setSelectedLog(undefined);
		setSelectedCellDate(undefined);
		setEntryDialogOpen(true);
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

	// Week unlock requests
	const handleRequestUnlock = async (reason?: string) => {
		try {
			await dispatch(requestWeekUnlock({ weekStartDate: startDateStr, weekEndDate: endDateStr, reason })).unwrap();
			toast.success('Unlock request sent to your manager.');
		} catch (err: any) {
			toast.error(err || 'Failed to send unlock request');
		}
	};

	const handleApproveUnlock = async (requestId: number) => {
		try {
			await dispatch(approveWeekUnlock({ requestId })).unwrap();
			toast.success('Unlock request approved.');
		} catch (err: any) {
			toast.error(err || 'Failed to approve unlock request');
		}
	};

	const handleDenyUnlock = async (requestId: number, note?: string) => {
		try {
			await dispatch(denyWeekUnlock({ requestId, resolutionNote: note })).unwrap();
			toast.success('Unlock request denied.');
		} catch (err: any) {
			toast.error(err || 'Failed to deny unlock request');
		}
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
				{(tabLabels[activeTab] === 'My Timesheet' || tabLabels[activeTab] === 'Team Approvals') && (
					<Stack direction="row" alignItems="center" spacing={1} sx={{ alignSelf: { xs: 'center', md: 'auto' } }}>
						<IconButton onClick={handlePrevWeek} size="small">
							<PrevIcon />
						</IconButton>
						<Button
							variant="outlined"
							size="small"
							startIcon={<CurrentIcon />}
							onClick={handleCurrentWeek}
							sx={{ borderRadius: 3 }}
						>
							This Week
						</Button>
						<Typography variant="body2" sx={{ fontWeight: 700, px: 2, minWidth: { xs: 140, sm: 200 }, textAlign: 'center' }}>
							{formatWeekRangeDisplay()}
						</Typography>
						<IconButton onClick={handleNextWeek} size="small">
							<NextIcon />
						</IconButton>
					</Stack>
				)}
			</Stack>

			{actionError && (
				<Alert severity="error" sx={{ mb: 3, borderRadius: 4 }}>
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
							sx={{ borderRadius: 4 }}
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
						isCurrentWeek={isCurrentWeek}
						myUnlockRequests={myUnlockRequests}
						onRequestUnlock={handleRequestUnlock}
						unlockRequestLoading={unlockRequestMutating}
						canLogOnHolidays={userSettings?.can_log_on_holidays ?? false}
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
					currentUserId={currentUser?.id}
				/>
			)}

			{/* Week Unlock Requests Panel */}
			{tabLabels[activeTab] === 'Unlock Requests' && isManagerOrAdmin && (
				<WeekUnlockRequestsPanel
					requests={teamUnlockRequests}
					loading={teamUnlockRequestsLoading}
					onApprove={handleApproveUnlock}
					onDeny={handleDenyUnlock}
				/>
			)}

			{/* Reports Panel */}
			{tabLabels[activeTab] === 'Reports' && isManagerOrAdmin && <TimesheetReportPanel />}

			{/* Manager Allocation Panel */}
			{tabLabels[activeTab] === 'Manager Allocation' && currentUser?.role === 'admin' && <ManagerAllocationPanel />}

			{/* Holiday List Panel */}
			{tabLabels[activeTab] === 'Holiday List' && currentUser?.role === 'admin' && <HolidayCalendarPanel />}

			{/* Time Entry Form Modal */}
			<TimeLogEntryFormDialog
				open={entryDialogOpen}
				onClose={() => setEntryDialogOpen(false)}
				log={selectedLog}
				defaultDate={selectedCellDate}
				onSave={loadMyTimesheet}
			/>


		</Container>
	);
};

export default TimesheetPage;
