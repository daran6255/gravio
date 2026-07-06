import React, { useState, useEffect } from 'react';
import {
	Drawer,
	Box,
	Typography,
	IconButton,
	Button,
	TextField,
	MenuItem,
	Stack,
	ToggleButtonGroup,
	ToggleButton,
	Alert
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { createTimeLog, updateTimeLog, fetchMyCategories } from '../../store/slices/timesheetSlice';
import { fetchProjects, fetchProjectTasks } from '../../store/slices/projectsSlice';
import type { ProjectTimeLog } from '../../models/timesheet';

interface TimeLogEntryDrawerProps {
	open: boolean;
	onClose: () => void;
	log?: ProjectTimeLog;
	defaultDate?: string;
	onSave?: () => void;
}

const TimeLogEntryDrawer: React.FC<TimeLogEntryDrawerProps> = ({
	open,
	onClose,
	log,
	defaultDate,
	onSave
}) => {
	const dispatch = useAppDispatch();
	
	const { projects } = useAppSelector((state) => state.projects);
	const { projectTasks } = useAppSelector((state) => state.projects);
	const { categories } = useAppSelector((state) => state.timesheets);

	const [logAgainst, setLogAgainst] = useState<'project_task' | 'project_only' | 'general'>('project_task');
	const [projectId, setProjectId] = useState<number | ''>('');
	const [taskId, setTaskId] = useState<number | ''>('');
	const [categoryId, setCategoryId] = useState<number | ''>('');
	const [logDate, setLogDate] = useState<string>('');
	const [hours, setHours] = useState<string>('');
	const [billingType, setBillingType] = useState<'billable' | 'non_billable'>('billable');
	const [notes, setNotes] = useState<string>('');
	
	const [error, setError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);

	// Load projects and categories
	useEffect(() => {
		if (open) {
			dispatch(fetchProjects({ pageSize: 1000 }));
			dispatch(fetchMyCategories());
			setError(null);
		}
	}, [open, dispatch]);

	// Initialize form on edit or open
	useEffect(() => {
		if (open) {
			if (log) {
				setLogDate(log.log_date);
				setHours(log.hours.toString());
				setBillingType(log.billing_type);
				setNotes(log.notes || '');
				
				if (log.project_id && log.task_id) {
					setLogAgainst('project_task');
					setProjectId(log.project_id);
					setTaskId(log.task_id);
					setCategoryId('');
				} else if (log.project_id) {
					setLogAgainst('project_only');
					setProjectId(log.project_id);
					setTaskId('');
					setCategoryId('');
				} else {
					setLogAgainst('general');
					setProjectId('');
					setTaskId('');
					setCategoryId(log.category_id || '');
				}
			} else {
				setLogDate(defaultDate || new Date().toISOString().split('T')[0]);
				setHours('');
				setBillingType('billable');
				setNotes('');
				setLogAgainst('project_task');
				setProjectId('');
				setTaskId('');
				setCategoryId('');
			}
		}
	}, [open, log, defaultDate]);

	// Fetch tasks when project changes
	useEffect(() => {
		if (projectId) {
			const project = projects.find((p) => p.id === projectId);
			if (project) {
				dispatch(fetchProjectTasks(project.public_id));
			}
		} else {
			setTaskId('');
		}
	}, [projectId, projects, dispatch]);

	// Set initial task if loading existing log
	useEffect(() => {
		if (log && log.task_id && projectTasks.length > 0) {
			setTaskId(log.task_id);
		}
	}, [log, projectTasks]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);

		const hrs = parseFloat(hours);
		if (isNaN(hrs) || hrs <= 0 || hrs > 24) {
			setError('Hours must be between 0.1 and 24.0');
			return;
		}

		if (logAgainst === 'project_task' && (!projectId || !taskId)) {
			setError('Project and Task are required');
			return;
		}
		if (logAgainst === 'project_only' && !projectId) {
			setError('Project is required');
			return;
		}
		if (logAgainst === 'general' && !categoryId) {
			setError('Category is required');
			return;
		}

		setSubmitting(true);

		const payload = {
			project_id: logAgainst !== 'general' ? (projectId as number) : null,
			task_id: logAgainst === 'project_task' ? (taskId as number) : null,
			category_id: logAgainst === 'general' ? (categoryId as number) : null,
			log_date: logDate,
			hours: hrs,
			notes: notes || null,
			billing_type: billingType
		};

		try {
			if (log) {
				// Update
				const result = await dispatch(updateTimeLog({ id: log.id, data: payload })).unwrap();
				if (result) {
					onSave?.();
					onClose();
				}
			} else {
				// Create
				const result = await dispatch(createTimeLog(payload)).unwrap();
				if (result) {
					onSave?.();
					onClose();
				}
			}
		} catch (err: any) {
			setError(err || 'An error occurred while saving the time log');
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<Drawer anchor="right" open={open} onClose={onClose}>
			<Box sx={{ width: { xs: '100vw', sm: 400 }, p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
				<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
					<Typography variant="h6" sx={{ fontWeight: 700 }}>
						{log ? 'Edit Time Entry' : 'Log Time'}
					</Typography>
					<IconButton onClick={onClose} size="small">
						<CloseIcon />
					</IconButton>
				</Stack>

				{error && (
					<Alert severity="error" sx={{ mb: 3, borderRadius: '8px' }}>
						{error}
					</Alert>
				)}

				<Box component="form" onSubmit={handleSubmit} sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
					<Stack spacing={1}>
						<Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
							Log Against
						</Typography>
						<ToggleButtonGroup
							value={logAgainst}
							exclusive
							onChange={(_, val) => val && setLogAgainst(val)}
							fullWidth
							size="small"
						>
							<ToggleButton value="project_task">Task</ToggleButton>
							<ToggleButton value="project_only">Project</ToggleButton>
							<ToggleButton value="general">General</ToggleButton>
						</ToggleButtonGroup>
					</Stack>

					{logAgainst !== 'general' && (
						<TextField
							select
							label="Project"
							value={projectId}
							onChange={(e) => {
								setProjectId(Number(e.target.value));
								setTaskId('');
							}}
							fullWidth
							required
						>
							{projects.map((p) => (
								<MenuItem key={p.id} value={p.id}>
									{p.name}
								</MenuItem>
							))}
						</TextField>
					)}

					{logAgainst === 'project_task' && (
						<TextField
							select
							label="Task"
							value={taskId}
							onChange={(e) => setTaskId(Number(e.target.value))}
							fullWidth
							required
							disabled={!projectId}
						>
							{projectTasks.map((t) => (
								<MenuItem key={t.id} value={t.id}>
									{t.title}
								</MenuItem>
							))}
						</TextField>
					)}

					{logAgainst === 'general' && (
						<TextField
							select
							label="Category"
							value={categoryId}
							onChange={(e) => setCategoryId(Number(e.target.value))}
							fullWidth
							required
						>
							{categories.map((c) => (
								<MenuItem key={c.id} value={c.id}>
									{c.name}
								</MenuItem>
							))}
						</TextField>
					)}

					<TextField
						label="Date"
						type="date"
						value={logDate}
						onChange={(e) => setLogDate(e.target.value)}
						fullWidth
						required
						InputLabelProps={{ shrink: true }}
					/>

					<TextField
						label="Hours"
						type="number"
						inputProps={{ step: 0.25, min: 0.25, max: 24 }}
						value={hours}
						onChange={(e) => setHours(e.target.value)}
						fullWidth
						required
						placeholder="e.g. 1.5"
						helperText="Decimal supported (e.g. 1.5 = 1h 30m)"
					/>

					<TextField
						select
						label="Billing Type"
						value={billingType}
						onChange={(e) => setBillingType(e.target.value as 'billable' | 'non_billable')}
						fullWidth
						required
					>
						<MenuItem value="billable">Billable</MenuItem>
						<MenuItem value="non_billable">Non-Billable</MenuItem>
					</TextField>

					<TextField
						label="Notes / Description"
						multiline
						rows={3}
						value={notes}
						onChange={(e) => setNotes(e.target.value)}
						fullWidth
						placeholder="What did you work on?"
					/>

					<Box sx={{ mt: 'auto', pt: 2 }}>
						<Button
							type="submit"
							variant="contained"
							fullWidth
							disabled={submitting}
							sx={{ py: 1.2, fontWeight: 700, borderRadius: '8px' }}
						>
							{submitting ? 'Saving...' : log ? 'Update Entry' : 'Log Time'}
						</Button>
					</Box>
				</Box>
			</Box>
		</Drawer>
	);
};

export default TimeLogEntryDrawer;
