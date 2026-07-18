import React from 'react';
import { Box, Grid } from '@mui/material';
import WelcomeHeader from '../../components/dashboard/WelcomeHeader';
import { PlatformPulsePanel } from '../../components/dashboard/super-admin/PlatformPulsePanel';
import { AttentionQueuePanel } from '../../components/dashboard/super-admin/AttentionQueuePanel';
import { PlatformKPIPanel } from '../../components/dashboard/super-admin/PlatformKPIPanel';
import { PlanDistributionPanel } from '../../components/dashboard/super-admin/PlanDistributionPanel';
import { RecentActivityPanel } from '../../components/dashboard/super-admin/RecentActivityPanel';
import { OrgSeatUsagePanel } from '../../components/dashboard/super-admin/OrgSeatUsagePanel';
import { SuperAdminQuickActions } from '../../components/dashboard/super-admin/SuperAdminQuickActions';
import { OrgAdminQuickActions } from '../../components/dashboard/org-admin/OrgAdminQuickActions';
import { WhoIsOnLeavePanel } from '../../components/dashboard/org-admin/WhoIsOnLeavePanel';
import { OrgAdminStatsPanel } from '../../components/dashboard/org-admin/OrgAdminStatsPanel';
import { TeamRoleDistributionPanel } from '../../components/dashboard/org-admin/TeamRoleDistributionPanel';
import { OrgAdminTabbedGridPanel } from '../../components/dashboard/org-admin/OrgAdminTabbedGridPanel';
import { AiUsageChartPanel } from '../../components/dashboard/org-admin/AiUsageChartPanel';
import { BillingHistoryPanel } from '../../components/dashboard/org-admin/BillingHistoryPanel';
import { WeeklyHoursPanel } from '../../components/dashboard/team/WeeklyHoursPanel';
import { LeaveBalancePanel } from '../../components/dashboard/team/LeaveBalancePanel';
import { MyWorkPanel } from '../../components/dashboard/team/MyWorkPanel';
import { QuickActionsPanel } from '../../components/dashboard/individual/QuickActionsPanel';
import { IndividualStatsPanel } from '../../components/dashboard/individual/IndividualStatsPanel';
import { ClientProjectsDonutPanel } from '../../components/dashboard/individual/ClientProjectsDonutPanel';
import { LeadCategoryDonutPanel } from '../../components/dashboard/individual/LeadCategoryDonutPanel';
import { IndividualTabbedGridPanel } from '../../components/dashboard/individual/IndividualTabbedGridPanel';
import { LeadGenerationChartPanel } from '../../components/dashboard/individual/LeadGenerationChartPanel';
import { ActiveClientsPanel } from '../../components/dashboard/individual/ActiveClientsPanel';
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

					{/* Row 2: Platform Pulse + Needs Attention + Quick Actions */}
					<Grid container spacing={2} alignItems="stretch">
						<Grid size={{ xs: 12, md: 3 }}>
							<PlatformPulsePanel />
						</Grid>
						<Grid size={{ xs: 12, md: 4 }}>
							<AttentionQueuePanel />
						</Grid>
						<Grid size={{ xs: 12, md: 5 }}>
							<SuperAdminQuickActions />
						</Grid>
					</Grid>

					{/* Row 3: Plan Distribution + Recent Registrations + Seat Usage Monitor + Infrastructure Health */}
					<Grid container spacing={2} alignItems="stretch">
						<Grid size={{ xs: 12, md: 4 }}>
							<PlanDistributionPanel />
						</Grid>
						<Grid size={{ xs: 12, md: 4.5 }}>
							<RecentActivityPanel />
						</Grid>
						<Grid size={{ xs: 12, md: 3.5 }}>
							<OrgSeatUsagePanel />
						</Grid>
					</Grid>
				</>
			)}

			{flow === 'org_admin' && (
				<>
					{/* Row 1: KPI Stats Panel */}
					<OrgAdminStatsPanel />

					{/* Row 2: Team Role Distribution + AI Usage + Quick Actions */}
					<Grid container spacing={2} alignItems="stretch" sx={{ mt: 0.5 }}>
						<Grid size={{ xs: 12, md: 4 }}>
							<TeamRoleDistributionPanel />
						</Grid>
						<Grid size={{ xs: 12, md: 4 }}>
							<AiUsageChartPanel />
						</Grid>
						<Grid size={{ xs: 12, md: 4 }}>
							<OrgAdminQuickActions />
						</Grid>
					</Grid>

					{/* Row 3: Tabbed Active Grid + Who is on Leave + Billing Status */}
					<Grid container spacing={2} alignItems="stretch" sx={{ mt: 0.5 }}>
						<Grid size={{ xs: 12, md: 6 }}>
							<OrgAdminTabbedGridPanel />
						</Grid>
						<Grid size={{ xs: 12, md: 3 }}>
							<WhoIsOnLeavePanel />
						</Grid>
						<Grid size={{ xs: 12, md: 3 }}>
							<BillingHistoryPanel />
						</Grid>
					</Grid>
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
					{/* Row 1: KPI Stats Panel */}
					<IndividualStatsPanel />

					{/* Row 2: Client Projects Donut + Lead Sources Donut + Quick Actions */}
					<Grid container spacing={2} alignItems="stretch" sx={{ mt: 0.5 }}>
						<Grid size={{ xs: 12, md: 3 }}>
							<ClientProjectsDonutPanel />
						</Grid>
						<Grid size={{ xs: 12, md: 3 }}>
							<LeadCategoryDonutPanel />
						</Grid>
						<Grid size={{ xs: 12, md: 6 }}>
							<QuickActionsPanel />
						</Grid>
					</Grid>

					{/* Row 3: AI Usage + Lead Generation + Billing Status */}
					<Grid container spacing={2} alignItems="stretch" sx={{ mt: 0.5 }}>
						<Grid size={{ xs: 12, md: 4.5 }}>
							<AiUsageChartPanel />
						</Grid>
						<Grid size={{ xs: 12, md: 4.5 }}>
							<LeadGenerationChartPanel />
						</Grid>
						<Grid size={{ xs: 12, md: 3 }}>
							<BillingHistoryPanel />
						</Grid>
					</Grid>

					{/* Row 4: Tabbed Active Grid + Active Clients */}
					<Grid container spacing={2} alignItems="stretch" sx={{ mt: 0.5 }}>
						<Grid size={{ xs: 12, md: 6 }}>
							<IndividualTabbedGridPanel />
						</Grid>
						<Grid size={{ xs: 12, md: 6 }}>
							<ActiveClientsPanel />
						</Grid>
					</Grid>
				</>
			)}
		</Box>
	);
};

export default Dashboard;
