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
	IconButton,
	Grid,
	alpha
} from '@mui/material';
import {
	ChevronLeft as PrevIcon,
	ChevronRight as NextIcon,
	Today as CurrentIcon,
	HelpOutline as HelpIcon,
	ScheduleOutlined as MyTimesheetIcon,
	FactCheckOutlined as TeamApprovalsIcon,
	LockOpenOutlined as UnlockRequestsIcon,
	InsightsOutlined as ReportsIcon,
	AccountTreeOutlined as ManagerAllocationIcon,
	BeachAccessOutlined as HolidayListIcon
} from '@mui/icons-material';
import { WelcomeBanner } from '../../components/common/guide/WelcomeBanner';
import { HelpGuideDrawer } from '../../components/common/guide/HelpGuideDrawer';
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
import { fetchTeamUsers } from '../../store/slices/userSlice';
import { ReportingEmployeesPanel } from '../../components/hr/shared/ReportingEmployeesPanel';
import { responsiveStyles } from '../../theme';
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

const guideContent = {
	icon: HelpIcon,
	title: 'Timesheet Workspace Guide',
	subtitle: 'Learn how to manage timesheets, reporting structure, and holidays.',
	banner: {
		title: 'Welcome to your new Timesheet Workspace!',
		description: 'As an Administrator, you can configure reporting hierarchies and holiday schedules to get your organization up and running.'
	},
	tabs: [
		{
			label: 'Timesheet Guide',
			intro: 'Follow these steps to log and submit your weekly hours:',
			steps: [
				{
					marker: '1',
					accent: 'primary' as const,
					title: 'Add Time Log Entries',
					description: 'Click any cell inside the weekly timesheet grid or click "Log Daily Entry" to record hours for projects or tasks.'
				},
				{
					marker: '2',
					accent: 'info' as const,
					title: 'Monitor Weekly Progress',
					description: 'The progress bar helps you track logged hours against the standard 40-hour target.'
				},
				{
					marker: '3',
					accent: 'success' as const,
					title: 'Submit Weekly Timesheet',
					description: 'Once all hours are logged for the week, click "Submit Week" at the top to send it to your reporting manager for approval.'
				},
				{
					marker: '4',
					accent: 'warning' as const,
					title: 'Request Weekly Unlock',
					description: 'If you need to make changes to an already submitted or approved timesheet, click "Request Unlock" to ask your manager.'
				}
			]
		},
		{
			label: 'Manager Allocation',
			intro: 'Reporting structures must be configured so managers can view and approve their team members\' timesheets:',
			steps: [
				{
					marker: '1',
					accent: 'primary' as const,
					title: 'Go to Manager Allocation Tab',
					description: 'Only Administrators have access to this page to set up organization structure.'
				},
				{
					marker: '2',
					accent: 'info' as const,
					title: 'Drag and Drop Placement',
					description: 'Drag unassigned employee cards from the right-hand panel and drop them directly onto managers\' boxes to establish reporting lines.'
				},
				{
					marker: '3',
					accent: 'success' as const,
					title: 'Reassign Reporting Lines',
					description: 'Use the options menu on any employee card to quickly change their manager or remove them from a manager.'
				}
			]
		},
		{
			label: 'Holiday List Setup',
			intro: 'Configure company holidays to automatically lock days (e.g. weekends or national holidays) or mark them with custom logging permissions:',
			steps: [
				{
					marker: '1',
					accent: 'primary' as const,
					title: 'Access Holiday List Tab',
					description: 'Administrators can view, add, and delete holidays from the central calendar.'
				},
				{
					marker: '2',
					accent: 'info' as const,
					title: 'Add Single Holiday',
					description: 'Provide the name, date, type (Public, Company, or Custom Override), and optional location code.'
				},
				{
					marker: '3',
					accent: 'success' as const,
					title: 'Import in Bulk',
					description: 'Click "Import Holidays" to drop a CSV or JSON file following the expected schema to populate the calendar instantly.'
				}
			]
		}
	]
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

	const [guideOpen, setGuideOpen] = useState(false);
	const [showBanner, setShowBanner] = useState(() => {
		return currentUser?.role === 'admin' && !localStorage.getItem('dismissed_timesheet_onboarding');
	});

	const tabIcons: Record<string, React.ElementType> = {
		'My Timesheet': MyTimesheetIcon,
		'Team Approvals': TeamApprovalsIcon,
		'Unlock Requests': UnlockRequestsIcon,
		'Reports': ReportsIcon,
		'Manager Allocation': ManagerAllocationIcon,
		'Holiday List': HolidayListIcon
	};

	const tabLabels = useMemo(() => {
		const labels = ['My Timesheet'];
		if (isManagerOrAdmin) {
			labels.push('Team Approvals');
			labels.push('Unlock Requests');
		}
		if (currentUser?.role === 'admin') {
			labels.push('Manager Allocation');
			labels.push('Holiday List');
		}
		labels.push('Reports');
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
				dispatch(fetchTeamUsers({ page: 1, pageSize: 200 }));
			}
		}
	}, [currentMonday, activeTab, currentUser, tabLabels]);



	useEffect(() => {
		if (isManagerOrAdmin && tabLabels[activeTab] === 'Unlock Requests') {
			dispatch(fetchTeamWeekUnlockRequests());
		}
	}, [activeTab, tabLabels, isManagerOrAdmin]);

	const { users } = useAppSelector((state) => state.users);
	const myDirectReports = useMemo(() => {
		if (!currentUser) return [];
		return users
			.filter((u) => u.reporting_manager_id === currentUser.id)
			.map((u) => ({
				id: u.id,
				full_name: u.full_name || null,
				email: u.email || null,
				role: u.role || null,
				avatar: null
			}));
	}, [users, currentUser]);

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

	const headerAction = (
		<Stack direction="row" alignItems="center" spacing={1.5} sx={{ alignSelf: { xs: 'center', md: 'auto' } }}>
			{/* Week Navigator */}
			{(tabLabels[activeTab] === 'My Timesheet' || tabLabels[activeTab] === 'Team Approvals') && (
				<Stack
					direction="row"
					alignItems="center"
					sx={{
						border: '1px solid',
						borderColor: 'divider',
						borderRadius: '10px',
						bgcolor: 'background.paper',
						p: 0.5
					}}
				>
					<IconButton onClick={handlePrevWeek} size="small" aria-label="Previous week">
						<PrevIcon fontSize="small" />
					</IconButton>
					<Typography variant="body2" sx={{ fontWeight: 700, px: 1.5, minWidth: { xs: 128, sm: 172 }, textAlign: 'center' }}>
						{formatWeekRangeDisplay()}
					</Typography>
					<IconButton onClick={handleNextWeek} size="small" aria-label="Next week">
						<NextIcon fontSize="small" />
					</IconButton>
					<Box sx={{ width: '1px', height: 20, bgcolor: 'divider', mx: 0.5 }} />
					<Button
						size="small"
						startIcon={<CurrentIcon fontSize="small" />}
						onClick={handleCurrentWeek}
						disabled={isCurrentWeek}
						sx={{ borderRadius: '8px', fontWeight: 700, px: 1.5 }}
					>
						Today
					</Button>
				</Stack>
			)}
			<Button
				variant="outlined"
				size="small"
				startIcon={<HelpIcon />}
				onClick={() => setGuideOpen(true)}
				sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700 }}
			>
				Help Guide
			</Button>
		</Stack>
	);

	return (
		<Box component="main" sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
			<Container maxWidth={false} sx={responsiveStyles.pageContainer}>
				{/* Page Title & Navigation Header */}
				<PageHeader
					title="Timesheet Workspace"
					subtitle="Log and approve hours across projects and operations."
					action={headerAction}
				/>

			{showBanner && (
				<WelcomeBanner
					icon={HelpIcon}
					title={guideContent.banner.title}
					description={guideContent.banner.description}
					onExplore={() => { setGuideOpen(true); }}
					onDismiss={() => {
						localStorage.setItem('dismissed_timesheet_onboarding', 'true');
						setShowBanner(false);
					}}
					exploreLabel="Set Up Workspace"
				/>
			)}

			{actionError && (
				<Alert severity="error" sx={{ mb: 3, borderRadius: 4 }}>
					{actionError}
				</Alert>
			)}

			{/* Tabs Header */}
			<Box sx={{ mb: 3 }}>
				<Tabs
					value={activeTab}
					onChange={(_, val) => setActiveTab(val)}
					variant="scrollable"
					scrollButtons="auto"
					allowScrollButtonsMobile
					TabIndicatorProps={{ sx: { display: 'none' } }}
					sx={{
						minHeight: 'auto',
						bgcolor: 'action.hover',
						borderRadius: '12px',
						p: 0.5,
						width: 'fit-content',
						maxWidth: '100%',
						'& .MuiTabs-flexContainer': { gap: 0.5 },
						'& .MuiTab-root': {
							minHeight: 40,
							minWidth: 'auto',
							borderRadius: '9px',
							fontWeight: 700,
							fontSize: '0.8125rem',
							textTransform: 'none',
							color: 'text.secondary',
							px: 2,
							py: 1,
							transition: 'color 0.2s ease, background-color 0.2s ease'
						},
						'& .MuiTab-root .MuiTab-iconWrapper': {
							marginRight: '6px',
							fontSize: '1.1rem'
						},
						'& .MuiTab-root:hover': {
							color: 'text.primary',
							bgcolor: (theme) => alpha(theme.palette.text.primary, 0.04)
						},
						'& .Mui-selected': {
							color: 'primary.main !important',
							bgcolor: 'background.paper',
							boxShadow: (theme) => `0 1px 3px 0 ${alpha(theme.palette.common.black, theme.palette.mode === 'dark' ? 0.3 : 0.1)}`
						}
					}}
				>
					{tabLabels.map((label, idx) => {
						const Icon = tabIcons[label];
						return <Tab key={idx} label={label} icon={<Icon fontSize="small" />} iconPosition="start" disableRipple />;
					})}
				</Tabs>
			</Box>

			{/* My Timesheet Grid */}
			{tabLabels[activeTab] === 'My Timesheet' && (
				<Stack spacing={3}>
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
				<Grid container spacing={3} alignItems="stretch">
					<Grid size={{ xs: 12, md: 3 }}>
						<ReportingEmployeesPanel members={myDirectReports} />
					</Grid>
					<Grid size={{ xs: 12, md: 9 }}>
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
					</Grid>
				</Grid>
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

			{/* Onboarding Help Guide Drawer */}
			<HelpGuideDrawer
				open={guideOpen}
				onClose={() => setGuideOpen(false)}
				content={guideContent}
			/>

			</Container>
		</Box>
	);
};

export default TimesheetPage;
