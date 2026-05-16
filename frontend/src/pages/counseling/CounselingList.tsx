import React from 'react';
import { Container, Box } from '@mui/material';
import CounselingStats from '../../components/counseling/stats/CounselingStats';
import CounselingFormDialog from '../../components/counseling/forms/CounselingFormDialog';
import PageHeader from '../../components/common/page-header';
import CounselingTabs from '../../components/counseling/tabs/CounselingTabs';
import { useCounselingPage } from '../../components/counseling/hooks/useCounselingPage';

/**
 * Candidate Counseling Module
 * Standardized dashboard for managing candidate assessment and placement details.
 */
const CounselingList: React.FC = () => {
	const {
		stats,
		tabValue,
		dialogOpen,
		selectedCandidate,
		refreshKey,
		initialFormData,
		handleTabChange,
		handleAction,
		handleDialogClose,
		handleFormSubmit
	} = useCounselingPage();

	return (
		<Container maxWidth="xl" sx={{ py: { xs: 2, sm: 4 } }}>
			<PageHeader
				title="Candidate Counseling"
				subtitle="Assess and counsel profiled candidates for placement readiness"
			/>

			<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
				{/* Stats Cards */}
				<CounselingStats />

				{/* Tab Section */}
				<CounselingTabs
					tabValue={tabValue}
					handleTabChange={handleTabChange}
					stats={stats}
					handleAction={handleAction}
					refreshKey={refreshKey}
				/>
			</Box>

			{/* Counseling Form Dialog */}
			<CounselingFormDialog
				open={dialogOpen}
				onClose={handleDialogClose}
				onSubmit={handleFormSubmit}
				initialData={initialFormData}
				candidateName={selectedCandidate?.name}
				candidateWorkExperience={selectedCandidate?.work_experience}
			/>
		</Container>
	);
};

export default CounselingList;
