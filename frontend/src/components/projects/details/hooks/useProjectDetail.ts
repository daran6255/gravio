import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import {
	fetchProject,
	updateProject,
	clearCurrentProject,
	fetchProjectTasks,
	fetchTaskStatuses,
	createProjectTask,
	createSubtask,
	updateProjectTask,
	deleteProjectTask,
} from '../../../../store/slices/projectsSlice';
import { fetchOwners } from '../../../../store/slices/crmSlice';
import useToast from '../../../../hooks/useToast';
import type { ProjectUpdate } from '../../../../models/projects/project';
import type { ProjectTask, ProjectTaskCreate, ProjectTaskUpdate, ProjectTaskStatus, ProjectTaskTag } from '../../../../models/projects/projectTask';

export const useProjectDetail = () => {
	const { publicId } = useParams<{ publicId: string }>();
	const dispatch = useAppDispatch();
	const navigate = useNavigate();
	const location = useLocation();
	const toast = useToast();
	const {
		currentProject, currentProjectLoading, currentProjectError, projectMutating,
		projectTasks, projectTasksLoading, taskMutating, taskStatuses, taskStatusesLoading,
	} = useAppSelector((state) => state.projects);
	const { owners } = useAppSelector((state) => state.crm);

	const [editOpen, setEditOpen] = useState(false);

	const [taskFormOpen, setTaskFormOpen] = useState(false);
	const [editingTask, setEditingTask] = useState<ProjectTask | null>(null);
	const [subtaskParent, setSubtaskParent] = useState<ProjectTask | null>(null);

	const [taskDeleteTarget, setTaskDeleteTarget] = useState<ProjectTask | null>(null);
	const [taskDeleteLoading, setTaskDeleteLoading] = useState(false);

	const [statusDialogOpen, setStatusDialogOpen] = useState(false);

	// Every tag ever used on a task in this project, deduped by name (first
	// occurrence wins the color) -- shown to every user on this project as
	// reusable suggestions instead of everyone re-picking their own color for
	// what's meant to be the same tag.
	const projectTags = useMemo<ProjectTaskTag[]>(() => {
		const seen = new Map<string, ProjectTaskTag>();
		for (const t of projectTasks) {
			for (const tag of t.tags ?? []) {
				const key = tag.name.toLowerCase();
				if (!seen.has(key)) seen.set(key, tag);
			}
		}
		return Array.from(seen.values());
	}, [projectTasks]);

	useEffect(() => {
		if (!publicId) return;
		dispatch(fetchProject(publicId));
		dispatch(fetchProjectTasks(publicId));
		return () => {
			dispatch(clearCurrentProject());
		};
	}, [dispatch, publicId]);

	useEffect(() => {
		dispatch(fetchOwners());
		dispatch(fetchTaskStatuses());
	}, [dispatch]);

	// `projects/:publicId` and `projects` are flat sibling routes (not nested), so
	// `navigate('..')` resolves against the route tree and lands on the layout's
	// own path ("/") instead of the projects list. Strip the trailing /:publicId
	// segment from the actual URL instead, which works under both /projects/:id
	// and /org/:orgId/projects/:id.
	const handleBack = () => navigate(location.pathname.replace(/\/[^/]+\/?$/, ''));

	const handleEditClick = () => setEditOpen(true);

	const handleEditSubmit = async (payload: ProjectUpdate) => {
		if (!publicId) return;
		try {
			await dispatch(updateProject({ publicId, payload })).unwrap();
			// The update response can come back with owner/company/deal names
			// unresolved (the repository's post-update refresh expires those
			// relationships), so re-fetch to get the fully enriched project.
			await dispatch(fetchProject(publicId));
			toast.success('Project updated');
			setEditOpen(false);
		} catch (err: any) {
			toast.error(err || 'Failed to update project');
		}
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

	const handleTaskDeleteRequest = (task: ProjectTask) => setTaskDeleteTarget(task);

	const handleConfirmTaskDelete = async () => {
		if (!taskDeleteTarget) return;
		setTaskDeleteLoading(true);
		try {
			await dispatch(deleteProjectTask(taskDeleteTarget.public_id)).unwrap();
			toast.success('Task deleted');
			setTaskDeleteTarget(null);
		} catch (err: any) {
			toast.error(err || 'Failed to delete task');
		} finally {
			setTaskDeleteLoading(false);
		}
	};

	return {
		project: currentProject,
		loading: currentProjectLoading,
		error: currentProjectError,
		owners,
		editOpen,
		setEditOpen,
		projectMutating,
		handleBack,
		handleEditClick,
		handleEditSubmit,

		tasks: projectTasks,
		tasksLoading: projectTasksLoading,
		taskMutating,
		taskStatuses,
		taskStatusesLoading,
		projectTags,

		taskFormOpen,
		setTaskFormOpen,
		editingTask,
		subtaskParent,
		handleCreateTaskClick,
		handleAddSubtaskClick,
		handleEditTaskClick,
		handleTaskFormSubmit,
		handleMoveTask,

		taskDeleteTarget,
		setTaskDeleteTarget,
		taskDeleteLoading,
		handleTaskDeleteRequest,
		handleConfirmTaskDelete,

		statusDialogOpen,
		setStatusDialogOpen,
	};
};

export default useProjectDetail;
