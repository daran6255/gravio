import React from 'react';
import { Box, Container } from '@mui/material';
import PageHeader from '../../components/common/page-header';
import { LeadsTable, LeadDetailDrawer, LeadsModals, LeadsBulkActionBar, useLeadsManagement } from '../../components/crm';

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
		canBulkActions,
		owners,
		selectedIds,
		bulkUpdateLoading,
		handleToggleSelect,
		handleSelectAll,
		handleClearSelection,
		handleBulkReassign,
		handleBulkStatusChange,
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

				{canBulkActions && (
					<LeadsBulkActionBar
						selectedCount={selectedIds.size}
						owners={owners}
						loading={bulkUpdateLoading}
						onReassign={handleBulkReassign}
						onChangeStatus={handleBulkStatusChange}
						onClear={handleClearSelection}
					/>
				)}

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
					selectable={canBulkActions}
					selectedIds={selectedIds}
					onToggleSelect={handleToggleSelect}
					onSelectAll={handleSelectAll}
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
