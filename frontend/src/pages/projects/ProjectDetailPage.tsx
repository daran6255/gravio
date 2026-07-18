import React from 'react';
import { Box, Container, Stack, Button, Typography, CircularProgress } from '@mui/material';
import { AddOutlined, TuneOutlined } from '@mui/icons-material';
import { responsiveStyles } from '../../theme';
import { ConfirmationDialog } from '../../components/common/dialogbox';
import {
	ProjectDetailHeader,
	ProjectEditDrawer,
	ProjectTaskKanbanBoard,
	ProjectTaskCreateDialog,
	ProjectTaskDetailDrawer,
	ProjectTaskStatusManagementDialog,
	useProjectDetail,
} from '../../components/projects';

const ProjectDetailPage: React.FC = () => {
	const {
		project,
		loading,
		owners,
		editOpen,
		setEditOpen,
		projectMutating,
		handleBack,
		handleEditClick,
		handleEditSubmit,

		tasks,
		tasksLoading,
		taskMutating,
		taskStatuses,
		projectTags,

		taskFormOpen,
		editingTask,
		subtaskParent,
		handleCreateTaskClick,
		handleAddSubtaskClick,
		handleEditTaskClick,
		handleCloseTaskForm,
		handleTaskFormSubmit,
		handleMoveTask,

		taskDeleteTarget,
		setTaskDeleteTarget,
		taskDeleteLoading,
		handleTaskDeleteRequest,
		handleConfirmTaskDelete,

		statusDialogOpen,
		setStatusDialogOpen,
	} = useProjectDetail();

	return (
		<Box component="main" sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
			<Container maxWidth={false} sx={responsiveStyles.pageContainer}>
				{loading && !project ? (
					<Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
						<CircularProgress size={40} thickness={3} />
					</Box>
				) : project ? (
					<>
						<ProjectDetailHeader project={project} tasks={tasks} owners={owners} onBack={handleBack} onEdit={handleEditClick} />

						<ProjectEditDrawer
							open={editOpen}
							onClose={() => setEditOpen(false)}
							project={project}
							owners={owners}
							submitting={projectMutating}
							onSubmit={handleEditSubmit}
						/>

						<Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={1.5} sx={{ mb: 1.5 }}>
							<Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '-0.01em' }}>
								Task Board
							</Typography>
							<Box sx={responsiveStyles.headerActionRow}>
								<Button
									variant="outlined"
									startIcon={<TuneOutlined />}
									onClick={() => setStatusDialogOpen(true)}
									sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px' }}
								>
									Manage Stages
								</Button>
								<Button
									variant="contained"
									startIcon={<AddOutlined />}
									onClick={handleCreateTaskClick}
									sx={(theme) => ({
										color: '#ffffff', textTransform: 'none', fontWeight: 700, borderRadius: '10px', px: 3, py: 1,
										background: theme.gradients.brandDiagonal,
										boxShadow: '0 4px 14px 0 rgba(139, 124, 246, 0.4)',
										border: 'none',
										transition: 'all 0.2s ease',
										'&:hover': {
											background: theme.gradients.brandDiagonalHover,
											boxShadow: '0 6px 20px 0 rgba(139, 124, 246, 0.6)',
											transform: 'translateY(-1px)',
										},
									})}
								>
									Add Task
								</Button>
							</Box>
						</Stack>

						<ProjectTaskKanbanBoard
							tasks={tasks}
							statuses={taskStatuses}
							owners={owners}
							loading={tasksLoading}
							onMoveTask={handleMoveTask}
							onEditTask={handleEditTaskClick}
							onAddSubtask={handleAddSubtaskClick}
							onDeleteTask={handleTaskDeleteRequest}
						/>

						{editingTask ? (
							<ProjectTaskDetailDrawer
								open={taskFormOpen}
								onClose={handleCloseTaskForm}
								task={editingTask}
								tasks={tasks}
								projectName={project.name}
								statuses={taskStatuses}
								owners={owners}
								existingTags={projectTags}
								onSubmit={handleTaskFormSubmit}
								onDelete={() => handleTaskDeleteRequest(editingTask)}
								onAddSubtask={handleAddSubtaskClick}
							/>
						) : (
							<ProjectTaskCreateDialog
								open={taskFormOpen}
								onClose={handleCloseTaskForm}
								parentTask={subtaskParent}
								projectName={project.name}
								tasks={tasks}
								statuses={taskStatuses}
								owners={owners}
								existingTags={projectTags}
								submitting={taskMutating}
								onSubmit={handleTaskFormSubmit}
							/>
						)}

						<ProjectTaskStatusManagementDialog
							open={statusDialogOpen}
							onClose={() => setStatusDialogOpen(false)}
						/>

						<ConfirmationDialog
							open={!!taskDeleteTarget}
							onClose={() => setTaskDeleteTarget(null)}
							onConfirm={handleConfirmTaskDelete}
							title="Delete Task"
							message={`Are you sure you want to delete "${taskDeleteTarget?.title}"? This will also delete every sub-task under it.`}
							confirmLabel="Delete"
							severity="error"
							loading={taskDeleteLoading}
						/>
					</>
				) : (
					<Box sx={{ py: 10, textAlign: 'center' }}>
						<Typography color="text.secondary">Project not found.</Typography>
					</Box>
				)}
			</Container>
		</Box>
	);
};

export default ProjectDetailPage;
