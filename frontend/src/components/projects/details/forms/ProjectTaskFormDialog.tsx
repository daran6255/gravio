import React, { useState } from 'react';
import { Dialog, IconButton, Tooltip } from '@mui/material';
import { NotificationsActiveOutlined } from '@mui/icons-material';
import { EnterpriseForm, type FormStep } from '../../../common/form';
import { SetReminderDialog } from '../../../crm/shared';
import type { ProjectTask, ProjectTaskCreate, ProjectTaskUpdate, ProjectTaskStatus, ProjectTaskTag, BillingType } from '../../../../models/projects/projectTask';
import type { LeadPriority } from '../../../../models/crm/lead';
import type { CRMOwnerOption } from '../../../../models/crm/owner';
import { TaskDetailsStep, TaskScheduleStep } from './steps';

interface ProjectTaskFormDialogProps {
	open: boolean;
	onClose: () => void;
	task?: ProjectTask | null;
	parentTask?: ProjectTask | null;
	statuses: ProjectTaskStatus[];
	owners: CRMOwnerOption[];
	/** Tags already used elsewhere in this project, offered as reusable suggestions. */
	existingTags: ProjectTaskTag[];
	submitting: boolean;
	onSubmit: (payload: ProjectTaskCreate | ProjectTaskUpdate) => Promise<void>;
}

export const ProjectTaskFormDialog: React.FC<ProjectTaskFormDialogProps> = ({
	open, onClose, task, parentTask, statuses, owners, existingTags, submitting, onSubmit,
}) => {
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
	const [tags, setTags] = useState<ProjectTaskTag[]>([]);
	const [touched, setTouched] = useState(false);
	const [error, setError] = useState<string | null>(null);
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
			setTags(task?.tags || []);
			setTouched(false);
			setError(null);
		}
	}

	const titleError = touched && !title.trim() ? 'Title is required' : '';
	const isValid = !!title.trim();

	const handleSave = async () => {
		setTouched(true);
		if (!isValid) return;
		setError(null);
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
				tags: tags.length ? tags : undefined,
			});
		} catch (err: any) {
			setError(err || 'Failed to save task');
		}
	};

	const title_ = isEdit ? 'Edit Task' : parentTask ? 'New Sub-task' : 'New Task';
	const subtitle = isEdit ? task?.title : parentTask ? `Under "${parentTask.title}"` : 'Add a task to this project';

	const steps: FormStep[] = [
		{
			label: 'Task Details',
			description: 'Title, description, status, priority, and assignee',
			content: (
				<TaskDetailsStep
					title={title}
					setTitle={setTitle}
					titleError={titleError}
					description={description}
					setDescription={setDescription}
					statusId={statusId}
					setStatusId={setStatusId}
					statuses={statuses}
					priority={priority}
					setPriority={setPriority}
					assigneeId={assigneeId}
					setAssigneeId={setAssigneeId}
					owners={owners}
					tags={tags}
					setTags={setTags}
					existingTags={existingTags}
				/>
			),
		},
		{
			label: 'Schedule & Billing',
			description: 'Dates, estimated/actual hours, and billing type',
			content: (
				<TaskScheduleStep
					startDate={startDate}
					setStartDate={setStartDate}
					dueDate={dueDate}
					setDueDate={setDueDate}
					estimatedHours={estimatedHours}
					setEstimatedHours={setEstimatedHours}
					actualHours={actualHours}
					setActualHours={setActualHours}
					billingType={billingType}
					setBillingType={setBillingType}
				/>
			),
		},
	];

	return (
		<>
			<Dialog
				open={open}
				onClose={onClose}
				maxWidth="sm"
				fullWidth
				PaperProps={{ sx: { borderRadius: 0, boxShadow: 'none', bgcolor: 'transparent' } }}
			>
				<EnterpriseForm
					title={title_}
					subtitle={subtitle}
					mode={isEdit ? 'edit' : 'create'}
					steps={steps}
					onSave={handleSave}
					onCancel={onClose}
					isSubmitting={submitting}
					saveButtonText={isEdit ? 'Save Changes' : 'Create'}
					error={error}
					headerActions={
						isEdit && (
							<Tooltip title="Set Reminder">
								<IconButton size="small" onClick={() => setReminderOpen(true)}>
									<NotificationsActiveOutlined fontSize="small" />
								</IconButton>
							</Tooltip>
						)
					}
				/>
			</Dialog>

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
