import React, { useState } from 'react';
import { Box, Container, Grid, Stack, Button } from '@mui/material';
import { HelpOutline as HelpIcon } from '@mui/icons-material';
import { responsiveStyles } from '../../theme';
import PageHeader from '../../components/common/page-header';
import { ConfirmationDialog } from '../../components/common/dialogbox';
import { WelcomeBanner } from '../../components/common/guide/WelcomeBanner';
import { HelpGuideDrawer } from '../../components/common/guide/HelpGuideDrawer';
import {
	ProjectsTable,
	ProjectCreateDrawer,
	ProjectsStatsPanel,
	ProjectAttentionPanel,
	ProjectStatusBreakdown,
	ProjectsBulkActionBar,
	useProjectsManagement,
} from '../../components/projects';

const guideContent = {
	icon: HelpIcon,
	title: 'Projects Workspace Guide',
	subtitle: 'Learn how to create projects, configure tasks, and assign team members.',
	banner: {
		title: 'Welcome to your Projects Workspace!',
		description: 'Configure delivery projects, assign owners, and track deliverables. Let\'s get started by creating your first project.'
	},
	tabs: [
		{
			label: 'Project Setup',
			intro: 'Follow these steps to establish a new delivery project:',
			steps: [
				{
					marker: '1',
					accent: 'primary' as const,
					title: 'Create Project Workspace',
					description: 'Click "Create Project" or convert won deals from CRM to initialize a delivery workspace.'
				},
				{
					marker: '2',
					accent: 'info' as const,
					title: 'Assign Project Owner',
					description: 'Set a manager or administrator as the project owner to oversee deliverables, timelines, and budgets.'
				},
				{
					marker: '3',
					accent: 'success' as const,
					title: 'Manage Timelines & Budgets',
					description: 'Set start/end dates and allocate estimated hours to measure performance and delivery efficiency.'
				}
			]
		},
		{
			label: 'Tasks & Sub-tasks',
			intro: 'Define operational tasks and sub-tasks within your project. Here is how creation fields help your team:',
			steps: [
				{
					marker: '1',
					accent: 'primary' as const,
					title: 'Hierarchy (Tasks & Sub-tasks)',
					description: 'Break down deliverables into parent tasks (e.g., "Frontend") and child sub-tasks (e.g., "Dashboard UI"). This structure helps organize work scopes clearly.'
				},
				{
					marker: '2',
					accent: 'info' as const,
					title: 'Key Fields Explained',
					description: '• Title: Defines the deliverable.\n• Assignees: Only assigned resources can select and log hours on this task in their weekly timesheets.\n• Estimated Hours: Sets an effort budget.\n• Billing Type: Mark as Billable or Non-Billable.'
				},
				{
					marker: '3',
					accent: 'success' as const,
					title: 'How It Helps You',
					description: '• Restricts unauthorized logging by resource allocation.\n• Compares estimated hours vs. actual logged timesheet hours in real-time.\n• Distinguishes billable clients hours from internal overhead tasks.'
				}
			]
		}
	]
};

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

	const [guideOpen, setGuideOpen] = useState(false);
	const [showBanner, setShowBanner] = useState(() => {
		return !localStorage.getItem('dismissed_projects_onboarding');
	});

	return (
		<Box component="main" sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
			<Container maxWidth={false} sx={responsiveStyles.pageContainer}>
				<PageHeader
					title="Projects"
					subtitle="Delivery projects converted from Won deals"
					action={
						<Button
							variant="outlined"
							size="small"
							startIcon={<HelpIcon />}
							onClick={() => setGuideOpen(true)}
							sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700 }}
						>
							Help Guide
						</Button>
					}
				/>

				{showBanner && !projectsLoading && projects.length === 0 && (
					<WelcomeBanner
						icon={HelpIcon}
						title={guideContent.banner.title}
						description={guideContent.banner.description}
						onExplore={() => { setGuideOpen(true); }}
						onDismiss={() => {
							localStorage.setItem('dismissed_projects_onboarding', 'true');
							setShowBanner(false);
						}}
						exploreLabel="Explore Guide"
					/>
				)}

				<ProjectsStatsPanel stats={projectStats} />

				<Grid container spacing={responsiveStyles.statsGridSpacing}>
					<Grid size={{ xs: 12, md: 3 }}>
						<Stack spacing={responsiveStyles.statsGridSpacing}>
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

				{/* Help Guide Drawer */}
				<HelpGuideDrawer
					open={guideOpen}
					onClose={() => setGuideOpen(false)}
					content={guideContent}
				/>
			</Container>
		</Box>
	);
};

export default ProjectsListPage;
