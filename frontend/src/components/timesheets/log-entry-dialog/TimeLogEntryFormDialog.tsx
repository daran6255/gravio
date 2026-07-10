import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
	Button,
	TextField,
	MenuItem,
	Stack,
	Box,
	ToggleButtonGroup,
	ToggleButton,
	Alert,
	IconButton,
	Typography,
	Divider,
	CircularProgress
} from '@mui/material';
import { Add as AddIcon, DeleteOutline as DeleteIcon, SettingsOutlined as ManageIcon } from '@mui/icons-material';
import { BaseDialog, ConfirmationDialog } from '../../common/dialogbox';
import { DatePicker } from '../../common/form';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { createTimeLog, updateTimeLog, deleteTimeLog, fetchMyCategories, createCategory, deleteCategory } from '../../../store/slices/timesheetSlice';
import { fetchProjects, fetchTaskStatuses } from '../../../store/slices/projectsSlice';
import projectService from '../../../services/projectService';
import useToast from '../../../hooks/useToast';
import type { ProjectTimeLog, TimesheetCategory } from '../../../models/timesheet';
import type { ProjectTask } from '../../../models/projects/projectTask';
import type { Project } from '../../../models/projects/project';

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

// Sentinel select value that opens the inline "create category" dialog instead of
// actually being assigned to a row -- never persisted to categoryId.
const ADD_NEW_CATEGORY = '__add_new_category__';

const CATEGORY_COLORS = [
	'#8B7CF6', '#10B981', '#F59E0B', '#3B82F6', '#EC4899',
	'#14B8A6', '#EF4444', '#6366F1', '#A855F7', '#6B7280'
];

const makeEmptyRow = (defaultDate?: string, defaultLogAgainst: LogAgainst = 'project_task'): RowDraft => ({
	key: nextRowKey(),
	logAgainst: defaultLogAgainst,
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
	const toast = useToast();
	const currentUser = useAppSelector((state) => state.auth.user);
	const { projects, taskStatuses } = useAppSelector((state) => state.projects);
	const { categories } = useAppSelector((state) => state.timesheets);

	const isEdit = !!log;
	// Mirrors the backend's own rule (only draft/rejected entries are deletable) --
	// the grid already blocks opening this dialog for submitted/approved logs, so
	// this is mostly a defensive guard against stale UI state.
	const canDelete = isEdit && !!log && (log.status === 'draft' || log.status === 'rejected');

	// The Project Management module is a separate plan add-on -- timesheets must work
	// standalone for orgs that never bought it (or a trial, which unlocks everything).
	// Without this check the Task/Project dropdowns would 403 on every open and dead-end.
	const hasProjectModule = useMemo(() => {
		if (currentUser?.is_superuser) return true;
		const org = currentUser?.organization;
		if (!org) return false;
		if (org.subscription_status === 'trial') return true;
		return org.plan?.enabled_modules?.includes('project_management') ?? false;
	}, [currentUser]);

	const [rows, setRows] = useState<RowDraft[]>([makeEmptyRow(defaultDate, hasProjectModule ? 'project_task' : 'general')]);
	const [error, setError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
	const [deleting, setDeleting] = useState(false);

	// Inline "add category" flow, triggered from the General row's Category select.
	const [newCategoryDialogOpen, setNewCategoryDialogOpen] = useState(false);
	const [newCategoryRowKey, setNewCategoryRowKey] = useState<string | null>(null);
	const [newCategoryName, setNewCategoryName] = useState('');
	const [newCategoryColor, setNewCategoryColor] = useState(CATEGORY_COLORS[0]);
	const [categoryError, setCategoryError] = useState<string | null>(null);
	const [creatingCategory, setCreatingCategory] = useState(false);

	// Manage/delete the categories the current user has personally added. Org-default
	// categories (user_id is null) aren't shown here -- the backend rejects deleting
	// those anyway (see update_category/delete_category in timesheets.py).
	const [manageCategoriesOpen, setManageCategoriesOpen] = useState(false);
	const [deleteCategoryTarget, setDeleteCategoryTarget] = useState<TimesheetCategory | null>(null);
	const [deletingCategory, setDeletingCategory] = useState(false);
	const myCategories = useMemo(
		() => categories.filter((c) => c.user_id === currentUser?.id),
		[categories, currentUser?.id]
	);

	useEffect(() => {
		if (open) {
			if (hasProjectModule) {
				// Only projects the current user actually works on -- owns, or has a task
				// assigned in -- and not ones that have already wrapped up.
				dispatch(fetchProjects({ pageSize: 100, assignedToMe: true, excludeCompleted: true }));
				dispatch(fetchTaskStatuses());
			}
			dispatch(fetchMyCategories());
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

	const handleDelete = async () => {
		if (!log) return;
		setDeleting(true);
		try {
			await dispatch(deleteTimeLog(log.id)).unwrap();
			toast.success('Time entry deleted');
			setConfirmDeleteOpen(false);
			onSave?.();
			onClose();
		} catch (err: any) {
			toast.error(err || 'Failed to delete time entry');
		} finally {
			setDeleting(false);
		}
	};

	const handleCategorySelectChange = (rowKey: string, value: string) => {
		if (value === ADD_NEW_CATEGORY) {
			setNewCategoryRowKey(rowKey);
			setNewCategoryName('');
			setNewCategoryColor(CATEGORY_COLORS[0]);
			setCategoryError(null);
			setNewCategoryDialogOpen(true);
			return;
		}
		updateRow(rowKey, { categoryId: Number(value) });
	};

	const handleCreateCategory = async () => {
		if (!newCategoryName.trim()) return;
		setCreatingCategory(true);
		setCategoryError(null);
		try {
			const created = await dispatch(
				createCategory({ name: newCategoryName.trim(), color: newCategoryColor })
			).unwrap();
			if (newCategoryRowKey) {
				updateRow(newCategoryRowKey, { categoryId: created.id });
			}
			toast.success('Category created');
			setNewCategoryDialogOpen(false);
			setNewCategoryRowKey(null);
			setNewCategoryName('');
		} catch (err: any) {
			setCategoryError(err || 'Failed to create category');
		} finally {
			setCreatingCategory(false);
		}
	};

	const handleConfirmDeleteCategory = async () => {
		if (!deleteCategoryTarget) return;
		const category = deleteCategoryTarget;
		setDeletingCategory(true);
		try {
			await dispatch(deleteCategory(category.id)).unwrap();
			toast.success(`"${category.name}" deleted`);
			// Any row that had this category selected loses it -- category_id would
			// otherwise point at something that no longer shows up in the dropdown.
			setRows((prev) => prev.map((r) => (r.categoryId === category.id ? { ...r, categoryId: '' } : r)));
			setDeleteCategoryTarget(null);
		} catch (err: any) {
			toast.error(err || 'Failed to delete category');
		} finally {
			setDeletingCategory(false);
		}
	};

	return (
		<>
			<BaseDialog
				open={open}
				onClose={onClose}
				title={isEdit ? 'Edit Time Entry' : 'Log Time'}
				subtitle={isEdit ? undefined : 'Add hours across one or more projects and activities for the day'}
				maxWidth="sm"
				loading={submitting}
				actions={
					<Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
						<Box>
							{canDelete && (
								<Button
									color="error"
									startIcon={<DeleteIcon />}
									onClick={() => setConfirmDeleteOpen(true)}
									disabled={submitting}
									sx={{ fontWeight: 700, borderRadius: '8px' }}
								>
									Delete
								</Button>
							)}
						</Box>
						<Stack direction="row" spacing={1}>
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
						</Stack>
					</Box>
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

								{hasProjectModule ? (
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
										<ToggleButton value="general">General</ToggleButton>
									</ToggleButtonGroup>
								) : (
									row.logAgainst === 'general' && (
										<Typography variant="caption" color="text.secondary">
											Logging general/internal time. Project-based logging isn't available on your organization's plan.
										</Typography>
									)
								)}

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
										onChange={(e) => handleCategorySelectChange(row.key, e.target.value as string)}
										fullWidth
										required
										disabled={submitting}
										helperText={categories.length === 0 ? "You don't have any categories yet -- add one below" : undefined}
									>
										{categories.map((c) => (
											<MenuItem key={c.id} value={c.id}>
												<Stack direction="row" spacing={1} alignItems="center">
													<Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: c.color || '#94A3B8', flexShrink: 0 }} />
													<Typography variant="body2">{c.name}</Typography>
												</Stack>
											</MenuItem>
										))}
										<Divider />
										<MenuItem value={ADD_NEW_CATEGORY} disabled={submitting}>
											<Stack direction="row" spacing={1} alignItems="center" sx={{ color: 'primary.main', fontWeight: 700 }}>
												<AddIcon fontSize="small" />
												<Typography variant="body2" sx={{ fontWeight: 700 }}>Add New Category</Typography>
											</Stack>
										</MenuItem>
									</TextField>
								)}

								{row.logAgainst === 'general' && myCategories.length > 0 && (
									<Button
										size="small"
										startIcon={<ManageIcon fontSize="small" />}
										onClick={() => setManageCategoriesOpen(true)}
										disabled={submitting}
										sx={{ alignSelf: 'flex-start', fontWeight: 600, textTransform: 'none', mt: -1 }}
									>
										Manage My Categories
									</Button>
								)}

								<Stack direction="row" spacing={2}>
									<DatePicker
										label="Date"
										value={row.logDate || null}
										onChange={(value) => updateRow(row.key, { logDate: value })}
										textFieldProps={{ required: true, disabled: submitting }}
										fullWidth
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

			<ConfirmationDialog
				open={confirmDeleteOpen}
				onClose={() => setConfirmDeleteOpen(false)}
				onConfirm={handleDelete}
				title="Delete Time Entry"
				message={`Are you sure you want to delete this ${log?.hours ?? ''}h entry for ${log?.log_date ?? 'this day'}? This cannot be undone.`}
				confirmLabel="Delete"
				severity="error"
				loading={deleting}
			/>

			<BaseDialog
				open={newCategoryDialogOpen}
				onClose={() => {
					if (creatingCategory) return;
					setNewCategoryDialogOpen(false);
					setNewCategoryRowKey(null);
				}}
				title="Add Category"
				subtitle="Create a personal category for logging general/internal time"
				maxWidth="xs"
				loading={creatingCategory}
				actions={
					<>
						<Button onClick={() => setNewCategoryDialogOpen(false)} disabled={creatingCategory}>
							Cancel
						</Button>
						<Button
							variant="contained"
							onClick={handleCreateCategory}
							disabled={creatingCategory || !newCategoryName.trim()}
							sx={{ fontWeight: 700, borderRadius: '8px' }}
						>
							{creatingCategory ? <CircularProgress size={18} /> : 'Create'}
						</Button>
					</>
				}
			>
				<Stack spacing={2.5}>
					{categoryError && (
						<Alert severity="error" sx={{ borderRadius: '8px' }}>
							{categoryError}
						</Alert>
					)}
					<TextField
						label="Category Name"
						value={newCategoryName}
						onChange={(e) => setNewCategoryName(e.target.value)}
						fullWidth
						required
						autoFocus
						disabled={creatingCategory}
						placeholder="e.g. Meetings, Training, Admin"
					/>
					<Box>
						<Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
							Color
						</Typography>
						<Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
							{CATEGORY_COLORS.map((color) => (
								<Box
									key={color}
									onClick={() => !creatingCategory && setNewCategoryColor(color)}
									sx={{
										width: 28,
										height: 28,
										borderRadius: '50%',
										bgcolor: color,
										cursor: creatingCategory ? 'default' : 'pointer',
										border: '2px solid',
										borderColor: newCategoryColor === color ? 'text.primary' : 'transparent',
										boxShadow: newCategoryColor === color ? '0 0 0 2px rgba(0,0,0,0.05)' : 'none'
									}}
								/>
							))}
						</Stack>
					</Box>
				</Stack>
			</BaseDialog>

			<BaseDialog
				open={manageCategoriesOpen}
				onClose={() => setManageCategoriesOpen(false)}
				title="Manage My Categories"
				subtitle="Delete personal categories you no longer need. Organization-wide defaults can't be removed here."
				maxWidth="xs"
				actions={
					<Button onClick={() => setManageCategoriesOpen(false)} sx={{ fontWeight: 700 }}>
						Close
					</Button>
				}
			>
				<Stack spacing={0.5}>
					{myCategories.length === 0 ? (
						<Typography variant="body2" color="text.secondary">
							You haven't added any personal categories yet.
						</Typography>
					) : (
						myCategories.map((c) => (
							<Stack
								key={c.id}
								direction="row"
								alignItems="center"
								justifyContent="space-between"
								sx={{ py: 0.75 }}
							>
								<Stack direction="row" spacing={1.5} alignItems="center">
									<Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: c.color || '#94A3B8', flexShrink: 0 }} />
									<Typography variant="body2">{c.name}</Typography>
								</Stack>
								<IconButton
									size="small"
									onClick={() => setDeleteCategoryTarget(c)}
								>
									<DeleteIcon fontSize="small" />
								</IconButton>
							</Stack>
						))
					)}
				</Stack>
			</BaseDialog>

			<ConfirmationDialog
				open={!!deleteCategoryTarget}
				onClose={() => setDeleteCategoryTarget(null)}
				onConfirm={handleConfirmDeleteCategory}
				title="Delete Category"
				message={`Are you sure you want to delete "${deleteCategoryTarget?.name}"? Existing time logs using this category will keep their history but lose the category label.`}
				confirmLabel="Delete"
				severity="error"
				loading={deletingCategory}
			/>
		</>
	);
};

export default TimeLogEntryFormDialog;
