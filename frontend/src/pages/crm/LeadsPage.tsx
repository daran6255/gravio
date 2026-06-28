import React, { useState } from 'react';
import { Box, Container, Grid, Stack, Button, useTheme, Typography } from '@mui/material';
import { HelpOutline, FileUploadOutlined, FileDownloadOutlined, LockOutlined } from '@mui/icons-material';
import PageHeader from '../../components/common/page-header';
import { PremiumTooltip } from '../../components/common/PremiumTooltip';
import { useAppSelector } from '../../store/hooks';
import { isFreeTier } from '../../utils/plan';
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
		handleExport,
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

	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const { user } = useAppSelector((state) => state.auth);
	const locked = isFreeTier(user?.organization);
	const [guideOpen, setGuideOpen] = useState(false);
	const [showWelcome, setShowWelcome] = useState(() => {
		if (typeof window === 'undefined') return false;
		return !localStorage.getItem('dismissedLeadsWelcome');
	});

	const handleDismissWelcome = () => {
		localStorage.setItem('dismissedLeadsWelcome', 'true');
		setShowWelcome(false);
	};

	return (
		<Box component="main" sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
			<Container maxWidth="xl" sx={{ py: { xs: 2, sm: 4 } }}>
				<PageHeader
					title="Leads"
					subtitle="Capture, qualify, and convert your sales pipeline"
					action={
						<Stack direction="row" spacing={1.5}>
							<PremiumTooltip
								title={locked ? 'Upgrade to a paid plan to export leads as CSV' : ''}
								arrow
							>
								<span>
									<Button
										variant="outlined"
										startIcon={locked ? <LockOutlined /> : <FileDownloadOutlined />}
										onClick={handleExport}
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
										Export
									</Button>
								</span>
							</PremiumTooltip>
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
							<Button
								variant="outlined"
								startIcon={<HelpOutline />}
								onClick={() => setGuideOpen(true)}
								sx={{
									textTransform: 'none',
									fontWeight: 700,
									borderRadius: '8px',
									borderColor: 'divider',
									color: 'text.secondary',
									'&:hover': {
										borderColor: 'primary.main',
										bgcolor: 'action.hover',
										color: 'primary.main',
									}
								}}
							>
								Help Guide
							</Button>
						</Stack>
					}
				/>

				<LeadsStatsPanel stats={leadStats} />

				{showWelcome && (
					<Box
						sx={{
							borderRadius: '16px',
							p: 3,
							mb: 3,
							position: 'relative',
							overflow: 'hidden',
							background: isDark
								? 'linear-gradient(135deg, #111b27 0%, #0e1622 100%)'
								: 'linear-gradient(135deg, #f5f9ff 0%, #eef5ff 100%)',
							border: '1px solid',
							borderColor: isDark ? 'rgba(33, 150, 243, 0.25)' : 'rgba(33, 150, 243, 0.15)',
							boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.05)',
							'&::before': {
								content: '""',
								position: 'absolute',
								top: '-50%',
								right: '-20%',
								width: '300px',
								height: '300px',
								borderRadius: '50%',
								background: isDark
									? 'radial-gradient(circle, rgba(33,150,243,0.15) 0%, transparent 70%)'
									: 'radial-gradient(circle, rgba(33,150,243,0.1) 0%, transparent 70%)',
							}
						}}
					>
						<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} alignItems="center" justifyContent="space-between">
							<Stack direction="row" spacing={2} alignItems="center">
								<Box
									sx={{
										width: 48,
										height: 48,
										borderRadius: '12px',
										bgcolor: 'primary.main',
										color: 'white',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										boxShadow: '0 4px 14px 0 rgba(33, 150, 243, 0.4)',
										flexShrink: 0,
									}}
								>
									<HelpOutline sx={{ fontSize: 24 }} />
								</Box>
								<Box>
									<Typography variant="body1" sx={{ fontWeight: 800, color: 'text.primary', mb: 0.5 }}>
										New to the Leads Module?
									</Typography>
									<Typography variant="body2" color="text.secondary" sx={{ maxWidth: '600px', fontSize: '0.875rem', lineHeight: 1.5 }}>
										Learn how to track candidate lifecycles, log communications (Calls, Emails, Meetings), manage files/resumes, and convert qualified profiles into active deals.
									</Typography>
								</Box>
							</Stack>
							<Stack direction="row" spacing={1.5} sx={{ width: { xs: '100%', sm: 'auto' }, flexShrink: 0, justifyContent: { xs: 'flex-end', sm: 'flex-start' } }}>
								<Button
									variant="contained"
									size="small"
									onClick={() => setGuideOpen(true)}
									sx={{
										textTransform: 'none',
										fontWeight: 700,
										borderRadius: '8px',
										boxShadow: '0 4px 12px 0 rgba(33, 150, 243, 0.2)',
									}}
								>
									Explore Guide
								</Button>
								<Button
									variant="text"
									size="small"
									onClick={handleDismissWelcome}
									sx={{
										textTransform: 'none',
										fontWeight: 600,
										color: 'text.secondary',
									}}
								>
									Dismiss
								</Button>
							</Stack>
						</Stack>
					</Box>
				)}

				<Grid container spacing={3}>
					<Grid size={{ xs: 12, md: 3 }}>
						<Stack spacing={3}>
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
