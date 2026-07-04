import React from 'react';
import { Box, Container } from '@mui/material';
import PageHeader from '../../components/common/page-header';
import { ConfirmationDialog } from '../../components/common/dialogbox';
import { ProjectsTable, ProjectFormDialog, useProjectsManagement } from '../../components/projects';

/**
 * Project Management — projects created from Won deals (or directly), each
 * tracked through to completion via its own task board.
 */
const ProjectsListPage: React.FC = () => {
	const {
		projects,
		projectsTotal,
		projectsLoading,
		owners,
		page,
		rowsPerPage,
		searchTerm,
		refreshData,
		handlePageChange,
		handleRowsPerPageChange,
		handleSearchChange,
		statusFilter,
		handleStatusFilterChange,
		formOpen,
		setFormOpen,
		editingProject,
		projectMutating,
		handleSubmit,
		deleteTarget,
		setDeleteTarget,
		deleteLoading,
		handleCreateClick,
		handleEdit,
		handleRowClick,
		handleDeleteRequest,
		handleConfirmDelete,
	} = useProjectsManagement();

	return (
		<Box component="main" sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
			<Container maxWidth="xl" sx={{ py: { xs: 2, sm: 4 } }}>
				<PageHeader
					title="Projects"
					subtitle="Delivery projects converted from Won deals, tracked through to completion"
				/>

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
					onEdit={handleEdit}
					onDelete={handleDeleteRequest}
				/>

				<ProjectFormDialog
					open={formOpen}
					onClose={() => setFormOpen(false)}
					project={editingProject}
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
