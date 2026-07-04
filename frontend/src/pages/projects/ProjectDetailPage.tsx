import React from 'react';
import { Box, Container, Stack, Button, ToggleButtonGroup, ToggleButton, CircularProgress, Typography } from '@mui/material';
import { ViewKanban, ViewList, AddOutlined, TuneOutlined } from '@mui/icons-material';
import PageHeader from '../../components/common/page-header';
import { ConfirmationDialog } from '../../components/common/dialogbox';
import {
	ProjectDetailHeader,
	ProjectTaskKanbanBoard,
	ProjectTaskList,
	ProjectTaskFormDialog,
	ProjectTaskStatusManagementDialog,
	useProjectDetail,
} from '../../components/projects';

const ProjectDetailPage: React.FC = () => {
	const {
		project,
		projectLoading,
		tasks,
		tasksLoading,
		taskMutating,
		taskStatuses,
		owners,
		viewMode,
		setViewMode,
		taskFormOpen,
		setTaskFormOpen,
		editingTask,
		subtaskParent,
		handleCreateTaskClick,
		handleAddSubtaskClick,
		handleEditTaskClick,
		handleTaskFormSubmit,
		handleMoveTask,
		deleteTarget,
		setDeleteTarget,
		deleteLoading,
		handleDeleteRequest,
		handleConfirmDelete,
		statusDialogOpen,
		setStatusDialogOpen,
	} = useProjectDetail();

	if (projectLoading && !project) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
				<CircularProgress />
			</Box>
		);
	}

	if (!project) {
		return (
			<Box sx={{ textAlign: 'center', py: 12 }}>
				<Typography color="text.secondary">Project not found.</Typography>
			</Box>
		);
	}

	return (
		<Box component="main" sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
			<Container maxWidth="xl" sx={{ py: { xs: 2, sm: 4 } }}>
				<PageHeader
					title={project.name}
					subtitle="Tasks and sub-tasks for this project"
					action={
						<Stack direction="row" spacing={1.5}>
							<Button
								variant="outlined"
								startIcon={<TuneOutlined />}
								onClick={() => setStatusDialogOpen(true)}
								sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px' }}
							>
								Manage Statuses
							</Button>
							<Button
								variant="contained"
								startIcon={<AddOutlined />}
								onClick={handleCreateTaskClick}
								sx={{
									color: 'white', textTransform: 'none', fontWeight: 700, borderRadius: '8px', boxShadow: 'none',
									background: 'linear-gradient(90deg, #8B7CF6 0%, #4EA8FF 100%)',
									'&:hover': { boxShadow: '0 4px 12px rgba(139,124,246,0.3)' },
								}}
							>
								Add Task
							</Button>
							<ToggleButtonGroup
								value={viewMode}
								exclusive
								onChange={(_, mode) => mode && setViewMode(mode)}
								size="small"
								sx={{
									bgcolor: 'background.paper',
									border: '1px solid',
									borderColor: 'divider',
									borderRadius: '10px',
									'& .MuiToggleButton-root': {
										textTransform: 'none', fontWeight: 700, px: 2, border: 'none', borderRadius: '8px',
										'&.Mui-selected': { bgcolor: 'primary.main', color: '#ffffff', '&:hover': { bgcolor: 'primary.dark' } },
									},
								}}
							>
								<ToggleButton value="kanban" aria-label="Kanban Board">
									<ViewKanban sx={{ mr: 1, fontSize: 16 }} />
									Kanban
								</ToggleButton>
								<ToggleButton value="list" aria-label="List View">
									<ViewList sx={{ mr: 1, fontSize: 16 }} />
									List
								</ToggleButton>
							</ToggleButtonGroup>
						</Stack>
					}
				/>

				<ProjectDetailHeader project={project} owners={owners} />

				{viewMode === 'kanban' ? (
					<ProjectTaskKanbanBoard
						tasks={tasks}
						statuses={taskStatuses}
						owners={owners}
						loading={tasksLoading}
						onMoveTask={handleMoveTask}
						onEditTask={handleEditTaskClick}
						onAddSubtask={handleAddSubtaskClick}
						onDeleteTask={handleDeleteRequest}
					/>
				) : (
					<ProjectTaskList
						tasks={tasks}
						statuses={taskStatuses}
						owners={owners}
						loading={tasksLoading}
						onEditTask={handleEditTaskClick}
						onAddSubtask={handleAddSubtaskClick}
						onDeleteTask={handleDeleteRequest}
					/>
				)}

				<ProjectTaskFormDialog
					open={taskFormOpen}
					onClose={() => setTaskFormOpen(false)}
					task={editingTask}
					parentTask={subtaskParent}
					statuses={taskStatuses}
					owners={owners}
					submitting={taskMutating}
					onSubmit={handleTaskFormSubmit}
				/>

				<ProjectTaskStatusManagementDialog
					open={statusDialogOpen}
					onClose={() => setStatusDialogOpen(false)}
				/>

				<ConfirmationDialog
					open={!!deleteTarget}
					onClose={() => setDeleteTarget(null)}
					onConfirm={handleConfirmDelete}
					title="Delete Task"
					message={`Are you sure you want to delete "${deleteTarget?.title}"? This will also delete every sub-task under it.`}
					confirmLabel="Delete"
					severity="error"
					loading={deleteLoading}
				/>
			</Container>
		</Box>
	);
};

export default ProjectDetailPage;
