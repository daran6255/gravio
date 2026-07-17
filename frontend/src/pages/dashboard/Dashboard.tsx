import React from 'react';
import { Box, Grid } from '@mui/material';
import WelcomeHeader from '../../components/dashboard/WelcomeHeader';
import { InfraHealthPanel } from '../../components/dashboard/InfraHealthPanel';
import { TrialStatusCard } from '../../components/dashboard/TrialStatusCard';
import { PlatformPulsePanel } from '../../components/dashboard/super-admin/PlatformPulsePanel';
import { AttentionQueuePanel } from '../../components/dashboard/super-admin/AttentionQueuePanel';
import { PlatformKPIPanel } from '../../components/dashboard/super-admin/PlatformKPIPanel';
import { PlanDistributionPanel } from '../../components/dashboard/super-admin/PlanDistributionPanel';
import { RecentActivityPanel } from '../../components/dashboard/super-admin/RecentActivityPanel';
import { OrgSeatUsagePanel } from '../../components/dashboard/super-admin/OrgSeatUsagePanel';
import { SuperAdminQuickActions } from '../../components/dashboard/super-admin/SuperAdminQuickActions';
import { TeamSnapshotPanel } from '../../components/dashboard/org-admin/TeamSnapshotPanel';
import { ApprovalsQueuePanel } from '../../components/dashboard/org-admin/ApprovalsQueuePanel';
import { WeeklyHoursPanel } from '../../components/dashboard/team/WeeklyHoursPanel';
import { LeaveBalancePanel } from '../../components/dashboard/team/LeaveBalancePanel';
import { MyWorkPanel } from '../../components/dashboard/team/MyWorkPanel';
import { QuickActionsPanel } from '../../components/dashboard/individual/QuickActionsPanel';
import { useUserFlow } from '../../hooks/useUserFlow';

const Dashboard: React.FC = () => {
	const flow = useUserFlow();

	return (
		<Box component="main" sx={{ p: { xs: 1, sm: 0 }, display: 'flex', flexDirection: 'column', gap: 2 }}>
			<WelcomeHeader />

			{flow === 'super_admin' && (
				<>
					{/* Row 1: KPI Cards */}
					<PlatformKPIPanel />

					{/* Row 2: Platform Pulse (chart) + Attention Queue (trial alerts) */}
					<Grid container spacing={2} alignItems="stretch">
						<Grid size={{ xs: 12, md: 7 }}>
							<PlatformPulsePanel />
						</Grid>
						<Grid size={{ xs: 12, md: 5 }}>
							<AttentionQueuePanel />
						</Grid>
					</Grid>

					{/* Row 3: Plan Distribution (donut) + Recent Registrations (activity feed) */}
					<Grid container spacing={2} alignItems="stretch">
						<Grid size={{ xs: 12, md: 4 }}>
							<PlanDistributionPanel />
						</Grid>
						<Grid size={{ xs: 12, md: 8 }}>
							<RecentActivityPanel />
						</Grid>
					</Grid>

					{/* Row 4: Seat Usage Monitor + Quick Actions grid */}
					<Grid container spacing={2} alignItems="stretch">
						<Grid size={{ xs: 12, md: 5 }}>
							<OrgSeatUsagePanel />
						</Grid>
						<Grid size={{ xs: 12, md: 7 }}>
							<SuperAdminQuickActions />
						</Grid>
					</Grid>

					{/* Row 5: Infrastructure Health (full width) */}
					<InfraHealthPanel />
				</>
			)}

			{flow === 'org_admin' && (
				<>
					<Grid container spacing={2} alignItems="stretch">
						<Grid size={{ xs: 12, md: 6 }}>
							<TeamSnapshotPanel />
						</Grid>
						<Grid size={{ xs: 12, md: 6 }}>
							<TrialStatusCard />
						</Grid>
					</Grid>
					<ApprovalsQueuePanel />
				</>
			)}

			{flow === 'org_team' && (
				<>
					<Grid container spacing={2} alignItems="stretch">
						<Grid size={{ xs: 12, md: 7 }}>
							<WeeklyHoursPanel />
						</Grid>
						<Grid size={{ xs: 12, md: 5 }}>
							<LeaveBalancePanel />
						</Grid>
					</Grid>
					<MyWorkPanel />
				</>
			)}

			{flow === 'individual' && (
				<>
					<Grid container spacing={2} alignItems="stretch">
						<Grid size={{ xs: 12, md: 5 }}>
							<TrialStatusCard />
						</Grid>
						<Grid size={{ xs: 12, md: 7 }}>
							<QuickActionsPanel />
						</Grid>
					</Grid>
					<MyWorkPanel />
				</>
			)}
		</Box>
	);
};

export default Dashboard;
