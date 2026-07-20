import React, { useState } from 'react';
import { Box, Container, Grid, Stack, Button } from '@mui/material';
import { FileUploadOutlined, LockOutlined } from '@mui/icons-material';
import PageHeader from '../../components/common/page-header';
import { HelpGuideButton } from '../../components/common/button';
import { WelcomeBanner } from '../../components/common/guide';
import { responsiveStyles } from '../../theme';
import { PremiumTooltip } from '../../components/common/PremiumTooltip';
import { useAppSelector } from '../../store/hooks';
import { useDismissibleBanner } from '../../hooks/useDismissibleBanner';
import { isFreeTier } from '../../utils/plan';
import { LEADS_GUIDE_CONTENT } from '../../data/leadsGuideData';
import {
	LeadsTable,
	LeadDetailDrawer,
	LeadsModals,
	LeadsBulkActionBar,
	LeadsStatsPanel,
	LeadsFilterPanel,
	LeadsSourceBreakdown,
	LeadsGuideDrawer,
	LeadsImportDialog,
	useLeadsManagement,
} from '../../components/crm';

/**
 * CRM Leads — capture, qualify, and convert sales opportunities into deals.
 */
const LeadsPage: React.FC = () => {
	const {
		leads,
		leadsTotal,
		leadsLoading,
		leadStats,
		sourceStats,
		page,
		rowsPerPage,
		searchTerm,
		handlePageChange,
		handleRowsPerPageChange,
		handleSearchChange,
		refreshData,
		statusFilter,
		priorityFilter,
		sourceFilter,
		ownerFilter,
		staleOnly,
		handleStatusFilterChange,
		handlePriorityFilterChange,
		handleSourceFilterChange,
		handleOwnerFilterChange,
		handleStaleFilterChange,
		handleClearFilters,
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
		importOpen,
		setImportOpen,
		handleImportSuccess,
		handleCreateClick,
		handleEdit,
		handleRowClick,
		handleConvert,
		handleDeleteRequest,
		handleConfirmDelete,
		handleFormSuccess,
		handleConverted,
	} = useLeadsManagement();

	const { user } = useAppSelector((state) => state.auth);
	const locked = isFreeTier(user?.organization);
	const [guideOpen, setGuideOpen] = useState(false);
	const { show: showWelcome, dismiss: handleDismissWelcome } = useDismissibleBanner('dismissedLeadsWelcome');

	return (
		<Box component="main" sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
			<Container maxWidth={false} sx={responsiveStyles.pageContainer}>
				<PageHeader
					title="Leads"
					subtitle="Capture, qualify, and convert your sales pipeline"
					action={
						<Stack direction="row" spacing={1.5} useFlexGap flexWrap="wrap">
							<PremiumTooltip
								title={locked ? 'Upgrade to a paid plan to import leads from CSV' : ''}
								arrow
							>
								<span>
									<Button
										variant="outlined"
										startIcon={locked ? <LockOutlined /> : <FileUploadOutlined />}
										onClick={() => setImportOpen(true)}
										disabled={locked}
										sx={{
											textTransform: 'none',
											fontWeight: 700,
											borderRadius: '8px',
											borderColor: 'divider',
											color: 'text.secondary',
											'&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover', color: 'primary.main' }
										}}
									>
										Import
									</Button>
								</span>
							</PremiumTooltip>
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
						</Stack>
					}
				/>

				<LeadsStatsPanel stats={leadStats} />

				{showWelcome && (
					<WelcomeBanner
						icon={LEADS_GUIDE_CONTENT.icon}
						title={LEADS_GUIDE_CONTENT.banner.title}
						description={LEADS_GUIDE_CONTENT.banner.description}
						onExplore={() => setGuideOpen(true)}
						onDismiss={handleDismissWelcome}
					/>
				)}

				<Grid container spacing={responsiveStyles.statsGridSpacing}>
					<Grid size={{ xs: 12, md: 3 }}>
						<Stack spacing={responsiveStyles.statsGridSpacing}>
							<LeadsFilterPanel
								stats={leadStats}
								status={statusFilter}
								priority={priorityFilter}
								source={sourceFilter}
								ownerId={ownerFilter}
								owners={owners}
								staleOnly={staleOnly}
								onStatusChange={handleStatusFilterChange}
								onPriorityChange={handlePriorityFilterChange}
								onSourceChange={handleSourceFilterChange}
								onOwnerChange={handleOwnerFilterChange}
								onStaleChange={handleStaleFilterChange}
								onClear={handleClearFilters}
							/>
							<LeadsSourceBreakdown sourceStats={sourceStats} />
						</Stack>
					</Grid>

					<Grid size={{ xs: 12, md: 9 }}>
						{canBulkActions && (
							<LeadsBulkActionBar
								selectedCount={selectedIds.size}
								owners={owners}
								loading={bulkUpdateLoading || bulkDeleteLoading}
								onReassign={handleBulkReassign}
								onChangeStatus={handleBulkStatusChange}
								onDelete={handleBulkDeleteRequest}
								onClear={handleClearSelection}
							/>
						)}

						<LeadsTable
							leads={leads}
							owners={owners}
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
					</Grid>
				</Grid>

				<LeadDetailDrawer
					open={detailOpen}
					onClose={() => setDetailOpen(false)}
					lead={selectedLead}
					owners={owners}
					onEdit={handleEdit}
					onDelete={handleDeleteRequest}
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
					bulkDeleteOpen={bulkDeleteOpen}
					bulkDeleteCount={selectedIds.size}
					onCloseBulkDelete={() => setBulkDeleteOpen(false)}
					onConfirmBulkDelete={handleConfirmBulkDelete}
					bulkDeleteLoading={bulkDeleteLoading}
				/>

				<LeadsImportDialog
					open={importOpen}
					onClose={() => setImportOpen(false)}
					onImported={handleImportSuccess}
				/>

				<LeadsGuideDrawer
					open={guideOpen}
					onClose={() => setGuideOpen(false)}
				/>
			</Container>
		</Box>
	);
};

export default LeadsPage;
