import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Box, Container, Grid, Skeleton, Stack, Tab, Tabs, alpha, useTheme, Alert } from '@mui/material';
import {
	HelpOutline as HelpIcon,
	EventAvailableOutlined as MyLeavesIcon,
	FactCheckOutlined as TeamApprovalsIcon,
	CalendarMonthOutlined as CalendarTabIcon,
} from '@mui/icons-material';
import PageHeader from '../../../components/common/page-header';
import { AddButton, HelpGuideButton } from '../../../components/common/button';
import { responsiveStyles } from '../../../theme';
import { fetchLeaveTypes, fetchMyLeaveBalances, fetchMyLeaveRequests, fetchTeamLeaveRequests } from '../../../store/slices/hrSlice';
import { fetchTeamUsers } from '../../../store/slices/userSlice';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
	ApplyLeaveDialog,
	LeaveTypeLegend,
	LeaveHistoryTable,
	LeaveSnapshotBar,
	TeamLeavesApprovalsTable,
	LeaveCalendarView,
} from '../../../components/hr/user/leave';
import { ReportingEmployeesPanel } from '../../../components/hr/shared/ReportingEmployeesPanel';
import { HelpGuideDrawer } from '../../../components/common/guide/HelpGuideDrawer';

const leavesGuideContent = {
	icon: HelpIcon,
	title: 'Leave Workspace Guide',
	subtitle: 'Learn how to apply for leave, check balances, and approve requests.',
	banner: {
		title: 'Welcome to your Leave Workspace!',
		description: 'Track your annual leave allocations, submit leave requests, and view approval status.'
	},
	tabs: [
		{
			label: 'Employee Guide',
			intro: 'Follow these steps to apply for leave and view balances:',
			steps: [
				{
					marker: '1',
					accent: 'primary' as const,
					title: 'Check Leave Balances',
					description: 'Review your available days remaining by leave category (Casual, Sick, LOP, etc.) in the snapshot bar at the top.'
				},
				{
					marker: '2',
					accent: 'info' as const,
					title: 'Submit Leave Request',
					description: 'Click "Apply Leave" to open the request form. Select the leave type, choose dates (including half-day options), specify a reason, and submit.'
				},
				{
					marker: '3',
					accent: 'success' as const,
					title: 'Track Approval Status',
					description: 'Monitor your submitted requests in the "My Leaves" history table. You will see status updates (Pending, Approved, Rejected) along with any manager feedback.'
				}
			]
		},
		{
			label: 'Manager Approvals',
			intro: 'If you manage other employees, follow these steps to review requests:',
			steps: [
				{
					marker: '1',
					accent: 'primary' as const,
					title: 'Switch to Team Approvals Tab',
					description: 'Navigate to the "Team Approvals" tab to view pending, approved, and rejected leave requests from your reporting team.'
				},
				{
					marker: '2',
					accent: 'info' as const,
					title: 'View Team Roster',
					description: 'The sidebar on the left displays the team members currently allocated to report to you.'
				},
				{
					marker: '3',
					accent: 'success' as const,
					title: 'Approve or Reject Requests',
					description: 'On the "Pending" tab, review request details, then click the checkmark button to approve or the cross button to reject. A dialog will prompt you to enter notes.'
				}
			]
		}
	]
};

const LeaveDashboardPage: React.FC = () => {
	const theme = useTheme();
	const dispatch = useAppDispatch();
	const user = useAppSelector((state) => state.auth.user);

	const {
		leaveTypes, leaveTypesLoading,
		myLeaveBalances: balances, myLeaveBalancesLoading,
		myLeaveRequests: requests, myLeaveRequestsLoading,
		teamLeaveRequests,
	} = useAppSelector((state) => state.hr);
	const { users } = useAppSelector((state) => state.users);
	const loading = leaveTypesLoading || myLeaveBalancesLoading || myLeaveRequestsLoading;

	const [searchParams] = useSearchParams();
	const [applyOpen, setApplyOpen] = useState(false);
	// Deep-link support: WhoIsOnLeavePanel's "Leaves Calendar" link opens straight
	// to this tab via ?tab=calendar instead of landing on the (unrelated) default.
	const [activeTab, setActiveTab] = useState(() => (searchParams.get('tab') === 'calendar' ? 1 : 0));
	const [guideOpen, setGuideOpen] = useState(false);

	const isManagerOrAdmin = useMemo(() => {
		return user?.role === 'admin' || user?.role === 'manager' || user?.role === 'leadership' || user?.role === 'hr_manager';
	}, [user?.role]);

	// Calendar (and, for individual/solo accounts, My Leaves) are available to
	// everyone -- Team Approvals only appears once there's a team to approve for.
	const tabLabels = useMemo(() => {
		const labels = ['My Leaves', 'Calendar'];
		if (isManagerOrAdmin) labels.push('Team Approvals');
		return labels;
	}, [isManagerOrAdmin]);

	useEffect(() => {
		if (activeTab >= tabLabels.length) setActiveTab(0);
	}, [tabLabels, activeTab]);

	const myDirectReports = useMemo(() => {
		if (!user) return [];
		return users
			.filter((u) => u.reporting_manager_id === user.id)
			.map((u) => ({
				id: u.id,
				full_name: u.full_name || null,
				email: u.email || null,
				role: u.role || null,
				avatar: null
			}));
	}, [users, user]);

	const fetchData = () => {
		dispatch(fetchLeaveTypes(undefined));
		dispatch(fetchMyLeaveBalances(undefined));
		dispatch(fetchMyLeaveRequests(undefined));
	};

	useEffect(() => {
		fetchData();
		if (isManagerOrAdmin) {
			dispatch(fetchTeamUsers({ page: 1, pageSize: 200 }));
			dispatch(fetchTeamLeaveRequests(undefined));
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isManagerOrAdmin]);

	return (
		<Box component="main" sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
			<Container maxWidth={false} sx={responsiveStyles.pageContainer}>
				<Stack spacing={3}>
					<PageHeader
						title="Leave Management"
						subtitle="Request leaves and view your allocations."
						action={
							<Stack direction="row" spacing={1.5} alignItems="center">
								<HelpGuideButton compact onClick={() => setGuideOpen(true)} />
								<AddButton onClick={() => setApplyOpen(true)} sx={{ borderRadius: 3 }}>
									Apply Leave
								</AddButton>
							</Stack>
						}
					/>

					<Tabs
						value={activeTab}
						onChange={(_, v) => setActiveTab(v)}
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
								bgcolor: (t) => alpha(t.palette.text.primary, 0.04)
							},
							'& .Mui-selected': {
								color: 'primary.main !important',
								bgcolor: 'background.paper',
								boxShadow: `0 1px 3px 0 ${alpha(theme.palette.common.black, theme.palette.mode === 'dark' ? 0.3 : 0.1)}`
							}
						}}
					>
						<Tab label="My Leaves" icon={<MyLeavesIcon fontSize="small" />} iconPosition="start" disableRipple />
						<Tab label="Calendar" icon={<CalendarTabIcon fontSize="small" />} iconPosition="start" disableRipple />
						{isManagerOrAdmin && (
							<Tab label="Team Approvals" icon={<TeamApprovalsIcon fontSize="small" />} iconPosition="start" disableRipple />
						)}
					</Tabs>

					{loading ? (
						<Stack spacing={3}>
							<Skeleton variant="rounded" height={140} />
							<Skeleton variant="rounded" height={180} />
							<Skeleton variant="rounded" height={320} />
						</Stack>
					) : tabLabels[activeTab] === 'Team Approvals' ? (
						<Grid container spacing={3} alignItems="stretch">
							<Grid size={{ xs: 12, md: 3 }}>
								<ReportingEmployeesPanel members={myDirectReports} />
							</Grid>
							<Grid size={{ xs: 12, md: 9 }}>
								<TeamLeavesApprovalsTable />
							</Grid>
						</Grid>
					) : tabLabels[activeTab] === 'Calendar' ? (
						<LeaveCalendarView
							requests={isManagerOrAdmin ? teamLeaveRequests : requests}
							scope={isManagerOrAdmin ? 'team' : 'mine'}
						/>
					) : (
						<Stack spacing={3.5}>
							{!loading && balances.filter((b) => !b.is_lop).length === 0 && (
								<Alert
									severity="warning"
									sx={{
										borderRadius: '16px',
										border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
										fontWeight: 600,
										boxShadow: 'none',
										bgcolor: alpha(theme.palette.warning.main, 0.02)
									}}
								>
									No leave entitlements have been configured for you for the current year ({new Date().getFullYear()}). Please contact your HR administrator to set up your annual leave allocations.
								</Alert>
							)}
							<LeaveSnapshotBar balances={balances} requests={requests} />
							<Grid container spacing={2.5}>
								<Grid size={{ xs: 12, md: 3 }}>
									<LeaveTypeLegend balances={balances} />
								</Grid>
								<Grid size={{ xs: 12, md: 9 }}>
									<LeaveHistoryTable requests={requests} loading={myLeaveRequestsLoading} />
								</Grid>
							</Grid>
						</Stack>
					)}

					<ApplyLeaveDialog
						open={applyOpen}
						onClose={() => setApplyOpen(false)}
						onSaved={fetchData}
						leaveTypes={leaveTypes}
						balances={balances}
					/>

					<HelpGuideDrawer
						open={guideOpen}
						onClose={() => setGuideOpen(false)}
						content={leavesGuideContent}
					/>
				</Stack>
			</Container>
		</Box>
	);
};

export default LeaveDashboardPage;
