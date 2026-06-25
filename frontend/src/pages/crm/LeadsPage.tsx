import React from 'react';
import { Box, Container } from '@mui/material';
import PageHeader from '../../components/common/page-header';
import { LeadsTable, LeadDetailDrawer, LeadsModals, useLeadsManagement } from '../../components/crm';

/**
 * CRM Leads — capture, qualify, and convert sales opportunities into deals.
 */
const LeadsPage: React.FC = () => {
	const {
		leads,
		leadsTotal,
		leadsLoading,
		page,
		rowsPerPage,
		searchTerm,
		handlePageChange,
		handleRowsPerPageChange,
		handleSearchChange,
		refreshData,
		formOpen,
		setFormOpen,
		editingLead,
		detailOpen,
		setDetailOpen,
		selectedLead,
		convertOpen,
		setConvertOpen,
		convertingLead,
		deleteTarget,
		setDeleteTarget,
		deleteLoading,
		handleCreateClick,
		handleEdit,
		handleRowClick,
		handleConvert,
		handleDeleteRequest,
		handleConfirmDelete,
		handleFormSuccess,
		handleConverted,
	} = useLeadsManagement();

	return (
		<Box component="main" sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
			<Container maxWidth="xl" sx={{ py: { xs: 2, sm: 4 } }}>
				<PageHeader
					title="Leads"
					subtitle="Capture, qualify, and convert your sales pipeline"
				/>

				<LeadsTable
					leads={leads}
					loading={leadsLoading}
					totalCount={leadsTotal}
					page={page}
					rowsPerPage={rowsPerPage}
					onPageChange={handlePageChange}
					onRowsPerPageChange={handleRowsPerPageChange}
					searchTerm={searchTerm}
					onSearchChange={handleSearchChange}
					onRefresh={refreshData}
					onCreateClick={handleCreateClick}
					onRowClick={handleRowClick}
					onEdit={handleEdit}
					onConvert={handleConvert}
					onDelete={handleDeleteRequest}
				/>

				<LeadDetailDrawer
					open={detailOpen}
					onClose={() => setDetailOpen(false)}
					lead={selectedLead}
					onEdit={handleEdit}
					onConvert={handleConvert}
				/>

				<LeadsModals
					formOpen={formOpen}
					onCloseForm={() => setFormOpen(false)}
					editingLead={editingLead}
					onFormSuccess={handleFormSuccess}
					convertOpen={convertOpen}
					onCloseConvert={() => setConvertOpen(false)}
					convertingLead={convertingLead}
					onConverted={handleConverted}
					deleteTarget={deleteTarget}
					onCloseDelete={() => setDeleteTarget(null)}
					onConfirmDelete={handleConfirmDelete}
					deleteLoading={deleteLoading}
				/>
			</Container>
		</Box>
	);
};

export default LeadsPage;
