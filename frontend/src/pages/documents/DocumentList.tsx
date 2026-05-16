import React from 'react';
import { Container, Box } from '@mui/material';
import DocumentStats from '../../components/documents/stats/DocumentStats';
import PageHeader from '../../components/common/page-header';
import DocumentTabs from '../../components/documents/tabs/DocumentTabs';
import { useDocumentListPage } from '../../components/documents/hooks/useDocumentListPage';

/**
 * DocumentList - Central hub for tracking candidate documentation compliance.
 * Standardized dashboard mirroring the Counseling and Screening module architectures.
 */
const DocumentList: React.FC = () => {
	const {
		stats,
		tabValue,
		handleTabChange
	} = useDocumentListPage();

	return (
		<Container maxWidth="xl" sx={{ py: { xs: 2, sm: 4 } }}>
			<PageHeader
				title="Document Collection"
				subtitle="Manage and track document compliance for placement-ready candidates"
			/>

			<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
				{/* Stats Cards */}
				<DocumentStats />

				{/* Tab Section */}
				<DocumentTabs
					tabValue={tabValue}
					handleTabChange={handleTabChange}
					stats={stats}
				/>
			</Box>
		</Container>
	);
};

export default DocumentList;
