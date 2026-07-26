import React, { useState } from 'react';
import { Box, Container, Grid, Stack } from '@mui/material';
import {
	HelpOutline as HelpIcon,
	AutoAwesome,
	ChatBubbleOutlineRounded,
	ScheduleOutlined,
	AccountTreeOutlined,
	ShieldOutlined,
	LightbulbOutlined,
} from '@mui/icons-material';
import { responsiveStyles } from '../../theme';
import PageHeader from '../../components/common/page-header';
import { HelpGuideButton } from '../../components/common/button';
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
	subtitle: 'Learn how to create projects, manage tasks, and work with IRIS.',
	banner: {
		title: 'Welcome to your Projects Workspace!',
		description: 'Configure delivery projects, assign owners, and track deliverables. Let\'s get started by creating your first project.'
	},
	tabs: [
		{
			label: 'Project Setup',
			intro: 'Three steps to get a new delivery project up and running:',
			steps: [
				{
					marker: '1',
					accent: 'primary' as const,
					title: 'Create the project',
					description: 'Click "Create Project" to start one from scratch, or convert a Won deal from the CRM — either way, a new delivery workspace is set up for you.'
				},
				{
					marker: '2',
					accent: 'info' as const,
					title: 'Assign a project owner',
					description: 'Pick a manager or administrator as the owner. They\'re responsible for deliverables, timelines, and budget for this project.'
				},
				{
					marker: '3',
					accent: 'success' as const,
					title: 'Set timelines & budget',
					description: 'Add a start/end date and an estimated-hours budget. These are what the Projects dashboard uses to flag things as on track, at risk, or overdue.'
				}
			]
		},
		{
			label: 'Tasks & Sub-tasks',
			intro: 'Open a project to break its work into tasks, and tasks into sub-tasks. Here\'s what each field is for:',
			steps: [
				{
					marker: '1',
					accent: 'primary' as const,
					title: 'Tasks vs. sub-tasks',
					description: 'A task is a chunk of work (e.g. "Frontend"). A sub-task is a smaller piece of it (e.g. "Dashboard UI"). Use both to keep a project organized instead of one long flat list.'
				},
				{
					marker: '2',
					accent: 'info' as const,
					title: 'The fields that matter most',
					description: '• Title — what needs to get done.\n• Assignees — only people assigned to a task can log hours against it in their weekly timesheet.\n• Estimated Hours — the effort budget you\'re measuring actuals against.\n• Billing Type — Billable or Non-Billable, so client hours and internal work don\'t get mixed up.'
				},
				{
					marker: '3',
					accent: 'success' as const,
					title: 'Why it\'s worth setting up properly',
					description: '• Prevents people from logging time on work that isn\'t theirs.\n• Lets you compare estimated vs. actual hours in real time.\n• Keeps billable client hours cleanly separated from internal overhead.'
				}
			]
		},
		{
			label: 'Ask IRIS',
			intro: 'IRIS is your AI co-worker inside every task. Open a task and click "Ask IRIS" (top-right of the task drawer) to use it. Nothing IRIS suggests is applied until you click Confirm.',
			infoSections: [
				{
					heading: 'What IRIS can do for a task',
					cards: [
						{
							title: 'Get insights',
							icons: [AutoAwesome],
							description: 'IRIS reads the task and tells you if it\'s On track, At risk, or Blocked, with plain-language reasons and suggestions — useful for a quick health check before a status meeting.'
						},
						{
							title: 'Get an estimate',
							icons: [ScheduleOutlined],
							description: 'IRIS suggests an hour estimate based on the task\'s description and similar work, with a short rationale. One click applies it to the task\'s Estimated Hours field.'
						},
						{
							title: 'Ask it to make changes',
							icons: [ChatBubbleOutlineRounded, AccountTreeOutlined],
							description: 'Type a plain-English instruction — "break this into subtasks", "mark all subtasks done", "bump this to high priority", "summarize the comments" — or use the quick-action chips for the common ones.'
						},
						{
							title: 'Enhance a description',
							icons: [AutoAwesome],
							description: 'While writing or editing a task\'s description, click "Enhance with IRIS" to fix typos, tighten the wording, or expand a rough note into a fuller description.'
						}
					]
				}
			],
			tips: [
				{
					icon: ShieldOutlined,
					accent: 'primary' as const,
					title: 'IRIS always proposes before it acts',
					description: 'Every request first shows a plan — the exact fields it will change or subtasks it will create. Nothing happens until you click Confirm, and you can cancel or ask a follow-up question instead.'
				},
				{
					icon: LightbulbOutlined,
					accent: 'success' as const,
					title: 'If IRIS asks a question, just answer it',
					description: 'Sometimes IRIS needs more detail before it can propose a plan (e.g. "how many subtasks?"). Reply in the same box — it remembers what you originally asked and re-plans with your answer.'
				},
				{
					icon: AutoAwesome,
					accent: 'info' as const,
					title: 'Every IRIS action is logged',
					description: 'Anything IRIS confirms and does shows up in the task\'s "Recent activity" and full history, so the rest of the team can see what changed and why.'
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
						<HelpGuideButton onClick={() => setGuideOpen(true)} sx={{ borderRadius: '8px' }} />
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
