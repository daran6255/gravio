import React from 'react';
import { Box, Container, Grid, Stack } from '@mui/material';
import PageHeader from '../../components/common/page-header';
import {
	CompaniesTable,
	CompanyDetailDrawer,
	CompaniesModals,
	CompaniesStatsPanel,
	CompaniesFilterPanel,
	CompaniesIndustryBreakdown,
	CompaniesBulkActionBar,
	useCompaniesManagement,
} from '../../components/crm';

/**
 * CRM Companies — account records with linked contacts, open deals, and activity.
 */
const CompaniesPage: React.FC = () => {
	const {
		companies,
		companiesTotal,
		companiesLoading,
		companyStats,
		page,
		rowsPerPage,
		searchTerm,
		handlePageChange,
		handleRowsPerPageChange,
		handleSearchChange,
		refreshData,
		statusFilter,
		industryFilter,
		sizeFilter,
		ownerFilter,
		handleStatusFilterChange,
		handleIndustryFilterChange,
		handleSizeFilterChange,
		handleOwnerFilterChange,
		handleClearFilters,
		formOpen,
		setFormOpen,
		editingCompany,
		detailOpen,
		setDetailOpen,
		selectedCompany,
		deleteTarget,
		setDeleteTarget,
		deleteLoading,
		canBulkActions,
		owners,
		selectedIds,
		bulkUpdateLoading,
		bulkDeleteLoading,
		bulkDeleteOpen,
		setBulkDeleteOpen,
		handleToggleSelect,
		handleSelectAll,
		handleClearSelection,
		handleBulkReassign,
		handleBulkStatusChange,
		handleBulkDeleteRequest,
		handleConfirmBulkDelete,
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

				<CompaniesStatsPanel stats={companyStats} />

				<Grid container spacing={3}>
					<Grid size={{ xs: 12, md: 3 }}>
						<Stack spacing={3}>
							<CompaniesFilterPanel
								stats={companyStats}
								status={statusFilter}
								industry={industryFilter}
								size={sizeFilter}
								ownerId={ownerFilter}
								owners={owners}
								onStatusChange={handleStatusFilterChange}
								onIndustryChange={handleIndustryFilterChange}
								onSizeChange={handleSizeFilterChange}
								onOwnerChange={handleOwnerFilterChange}
								onClear={handleClearFilters}
							/>
							<CompaniesIndustryBreakdown industryStats={companyStats?.by_industry ?? []} />
						</Stack>
					</Grid>

					<Grid size={{ xs: 12, md: 9 }}>
						{canBulkActions && (
							<CompaniesBulkActionBar
								selectedCount={selectedIds.size}
								owners={owners}
								loading={bulkUpdateLoading || bulkDeleteLoading}
								onReassign={handleBulkReassign}
								onChangeStatus={handleBulkStatusChange}
								onDelete={handleBulkDeleteRequest}
								onClear={handleClearSelection}
							/>
						)}

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
							selectable={canBulkActions}
							selectedIds={selectedIds}
							onToggleSelect={handleToggleSelect}
							onSelectAll={handleSelectAll}
						/>
					</Grid>
				</Grid>

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
					bulkDeleteOpen={bulkDeleteOpen}
					bulkDeleteCount={selectedIds.size}
					onCloseBulkDelete={() => setBulkDeleteOpen(false)}
					onConfirmBulkDelete={handleConfirmBulkDelete}
					bulkDeleteLoading={bulkDeleteLoading}
				/>
			</Container>
		</Box>
	);
};

export default CompaniesPage;
