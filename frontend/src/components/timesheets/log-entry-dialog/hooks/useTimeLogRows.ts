import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { fetchProjects, fetchTaskStatuses, fetchProjectTaskOptions } from '../../../../store/slices/projectsSlice';
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
	const { projects, taskStatuses, projectTaskOptions, projectTaskOptionsLoading } = useAppSelector((state) => state.projects);

	const [rows, setRows] = useState<RowDraft[]>([makeEmptyRow(defaultDate, hasProjectModule ? 'project_task' : 'general')]);
	const [error, setError] = useState<string | null>(null);

	// Module is off for this org, so the sibling-tasks endpoint (also module-gated)
	// isn't reachable -- fall back to the one task the log itself already carries,
	// just so the edit row's Task field isn't blank.
	const [moduleOffFallbackTask, setModuleOffFallbackTask] = useState<ProjectTask | null>(null);

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

	const projectPublicIdFor = useCallback(
		(projectId: number | '') => visibleProjects.find((p) => p.id === projectId)?.public_id,
		[visibleProjects]
	);

	const getRowTasks = useCallback(
		(row: RowDraft): ProjectTask[] => {
			if (!hasProjectModule) return moduleOffFallbackTask ? [moduleOffFallbackTask] : [];
			const publicId = projectPublicIdFor(row.projectId);
			return publicId ? projectTaskOptions[publicId] ?? [] : [];
		},
		[hasProjectModule, moduleOffFallbackTask, projectPublicIdFor, projectTaskOptions]
	);

	const isRowTasksLoading = useCallback(
		(row: RowDraft): boolean => {
			const publicId = projectPublicIdFor(row.projectId);
			return publicId ? !!projectTaskOptionsLoading[publicId] : false;
		},
		[projectPublicIdFor, projectTaskOptionsLoading]
	);

	const getVisibleTasks = useCallback(
		(row: RowDraft): ProjectTask[] =>
			getRowTasks(row).filter(
				(t) => (t.assignee_id === currentUserId && !doneStatusIds.has(t.status_id)) || t.id === row.taskId
			),
		[getRowTasks, currentUserId, doneStatusIds]
	);

	// Initialize rows whenever the dialog is opened (edit a single log, or start a fresh add-row flow)
	useEffect(() => {
		if (!open) return;
		setError(null);
		setModuleOffFallbackTask(null);

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
					dispatch(fetchProjectTaskOptions(log.project.public_id));
				} else if (log.task) {
					setModuleOffFallbackTask(log.task);
				}
			}
		} else {
			setRows([makeEmptyRow(defaultDate, hasProjectModule ? 'project_task' : 'general')]);
		}
	}, [open, log, defaultDate, hasProjectModule, dispatch]);

	const updateRow = (key: string, patch: Partial<RowDraft>) => {
		setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
	};

	const handleProjectChange = (key: string, projectId: number) => {
		updateRow(key, { projectId, taskId: '' });
		const project = visibleProjects.find((p) => p.id === projectId);
		if (project) {
			dispatch(fetchProjectTaskOptions(project.public_id));
		}
	};

	const handleTaskChange = (key: string, taskId: number, row: RowDraft) => {
		// Pre-fill the billing type from the task's own default -- the user can still
		// override it below, but most tasks are consistently billable/non-billable.
		const task = getVisibleTasks(row).find((t) => t.id === taskId);
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
		isRowTasksLoading,
		updateRow,
		handleProjectChange,
		handleTaskChange,
		handleAddRow,
		handleRemoveRow
	};
};
