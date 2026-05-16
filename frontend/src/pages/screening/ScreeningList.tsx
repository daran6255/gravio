import React from 'react';
import { Box, Container } from '@mui/material';
import ScreeningStatCard from '../../components/screening/stats/ScreeningStatCard';
import ScreeningFormDialog from '../../components/screening/dialogs/ScreeningFormDialog';
import PageHeader from '../../components/common/page-header';
import ScreeningTabs from '../../components/screening/tabs/ScreeningTabs';
import { useScreeningPage } from '../../components/screening/hooks/useScreeningPage';

/**
 * Candidate Screening Module
 * Standardized dashboard for managing candidate assessment details.
 */
const ScreeningList: React.FC = () => {
	const {
		stats,
		tabValue,
		dialogOpen,
		selectedCandidate,
		refreshKey,
		handleTabChange,
		handleAction,
		handleDialogClose,
		handleRefreshCandidate,
		handleScreeningSubmit
	} = useScreeningPage();

	return (
		<Container maxWidth="xl" sx={{ py: { xs: 2, sm: 4 } }}>
			<PageHeader
				title="Candidate Screening"
				subtitle="Manage candidate screening and assessment details"
			/>

			<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
				{/* Stats Cards */}
				<ScreeningStatCard />

				{/* Tab Section */}
				<ScreeningTabs
					tabValue={tabValue}
					handleTabChange={handleTabChange}
					stats={stats}
					handleAction={handleAction}
					refreshKey={refreshKey}
				/>
			</Box>

			{/* Screening Form Dialog */}
			<ScreeningFormDialog
				open={dialogOpen}
				onClose={handleDialogClose}
				onSubmit={handleScreeningSubmit}
				initialData={selectedCandidate?.screening}
				candidateName={selectedCandidate?.name}
				candidatePublicId={selectedCandidate?.public_id}
				candidateGuardianDetails={selectedCandidate?.guardian_details}
				existingDocuments={selectedCandidate?.documents}
				onRefresh={handleRefreshCandidate}
			/>
		</Container>
	);
};

export default ScreeningList;
