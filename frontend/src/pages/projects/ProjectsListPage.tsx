import React from 'react';
import { Box, Container, Grid, Stack } from '@mui/material';
import PageHeader from '../../components/common/page-header';
import { ConfirmationDialog } from '../../components/common/dialogbox';
import {
	ProjectsTable,
	ProjectCreateDrawer,
	ProjectsStatsPanel,
	ProjectAttentionPanel,
	ProjectStatusBreakdown,
	ProjectsBulkActionBar,
	useProjectsManagement,
} from '../../components/projects';

/**
 * Project Management — projects created from Won deals (or directly).
 */
const ProjectsListPage: React.FC = () => {
	const {
		projects,
		projectsTotal,
		projectsLoading,
		owners,
		projectStats,
		page,
		rowsPerPage,
		searchTerm,
		refreshData,
		handlePageChange,
		handleRowsPerPageChange,
		handleSearchChange,
		statusFilter,
		handleStatusFilterChange,
		createDrawerOpen,
		setCreateDrawerOpen,
		projectMutating,
		handleSubmit,
		deleteTarget,
		setDeleteTarget,
		deleteLoading,
		canBulkActions,
		selectedIds,
		bulkUpdateLoading,
		handleToggleSelect,
		handleSelectAll,
		handleClearSelection,
		handleBulkReassign,
		handleBulkStatusChange,
		handleCreateClick,
		handleRowClick,
		handleDeleteRequest,
		handleConfirmDelete,
	} = useProjectsManagement();

	return (
		<Box component="main" sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
			<Container maxWidth="xl" sx={{ py: { xs: 2, sm: 4 } }}>
				<PageHeader
					title="Projects"
					subtitle="Delivery projects converted from Won deals"
				/>

				<ProjectsStatsPanel stats={projectStats} />

				<Grid container spacing={3}>
					<Grid size={{ xs: 12, md: 3 }}>
						<Stack spacing={3}>
							<ProjectStatusBreakdown statusCounts={projectStats?.status_counts ?? []} />
							<ProjectAttentionPanel
								upcomingDeadlines={projectStats?.upcoming_deadlines ?? []}
								overdueProjects={projectStats?.overdue_projects ?? []}
							/>
						</Stack>
					</Grid>

					<Grid size={{ xs: 12, md: 9 }}>
						{canBulkActions && (
							<ProjectsBulkActionBar
								selectedCount={selectedIds.size}
								owners={owners}
								loading={bulkUpdateLoading}
								onReassign={handleBulkReassign}
								onChangeStatus={handleBulkStatusChange}
								onClear={handleClearSelection}
							/>
						)}

						<ProjectsTable
							projects={projects}
							owners={owners}
							loading={projectsLoading}
							totalCount={projectsTotal}
							page={page}
							rowsPerPage={rowsPerPage}
							onPageChange={handlePageChange}
							onRowsPerPageChange={handleRowsPerPageChange}
							searchTerm={searchTerm}
							onSearchChange={handleSearchChange}
							statusFilter={statusFilter}
							onStatusFilterChange={handleStatusFilterChange}
							onRefresh={refreshData}
							onCreateClick={handleCreateClick}
							onRowClick={handleRowClick}
							onDelete={handleDeleteRequest}
							selectable={canBulkActions}
							selectedIds={selectedIds}
							onToggleSelect={handleToggleSelect}
							onSelectAll={handleSelectAll}
						/>
					</Grid>
				</Grid>

				<ProjectCreateDrawer
					open={createDrawerOpen}
					onClose={() => setCreateDrawerOpen(false)}
					owners={owners}
					submitting={projectMutating}
					onSubmit={handleSubmit}
				/>

				<ConfirmationDialog
					open={!!deleteTarget}
					onClose={() => setDeleteTarget(null)}
					onConfirm={handleConfirmDelete}
					title="Delete Project"
					message={`Are you sure you want to delete "${deleteTarget?.name}"? This will also delete every task and sub-task in this project.`}
					confirmLabel="Delete"
					severity="error"
					loading={deleteLoading}
				/>
			</Container>
		</Box>
	);
};

export default ProjectsListPage;
