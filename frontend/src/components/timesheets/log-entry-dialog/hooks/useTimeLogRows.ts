import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { fetchProjects, fetchTaskStatuses } from '../../../../store/slices/projectsSlice';
import projectService from '../../../../services/projectService';
import type { ProjectTimeLog } from '../../../../models/timesheet';
import type { ProjectTask } from '../../../../models/projects/projectTask';
import type { Project } from '../../../../models/projects/project';
import type { RowDraft } from '../types';
import { makeEmptyRow } from '../utils';

interface UseTimeLogRowsArgs {
	open: boolean;
	log?: ProjectTimeLog;
	defaultDate?: string;
	hasProjectModule: boolean;
	currentUserId?: number;
}

// Owns the row-draft state for the log-time form: initializing rows from an
// existing log (or a fresh blank row), and every row-level mutation (project/task
// selection, task list loading, add/remove row).
export const useTimeLogRows = ({ open, log, defaultDate, hasProjectModule, currentUserId }: UseTimeLogRowsArgs) => {
	const dispatch = useAppDispatch();
	const { projects, taskStatuses } = useAppSelector((state) => state.projects);

	const [rows, setRows] = useState<RowDraft[]>([makeEmptyRow(defaultDate, hasProjectModule ? 'project_task' : 'general')]);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (open && hasProjectModule) {
			// Only projects the current user actually works on -- owns, or has a task
			// assigned in -- and not ones that have already wrapped up.
			dispatch(fetchProjects({ pageSize: 100, assignedToMe: true, excludeCompleted: true }));
			dispatch(fetchTaskStatuses());
		}
	}, [open, dispatch, hasProjectModule]);

	// Editing a log whose project/task has since been completed, or is no longer
	// assigned to this user, must still show that project/task rather than a blank
	// field -- so it's stitched back into the "active, mine" lists just for display.
	const visibleProjects = useMemo<Project[]>(() => {
		if (log?.project && !projects.some((p) => p.id === log.project!.id)) {
			return [log.project, ...projects];
		}
		return projects;
	}, [projects, log]);

	const doneStatusIds = useMemo(
		() => new Set(taskStatuses.filter((s) => s.is_done_status).map((s) => s.id)),
		[taskStatuses]
	);

	const getVisibleTasks = useCallback(
		(row: RowDraft): ProjectTask[] =>
			row.tasks.filter(
				(t) => (t.assignee_id === currentUserId && !doneStatusIds.has(t.status_id)) || t.id === row.taskId
			),
		[currentUserId, doneStatusIds]
	);

	const loadTasksForProject = useCallback(async (rowKey: string, projectPublicId: string) => {
		setRows((prev) => prev.map((r) => (r.key === rowKey ? { ...r, tasksLoading: true } : r)));
		try {
			const tasks = await projectService.listProjectTasks(projectPublicId);
			setRows((prev) => prev.map((r) => (r.key === rowKey ? { ...r, tasks, tasksLoading: false } : r)));
		} catch {
			setRows((prev) => prev.map((r) => (r.key === rowKey ? { ...r, tasks: [], tasksLoading: false } : r)));
		}
	}, []);

	// Initialize rows whenever the dialog is opened (edit a single log, or start a fresh add-row flow)
	useEffect(() => {
		if (!open) return;
		setError(null);

		if (log) {
			const row = makeEmptyRow(log.log_date);
			row.hours = log.hours.toString();
			row.billingType = log.billing_type;
			row.notes = log.notes || '';

			if (log.project_id && log.task_id) {
				row.logAgainst = 'project_task';
				row.projectId = log.project_id;
				row.taskId = log.task_id;
			} else if (log.project_id) {
				row.logAgainst = 'project_only';
				row.projectId = log.project_id;
			} else {
				row.logAgainst = 'general';
				row.categoryId = log.category_id || '';
			}

			setRows([row]);

			if (log.project_id && log.task_id && log.project?.public_id) {
				if (hasProjectModule) {
					loadTasksForProject(row.key, log.project.public_id);
				} else if (log.task) {
					// Module is off for this org, so the sibling-tasks endpoint (also
					// module-gated) isn't reachable -- fall back to the one task the
					// log itself already carries, just so the field isn't blank.
					setRows((prev) => prev.map((r) => (r.key === row.key ? { ...r, tasks: [log.task!] } : r)));
				}
			}
		} else {
			setRows([makeEmptyRow(defaultDate, hasProjectModule ? 'project_task' : 'general')]);
		}
	}, [open, log, defaultDate, loadTasksForProject, hasProjectModule]);

	const updateRow = (key: string, patch: Partial<RowDraft>) => {
		setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
	};

	const handleProjectChange = (key: string, projectId: number) => {
		updateRow(key, { projectId, taskId: '', tasks: [] });
		const project = visibleProjects.find((p) => p.id === projectId);
		if (project) {
			loadTasksForProject(key, project.public_id);
		}
	};

	const handleTaskChange = (key: string, taskId: number, row: RowDraft) => {
		// Pre-fill the billing type from the task's own default -- the user can still
		// override it below, but most tasks are consistently billable/non-billable.
		const task = row.tasks.find((t) => t.id === taskId);
		updateRow(key, { taskId, ...(task ? { billingType: task.billing_type } : {}) });
	};

	const handleAddRow = () => {
		setRows((prev) => [...prev, makeEmptyRow(defaultDate, hasProjectModule ? 'project_task' : 'general')]);
	};

	const handleRemoveRow = (key: string) => {
		setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.key !== key) : prev));
	};

	return {
		rows,
		setRows,
		error,
		setError,
		visibleProjects,
		doneStatusIds,
		getVisibleTasks,
		updateRow,
		handleProjectChange,
		handleTaskChange,
		handleAddRow,
		handleRemoveRow
	};
};
