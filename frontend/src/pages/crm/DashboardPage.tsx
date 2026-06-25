import React, { useState } from 'react';
import { Box, Container, Grid, Button } from '@mui/material';
import { Search } from '@mui/icons-material';
import PageHeader from '../../components/common/page-header';
import {
	CrmStatsPanel,
	PipelineValueChart,
	LeadSourceChart,
	MyTasksWidget,
	useCrmDashboard,
	CrmQuickSearchDialog,
} from '../../components/crm';

/**
 * CRM Dashboard — pipeline snapshot, lead source mix, conversion rate, and my open tasks.
 */
const DashboardPage: React.FC = () => {
	const { stats, statsLoading } = useCrmDashboard();
	const [searchOpen, setSearchOpen] = useState(false);

	return (
		<Box component="main" sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
			<Container maxWidth="xl" sx={{ py: { xs: 2, sm: 4 } }}>
				<PageHeader
					title="CRM Dashboard"
					subtitle="Your pipeline at a glance"
					action={
						<Button
							variant="outlined"
							startIcon={<Search fontSize="small" />}
							onClick={() => setSearchOpen(true)}
							sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '10px' }}
						>
							Quick Find
						</Button>
					}
				/>

				<CrmStatsPanel stats={statsLoading ? null : stats} />

				<Grid container spacing={3} sx={{ mb: 3 }}>
					<Grid size={{ xs: 12, md: 7 }}>
						<PipelineValueChart stages={stats?.deal_value_by_stage ?? []} />
					</Grid>
					<Grid size={{ xs: 12, md: 5 }}>
						<LeadSourceChart sources={stats?.leads_by_source ?? []} />
					</Grid>
				</Grid>

				<Grid container spacing={3}>
					<Grid size={{ xs: 12, md: 6 }}>
						<MyTasksWidget tasks={stats?.my_tasks ?? []} />
					</Grid>
				</Grid>

				<CrmQuickSearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
			</Container>
		</Box>
	);
};

export default DashboardPage;
