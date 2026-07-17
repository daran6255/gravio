import React from 'react';
import { Box, Grid } from '@mui/material';
import WelcomeHeader from '../../components/dashboard/WelcomeHeader';
import { InfraHealthPanel } from '../../components/dashboard/InfraHealthPanel';
import { TrialStatusCard } from '../../components/dashboard/TrialStatusCard';
import { PlatformPulsePanel } from '../../components/dashboard/super-admin/PlatformPulsePanel';
import { AttentionQueuePanel } from '../../components/dashboard/super-admin/AttentionQueuePanel';
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
		<Box component="main" sx={{ p: { xs: 1, sm: 0 }, display: 'flex', flexDirection: 'column', gap: 3 }}>
			<WelcomeHeader />

			{flow === 'super_admin' && (
				<>
					<Grid container spacing={3} alignItems="stretch">
						<Grid size={{ xs: 12, md: 7 }}>
							<PlatformPulsePanel />
						</Grid>
						<Grid size={{ xs: 12, md: 5 }}>
							<AttentionQueuePanel />
						</Grid>
					</Grid>
					<InfraHealthPanel />
				</>
			)}

			{flow === 'org_admin' && (
				<>
					<Grid container spacing={3} alignItems="stretch">
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
					<Grid container spacing={3} alignItems="stretch">
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
					<Grid container spacing={3} alignItems="stretch">
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
