import React from 'react';
import { Box, Container } from '@mui/material';
import PageHeader from '../../components/common/page-header';
import { CompaniesTable, CompanyDetailDrawer, CompaniesModals, useCompaniesManagement } from '../../components/crm';

/**
 * CRM Companies — account records with linked contacts, open deals, and activity.
 */
const CompaniesPage: React.FC = () => {
	const {
		companies,
		companiesTotal,
		companiesLoading,
		page,
		rowsPerPage,
		searchTerm,
		handlePageChange,
		handleRowsPerPageChange,
		handleSearchChange,
		refreshData,
		formOpen,
		setFormOpen,
		editingCompany,
		detailOpen,
		setDetailOpen,
		selectedCompany,
		deleteTarget,
		setDeleteTarget,
		deleteLoading,
		handleCreateClick,
		handleEdit,
		handleRowClick,
		handleDeleteRequest,
		handleConfirmDelete,
		handleFormSuccess,
	} = useCompaniesManagement();

	return (
		<Box component="main" sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
			<Container maxWidth="xl" sx={{ py: { xs: 2, sm: 4 } }}>
				<PageHeader
					title="Companies"
					subtitle="Account records for your sales pipeline"
				/>

				<CompaniesTable
					companies={companies}
					loading={companiesLoading}
					totalCount={companiesTotal}
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
					onDelete={handleDeleteRequest}
				/>

				<CompanyDetailDrawer
					open={detailOpen}
					onClose={() => setDetailOpen(false)}
					company={selectedCompany}
					onEdit={handleEdit}
				/>

				<CompaniesModals
					formOpen={formOpen}
					onCloseForm={() => setFormOpen(false)}
					editingCompany={editingCompany}
					onFormSuccess={handleFormSuccess}
					deleteTarget={deleteTarget}
					onCloseDelete={() => setDeleteTarget(null)}
					onConfirmDelete={handleConfirmDelete}
					deleteLoading={deleteLoading}
				/>
			</Container>
		</Box>
	);
};

export default CompaniesPage;
