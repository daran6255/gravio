import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
	Button,
	TextField,
	MenuItem,
	Stack,
	ToggleButtonGroup,
	ToggleButton,
	Alert,
	IconButton,
	Typography,
	Divider,
	CircularProgress
} from '@mui/material';
import { Add as AddIcon, DeleteOutline as DeleteIcon } from '@mui/icons-material';
import { BaseDialog } from '../common/dialogbox';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { createTimeLog, updateTimeLog, fetchMyCategories } from '../../store/slices/timesheetSlice';
import { fetchProjects, fetchTaskStatuses } from '../../store/slices/projectsSlice';
import projectService from '../../services/projectService';
import type { ProjectTimeLog } from '../../models/timesheet';
import type { ProjectTask } from '../../models/projects/projectTask';
import type { Project } from '../../models/projects/project';

interface TimeLogEntryFormDialogProps {
	open: boolean;
	onClose: () => void;
	log?: ProjectTimeLog;
	defaultDate?: string;
	onSave?: () => void;
}

type LogAgainst = 'project_task' | 'project_only' | 'general';

interface RowDraft {
	key: string;
	logAgainst: LogAgainst;
	projectId: number | '';
	taskId: number | '';
	categoryId: number | '';
	logDate: string;
	hours: string;
	billingType: 'billable' | 'non_billable';
	notes: string;
	tasks: ProjectTask[];
	tasksLoading: boolean;
}

let rowKeySeq = 0;
const nextRowKey = () => `row_${Date.now()}_${rowKeySeq++}`;

const makeEmptyRow = (defaultDate?: string): RowDraft => ({
	key: nextRowKey(),
	logAgainst: 'project_task',
	projectId: '',
	taskId: '',
	categoryId: '',
	logDate: defaultDate || new Date().toISOString().split('T')[0],
	hours: '',
	billingType: 'billable',
	notes: '',
	tasks: [],
	tasksLoading: false
});

const buildLogPayload = (row: RowDraft) => ({
	project_id: row.logAgainst !== 'general' ? (row.projectId as number) : null,
	task_id: row.logAgainst === 'project_task' ? (row.taskId as number) : null,
	category_id: row.logAgainst === 'general' ? (row.categoryId as number) : null,
	log_date: row.logDate,
	hours: parseFloat(row.hours),
	notes: row.notes || null,
	billing_type: row.billingType
});

const TimeLogEntryFormDialog: React.FC<TimeLogEntryFormDialogProps> = ({
	open,
	onClose,
	log,
	defaultDate,
	onSave
}) => {
	const dispatch = useAppDispatch();
	const currentUser = useAppSelector((state) => state.auth.user);
	const { projects, taskStatuses } = useAppSelector((state) => state.projects);
	const { categories } = useAppSelector((state) => state.timesheets);

	const isEdit = !!log;

	const [rows, setRows] = useState<RowDraft[]>([makeEmptyRow(defaultDate)]);
	const [error, setError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);

	useEffect(() => {
		if (open) {
			// Only projects the current user actually works on -- owns, or has a task
			// assigned in -- and not ones that have already wrapped up.
			dispatch(fetchProjects({ pageSize: 100, assignedToMe: true, excludeCompleted: true }));
			dispatch(fetchMyCategories());
			dispatch(fetchTaskStatuses());
		}
	}, [open, dispatch]);

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
				(t) => (t.assignee_id === currentUser?.id && !doneStatusIds.has(t.status_id)) || t.id === row.taskId
			),
		[currentUser?.id, doneStatusIds]
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
				loadTasksForProject(row.key, log.project.public_id);
			}
		} else {
			setRows([makeEmptyRow(defaultDate)]);
		}
	}, [open, log, defaultDate, loadTasksForProject]);

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
		setRows((prev) => [...prev, makeEmptyRow(defaultDate)]);
	};

	const handleRemoveRow = (key: string) => {
		setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.key !== key) : prev));
	};

	const validateRow = (row: RowDraft): string | null => {
		const hrs = parseFloat(row.hours);
		if (isNaN(hrs) || hrs <= 0 || hrs > 24) {
			return 'Hours must be between 0.1 and 24.0';
		}
		if (!row.logDate) {
			return 'Date is required';
		}
		if (row.logAgainst === 'project_task' && (!row.projectId || !row.taskId)) {
			return 'Project and Task are required';
		}
		if (row.logAgainst === 'project_only' && !row.projectId) {
			return 'Project is required';
		}
		if (row.logAgainst === 'general' && !row.categoryId) {
			return 'Category is required';
		}
		return null;
	};

	const handleSubmit = async () => {
		setError(null);

		for (let i = 0; i < rows.length; i++) {
			const rowError = validateRow(rows[i]);
			if (rowError) {
				setError(rows.length > 1 ? `Row ${i + 1}: ${rowError}` : rowError);
				return;
			}
		}

		setSubmitting(true);

		try {
			if (isEdit && log) {
				await dispatch(updateTimeLog({ id: log.id, data: buildLogPayload(rows[0]) })).unwrap();
			} else {
				for (const row of rows) {
					await dispatch(createTimeLog(buildLogPayload(row))).unwrap();
				}
			}
			onSave?.();
			onClose();
		} catch (err: any) {
			// Refresh so any rows that succeeded before the failure still show up in the grid
			onSave?.();
			setError(err || 'An error occurred while saving the time log(s)');
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<BaseDialog
			open={open}
			onClose={onClose}
			title={isEdit ? 'Edit Time Entry' : 'Log Time'}
			subtitle={isEdit ? undefined : 'Add hours across one or more projects and activities for the day'}
			maxWidth="sm"
			loading={submitting}
			actions={
				<>
					<Button onClick={onClose} disabled={submitting}>
						Cancel
					</Button>
					<Button
						variant="contained"
						onClick={handleSubmit}
						disabled={submitting}
						sx={{ fontWeight: 700, borderRadius: '8px' }}
					>
						{submitting ? (
							<CircularProgress size={18} />
						) : isEdit ? (
							'Update Entry'
						) : rows.length > 1 ? (
							`Log ${rows.length} Entries`
						) : (
							'Log Time'
						)}
					</Button>
				</>
			}
		>
			<Stack spacing={2.5}>
				{error && (
					<Alert severity="error" sx={{ borderRadius: '8px' }}>
						{error}
					</Alert>
				)}

				{rows.map((row, idx) => (
					<React.Fragment key={row.key}>
						{idx > 0 && <Divider />}
						<Stack spacing={2}>
							{rows.length > 1 && (
								<Stack direction="row" justifyContent="space-between" alignItems="center">
									<Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
										Entry {idx + 1}
									</Typography>
									<IconButton size="small" onClick={() => handleRemoveRow(row.key)} disabled={submitting}>
										<DeleteIcon fontSize="small" />
									</IconButton>
								</Stack>
							)}

							<ToggleButtonGroup
								value={row.logAgainst}
								exclusive
								onChange={(_, val) =>
									val && updateRow(row.key, { logAgainst: val, projectId: '', taskId: '', categoryId: '', tasks: [] })
								}
								fullWidth
								size="small"
								disabled={submitting}
							>
								<ToggleButton value="project_task">Task</ToggleButton>
								<ToggleButton value="project_only">Project</ToggleButton>
								<ToggleButton value="general">General</ToggleButton>
							</ToggleButtonGroup>

							{row.logAgainst !== 'general' && (
								<TextField
									select
									label="Project"
									value={row.projectId}
									onChange={(e) => handleProjectChange(row.key, Number(e.target.value))}
									fullWidth
									required
									disabled={submitting}
									helperText={visibleProjects.length === 0 ? 'No active projects assigned to you' : undefined}
								>
									{visibleProjects.map((p) => (
										<MenuItem key={p.id} value={p.id}>
											{p.name}
										</MenuItem>
									))}
								</TextField>
							)}

							{row.logAgainst === 'project_task' && (
								<TextField
									select
									label="Task"
									value={row.taskId}
									onChange={(e) => handleTaskChange(row.key, Number(e.target.value), row)}
									fullWidth
									required
									disabled={!row.projectId || submitting}
									helperText={
										row.tasksLoading
											? 'Loading tasks...'
											: row.projectId && getVisibleTasks(row).length === 0
												? 'No active tasks assigned to you on this project'
												: undefined
									}
								>
									{getVisibleTasks(row).map((t) => (
										<MenuItem key={t.id} value={t.id} sx={{ display: 'block' }}>
											<Typography variant="body2">{t.title}</Typography>
											<Typography variant="caption" color="text.secondary">
												{t.billing_type === 'billable' ? 'Billable' : 'Non-Billable'}
												{t.priority ? ` · ${t.priority.charAt(0).toUpperCase()}${t.priority.slice(1)} priority` : ''}
												{t.due_date ? ` · Due ${t.due_date}` : ''}
												{doneStatusIds.has(t.status_id) ? ' · Completed' : ''}
											</Typography>
										</MenuItem>
									))}
								</TextField>
							)}

							{row.logAgainst === 'general' && (
								<TextField
									select
									label="Category"
									value={row.categoryId}
									onChange={(e) => updateRow(row.key, { categoryId: Number(e.target.value) })}
									fullWidth
									required
									disabled={submitting}
								>
									{categories.map((c) => (
										<MenuItem key={c.id} value={c.id}>
											{c.name}
										</MenuItem>
									))}
								</TextField>
							)}

							<Stack direction="row" spacing={2}>
								<TextField
									label="Date"
									type="date"
									value={row.logDate}
									onChange={(e) => updateRow(row.key, { logDate: e.target.value })}
									fullWidth
									required
									disabled={submitting}
									InputLabelProps={{ shrink: true }}
								/>
								<TextField
									label="Hours"
									type="number"
									inputProps={{ step: 0.25, min: 0.25, max: 24 }}
									value={row.hours}
									onChange={(e) => updateRow(row.key, { hours: e.target.value })}
									fullWidth
									required
									disabled={submitting}
									placeholder="e.g. 1.5"
								/>
							</Stack>

							<TextField
								select
								label="Billing Type"
								value={row.billingType}
								onChange={(e) => updateRow(row.key, { billingType: e.target.value as 'billable' | 'non_billable' })}
								fullWidth
								required
								disabled={submitting}
							>
								<MenuItem value="billable">Billable</MenuItem>
								<MenuItem value="non_billable">Non-Billable</MenuItem>
							</TextField>

							<TextField
								label="Notes / Description"
								multiline
								rows={2}
								value={row.notes}
								onChange={(e) => updateRow(row.key, { notes: e.target.value })}
								fullWidth
								disabled={submitting}
								placeholder="What did you work on?"
							/>
						</Stack>
					</React.Fragment>
				))}

				{!isEdit && (
					<Button
						startIcon={<AddIcon />}
						onClick={handleAddRow}
						disabled={submitting}
						sx={{ alignSelf: 'flex-start', fontWeight: 600, borderRadius: '8px' }}
					>
						Add Another Row
					</Button>
				)}
			</Stack>
		</BaseDialog>
	);
};

export default TimeLogEntryFormDialog;
