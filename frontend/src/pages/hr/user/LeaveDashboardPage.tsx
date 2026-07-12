import React, { useEffect, useState, useMemo } from 'react';
import { Box, Button, Container, Grid, Skeleton, Stack, Tab, Tabs, alpha, useTheme, Alert } from '@mui/material';
import { AddOutlined as AddIcon } from '@mui/icons-material';
import PageHeader from '../../../components/common/page-header';
import { responsiveStyles } from '../../../theme';
import { fetchLeaveTypes, fetchMyLeaveBalances, fetchMyLeaveRequests } from '../../../store/slices/hrSlice';
import { fetchTeamUsers } from '../../../store/slices/userSlice';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
	ApplyLeaveDialog,
	LeaveTypeLegend,
	LeaveHistoryTable,
	LeaveSnapshotBar,
	TeamLeavesApprovalsTable,
} from '../../../components/hr/user/leave';
import { ReportingEmployeesPanel } from '../../../components/hr/shared/ReportingEmployeesPanel';

const LeaveDashboardPage: React.FC = () => {
	const theme = useTheme();
	const dispatch = useAppDispatch();
	const user = useAppSelector((state) => state.auth.user);

	const {
		leaveTypes, leaveTypesLoading,
		myLeaveBalances: balances, myLeaveBalancesLoading,
		myLeaveRequests: requests, myLeaveRequestsLoading,
	} = useAppSelector((state) => state.hr);
	const { users } = useAppSelector((state) => state.users);
	const loading = leaveTypesLoading || myLeaveBalancesLoading || myLeaveRequestsLoading;

	const [applyOpen, setApplyOpen] = useState(false);
	const [activeTab, setActiveTab] = useState(0);

	const isManagerOrAdmin = useMemo(() => {
		return user?.role === 'admin' || user?.role === 'manager' || user?.role === 'leadership' || user?.role === 'hr_manager';
	}, [user?.role]);

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
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isManagerOrAdmin]);

	return (
		<Box component="main" sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
			<Container maxWidth={false} sx={responsiveStyles.pageContainer}>
				<Stack spacing={3}>
					<PageHeader
						title={isManagerOrAdmin ? "Leave Management" : "My Leaves"}
						subtitle={isManagerOrAdmin ? "Track leaves, verify balances, and manage team approvals" : "Track your balances, apply for time off, and follow your request status"}
						action={
							(activeTab === 0 || !isManagerOrAdmin) && (
								<Button
									variant="contained"
									startIcon={<AddIcon />}
									onClick={() => setApplyOpen(true)}
									sx={{
										textTransform: 'none',
										fontWeight: 700,
										borderRadius: '10px',
										px: 2.5,
										color: 'white',
										boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.25)}`,
										background: theme.gradients.brand,
										'&:hover': { boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.35)}` },
									}}
								>
									Apply Leave
								</Button>
							)
						}
					/>

					{isManagerOrAdmin && (
						<Tabs
							value={activeTab}
							onChange={(_, v) => setActiveTab(v)}
							sx={{
								borderBottom: 1,
								borderColor: 'divider',
								mb: 1.5,
								'& .MuiTab-root': { textTransform: 'none', fontWeight: 700 }
							}}
						>
							<Tab label="My Leaves" />
							<Tab label="Team Approvals" />
						</Tabs>
					)}

					{loading ? (
						<Stack spacing={3}>
							<Skeleton variant="rounded" height={140} />
							<Skeleton variant="rounded" height={180} />
							<Skeleton variant="rounded" height={320} />
						</Stack>
					) : activeTab === 1 && isManagerOrAdmin ? (
						<Grid container spacing={3} alignItems="stretch">
							<Grid size={{ xs: 12, md: 3 }}>
								<ReportingEmployeesPanel members={myDirectReports} />
							</Grid>
							<Grid size={{ xs: 12, md: 9 }}>
								<TeamLeavesApprovalsTable />
							</Grid>
						</Grid>
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
				</Stack>
			</Container>
		</Box>
	);
};

export default LeaveDashboardPage;
