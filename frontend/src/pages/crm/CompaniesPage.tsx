import React, { useState } from 'react';
import { Box, Container, Grid, Stack } from '@mui/material';
import { responsiveStyles } from '../../theme';
import PageHeader from '../../components/common/page-header';
import { HelpGuideButton } from '../../components/common/button';
import { WelcomeBanner } from '../../components/common/guide';
import { useDismissibleBanner } from '../../hooks/useDismissibleBanner';
import { COMPANIES_GUIDE_CONTENT } from '../../data/companiesGuideData';
import {
	CompaniesTable,
	CompanyDetailDrawer,
	CompaniesModals,
	CompaniesStatsPanel,
	CompaniesFilterPanel,
	CompaniesIndustryBreakdown,
	CompaniesBulkActionBar,
	CompaniesGuideDrawer,
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

	const [guideOpen, setGuideOpen] = useState(false);
	const { show: showWelcome, dismiss: handleDismissWelcome } = useDismissibleBanner('dismissedCompaniesWelcome');

	return (
		<Box component="main" sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
			<Container maxWidth={false} sx={responsiveStyles.pageContainer}>
				<PageHeader
					title="Companies"
					subtitle="Account records for your sales pipeline"
					action={
						<HelpGuideButton
							onClick={() => setGuideOpen(true)}
							sx={{
								borderRadius: '8px',
								borderColor: 'divider',
								color: 'text.secondary',
								'&:hover': {
									borderColor: 'primary.main',
									bgcolor: 'action.hover',
									color: 'primary.main',
								}
							}}
						/>
					}
				/>

				<CompaniesStatsPanel stats={companyStats} />

				{showWelcome && (
					<WelcomeBanner
						icon={COMPANIES_GUIDE_CONTENT.icon}
						title={COMPANIES_GUIDE_CONTENT.banner.title}
						description={COMPANIES_GUIDE_CONTENT.banner.description}
						onExplore={() => setGuideOpen(true)}
						onDismiss={handleDismissWelcome}
					/>
				)}

				<Grid container spacing={responsiveStyles.statsGridSpacing}>
					<Grid size={{ xs: 12, md: 3 }}>
						<Stack spacing={responsiveStyles.statsGridSpacing}>
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
					owners={owners}
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

				<CompaniesGuideDrawer
					open={guideOpen}
					onClose={() => setGuideOpen(false)}
				/>
			</Container>
		</Box>
	);
};

export default CompaniesPage;
