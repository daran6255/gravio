import React, { useState } from 'react';
import { Stack, TextField, MenuItem, Autocomplete, Button, CircularProgress, useTheme, Typography } from '@mui/material';
import { NotificationsActiveOutlined } from '@mui/icons-material';
import { BaseDialog } from '../../../common/dialogbox';
import { DatePicker } from '../../../common/form';
import { SetReminderDialog } from '../../../crm/shared';
import useToast from '../../../../hooks/useToast';
import type { ProjectTask, ProjectTaskCreate, ProjectTaskUpdate, ProjectTaskStatus, BillingType } from '../../../../models/projects/projectTask';
import type { LeadPriority } from '../../../../models/crm/lead';
import type { CRMOwnerOption } from '../../../../models/crm/owner';

const PRIORITIES: { value: LeadPriority; label: string }[] = [
	{ value: 'low', label: 'Low' },
	{ value: 'medium', label: 'Medium' },
	{ value: 'high', label: 'High' },
	{ value: 'urgent', label: 'Urgent' },
];

interface ProjectTaskFormDialogProps {
	open: boolean;
	onClose: () => void;
	task?: ProjectTask | null;
	parentTask?: ProjectTask | null;
	statuses: ProjectTaskStatus[];
	owners: CRMOwnerOption[];
	submitting: boolean;
	onSubmit: (payload: ProjectTaskCreate | ProjectTaskUpdate) => Promise<void>;
}

export const ProjectTaskFormDialog: React.FC<ProjectTaskFormDialogProps> = ({
	open, onClose, task, parentTask, statuses, owners, submitting, onSubmit,
}) => {
	const theme = useTheme();
	const toast = useToast();
	const isEdit = !!task;

	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [statusId, setStatusId] = useState<number | ''>('');
	const [priority, setPriority] = useState<LeadPriority>('medium');
	const [assigneeId, setAssigneeId] = useState<number | null>(null);
	const [dueDate, setDueDate] = useState<string | null>(null);
	const [startDate, setStartDate] = useState<string | null>(null);
	const [estimatedHours, setEstimatedHours] = useState('');
	const [actualHours, setActualHours] = useState('');
	const [billingType, setBillingType] = useState<BillingType>('billable');
	const [touched, setTouched] = useState(false);
	const [reminderOpen, setReminderOpen] = useState(false);

	const [prevOpen, setPrevOpen] = useState(open);
	if (open !== prevOpen) {
		setPrevOpen(open);
		if (open) {
			setTitle(task?.title || '');
			setDescription(task?.description || '');
			setStatusId(task?.status_id ?? '');
			setPriority(task?.priority || 'medium');
			setAssigneeId(task?.assignee_id ?? null);
			setDueDate(task?.due_date || null);
			setStartDate(task?.start_date || null);
			setEstimatedHours(task?.estimated_hours != null ? String(task.estimated_hours) : '');
			setActualHours(task?.actual_hours != null ? String(task.actual_hours) : '');
			setBillingType(task?.billing_type || 'billable');
			setTouched(false);
		}
	}

	const titleError = touched && !title.trim() ? 'Title is required' : '';
	const isValid = !!title.trim();
	const selectedAssignee = owners.find((o) => o.id === assigneeId) || null;

	const handleSave = async () => {
		setTouched(true);
		if (!isValid) return;
		try {
			await onSubmit({
				title: title.trim(),
				description: description.trim() || undefined,
				status_id: statusId || undefined,
				priority,
				assignee_id: assigneeId ?? undefined,
				due_date: dueDate || undefined,
				start_date: startDate || undefined,
				estimated_hours: estimatedHours ? Number(estimatedHours) : undefined,
				actual_hours: actualHours ? Number(actualHours) : undefined,
				billing_type: billingType,
			});
		} catch (err: any) {
			toast.error(err || 'Failed to save task');
		}
	};

	const title_ = isEdit ? 'Edit Task' : parentTask ? 'New Sub-task' : 'New Task';
	const subtitle = isEdit ? task?.title : parentTask ? `Under "${parentTask.title}"` : undefined;

	return (
		<>
		<BaseDialog
			open={open}
			onClose={onClose}
			title={title_}
			subtitle={subtitle}
			maxWidth="sm"
			loading={submitting}
			actions={
				<>
					{isEdit && (
						<Button
							startIcon={<NotificationsActiveOutlined fontSize="small" />}
							onClick={() => setReminderOpen(true)}
							sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '10px', mr: 'auto', color: 'text.secondary' }}
						>
							Set Reminder
						</Button>
					)}
					<Button onClick={onClose} disabled={submitting} sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '10px' }}>
						Cancel
					</Button>
					<Button
						variant="contained"
						onClick={handleSave}
						disabled={submitting}
						sx={{
							color: 'white', textTransform: 'none', fontWeight: 700, px: 4, minWidth: 140, borderRadius: '10px', boxShadow: 'none',
							background: 'linear-gradient(90deg, #8B7CF6 0%, #4EA8FF 100%)',
							'&:hover': { boxShadow: '0 4px 12px rgba(139,124,246,0.3)' },
							'&.Mui-disabled': { background: theme.palette.action.disabledBackground },
						}}
					>
						{submitting ? <CircularProgress size={18} color="inherit" /> : isEdit ? 'Save Changes' : 'Create'}
					</Button>
				</>
			}
		>
			<Stack spacing={2.5}>
				<TextField
					label="Title"
					value={title}
					onChange={(e) => setTitle(e.target.value)}
					required
					fullWidth
					error={!!titleError}
					helperText={titleError}
				/>

				<TextField
					label="Description"
					value={description}
					onChange={(e) => setDescription(e.target.value)}
					fullWidth
					multiline
					rows={2}
				/>

				<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
					<TextField
						select
						label="Status"
						value={statusId}
						onChange={(e) => setStatusId(Number(e.target.value))}
						fullWidth
					>
						{statuses.map((s) => (
							<MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
						))}
					</TextField>

					<TextField
						select
						label="Priority"
						value={priority}
						onChange={(e) => setPriority(e.target.value as LeadPriority)}
						fullWidth
					>
						{PRIORITIES.map((p) => (
							<MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>
						))}
					</TextField>
				</Stack>

				<Autocomplete
					fullWidth
					options={owners}
					getOptionLabel={(o) => o.full_name || o.email}
					isOptionEqualToValue={(o, v) => o.id === v.id}
					value={selectedAssignee}
					onChange={(_, newValue) => setAssigneeId(newValue?.id ?? null)}
					renderInput={(params) => <TextField {...params} label="Assignee" placeholder="Unassigned" />}
				/>

				<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
					<DatePicker label="Start Date" value={startDate} onChange={(v) => setStartDate(v || null)} format="DD-MMM-YYYY" />
					<DatePicker label="Due Date" value={dueDate} onChange={(v) => setDueDate(v || null)} format="DD-MMM-YYYY" minDate={startDate || undefined} />
				</Stack>

				<Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.7rem' }}>
					Time & Billing
				</Typography>
				<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
					<TextField
						label="Estimated Hours"
						type="number"
						value={estimatedHours}
						onChange={(e) => setEstimatedHours(e.target.value)}
						fullWidth
						slotProps={{ htmlInput: { min: 0, step: 0.5 } }}
					/>
					<TextField
						label="Actual Hours"
						type="number"
						value={actualHours}
						onChange={(e) => setActualHours(e.target.value)}
						fullWidth
						slotProps={{ htmlInput: { min: 0, step: 0.5 } }}
					/>
					<TextField
						select
						label="Billing Type"
						value={billingType}
						onChange={(e) => setBillingType(e.target.value as BillingType)}
						fullWidth
					>
						<MenuItem value="billable">Billable</MenuItem>
						<MenuItem value="non_billable">Non-billable</MenuItem>
					</TextField>
				</Stack>
			</Stack>
		</BaseDialog>

		{task && (
			<SetReminderDialog
				open={reminderOpen}
				onClose={() => setReminderOpen(false)}
				entityType="project_task"
				entityId={task.id}
				entityLabel={task.title}
				defaultDueDate={task.due_date}
			/>
		)}
		</>
	);
};

export default ProjectTaskFormDialog;
