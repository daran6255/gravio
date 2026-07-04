import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
	fetchProject,
	fetchProjectTasks,
	fetchTaskStatuses,
	createProjectTask,
	createSubtask,
	updateProjectTask,
	deleteProjectTask,
	clearCurrentProject,
} from '../../../store/slices/projectsSlice';
import { fetchOwners } from '../../../store/slices/crmSlice';
import useToast from '../../../hooks/useToast';
import type { ProjectTask, ProjectTaskCreate, ProjectTaskUpdate, ProjectTaskStatus } from '../../../models/projects/projectTask';

export type ProjectDetailViewMode = 'kanban' | 'list';

export const useProjectDetail = () => {
	const { publicId } = useParams<{ publicId: string }>();
	const dispatch = useAppDispatch();
	const toast = useToast();

	const { currentProject, currentProjectLoading, projectTasks, projectTasksLoading, taskMutating, taskStatuses, taskStatusesLoading } =
		useAppSelector((state) => state.projects);
	const { owners } = useAppSelector((state) => state.crm);

	const [viewMode, setViewMode] = useState<ProjectDetailViewMode>('kanban');

	const [taskFormOpen, setTaskFormOpen] = useState(false);
	const [editingTask, setEditingTask] = useState<ProjectTask | null>(null);
	const [subtaskParent, setSubtaskParent] = useState<ProjectTask | null>(null);

	const [deleteTarget, setDeleteTarget] = useState<ProjectTask | null>(null);
	const [deleteLoading, setDeleteLoading] = useState(false);

	const [statusDialogOpen, setStatusDialogOpen] = useState(false);

	useEffect(() => {
		if (!publicId) return;
		dispatch(fetchProject(publicId));
		dispatch(fetchProjectTasks(publicId));
		return () => {
			dispatch(clearCurrentProject());
		};
	}, [dispatch, publicId]);

	useEffect(() => {
		dispatch(fetchTaskStatuses());
		dispatch(fetchOwners());
	}, [dispatch]);

	const refreshTasks = () => {
		if (publicId) dispatch(fetchProjectTasks(publicId));
	};

	const handleCreateTaskClick = () => {
		setEditingTask(null);
		setSubtaskParent(null);
		setTaskFormOpen(true);
	};

	const handleAddSubtaskClick = (parent: ProjectTask) => {
		setEditingTask(null);
		setSubtaskParent(parent);
		setTaskFormOpen(true);
	};

	const handleEditTaskClick = (task: ProjectTask) => {
		setEditingTask(task);
		setSubtaskParent(null);
		setTaskFormOpen(true);
	};

	const handleTaskFormSubmit = async (payload: ProjectTaskCreate | ProjectTaskUpdate) => {
		if (!publicId) return;
		if (editingTask) {
			await dispatch(updateProjectTask({ taskPublicId: editingTask.public_id, payload })).unwrap();
			toast.success('Task updated');
		} else if (subtaskParent) {
			await dispatch(createSubtask({ parentTaskPublicId: subtaskParent.public_id, payload: payload as ProjectTaskCreate })).unwrap();
			toast.success('Sub-task created');
		} else {
			await dispatch(createProjectTask({ projectPublicId: publicId, payload: payload as ProjectTaskCreate })).unwrap();
			toast.success('Task created');
		}
		setTaskFormOpen(false);
	};

	const handleMoveTask = async (task: ProjectTask, targetStatus: ProjectTaskStatus) => {
		try {
			await dispatch(updateProjectTask({ taskPublicId: task.public_id, payload: { status_id: targetStatus.id } })).unwrap();
			toast.success(`Moved to ${targetStatus.name}`);
		} catch (err: any) {
			toast.error(err || 'Failed to move task');
		}
	};

	const handleDeleteRequest = (task: ProjectTask) => setDeleteTarget(task);

	const handleConfirmDelete = async () => {
		if (!deleteTarget) return;
		setDeleteLoading(true);
		try {
			await dispatch(deleteProjectTask(deleteTarget.public_id)).unwrap();
			toast.success('Task deleted');
			setDeleteTarget(null);
		} catch (err: any) {
			toast.error(err || 'Failed to delete task');
		} finally {
			setDeleteLoading(false);
		}
	};

	return {
		project: currentProject,
		projectLoading: currentProjectLoading,
		tasks: projectTasks,
		tasksLoading: projectTasksLoading,
		taskMutating,
		taskStatuses,
		taskStatusesLoading,
		owners,
		refreshTasks,

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
	};
};

export default useProjectDetail;
