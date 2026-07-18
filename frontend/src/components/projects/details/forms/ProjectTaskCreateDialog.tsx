import React, { useState, useEffect } from 'react';
import {
	Dialog,
	DialogContent,
	Box,
	Stack,
	TextField,
	Typography,
	useTheme,
} from '@mui/material';
import type { ProjectTask, ProjectTaskCreate, ProjectTaskStatus, ProjectTaskTag } from '../../../../models/projects/projectTask';
import type { LeadPriority } from '../../../../models/crm/lead';
import type { CRMOwnerOption } from '../../../../models/crm/owner';

// Import subcomponents
import { TaskCreateHeader } from './task-create/TaskCreateHeader';
import { TaskCreateDescription } from './task-create/TaskCreateDescription';
import { TaskCreatePills } from './task-create/TaskCreatePills';
import { TaskCreateFooter } from './task-create/TaskCreateFooter';
import { TaskCreatePopovers } from './task-create/TaskCreatePopovers';

interface ProjectTaskCreateDialogProps {
	open: boolean;
	onClose: () => void;
	parentTask?: ProjectTask | null; // using parent task details if adding subtask
	projectName: string;
	tasks: ProjectTask[];
	statuses: ProjectTaskStatus[];
	owners: CRMOwnerOption[];
	existingTags: ProjectTaskTag[];
	submitting: boolean;
	onSubmit: (payload: ProjectTaskCreate, keepOpen?: boolean) => Promise<void>;
}

export const ProjectTaskCreateDialog: React.FC<ProjectTaskCreateDialogProps> = ({
	open,
	onClose,
	parentTask,
	projectName,
	tasks,
	statuses,
	owners,
	existingTags,
	submitting,
	onSubmit,
}) => {
	const theme = useTheme();

	const PRIORITIES: { value: LeadPriority; label: string; color: string }[] = [
		{ value: 'low', label: 'Low', color: theme.palette.success.main },
		{ value: 'medium', label: 'Medium', color: theme.palette.info.main },
		{ value: 'high', label: 'High', color: theme.palette.warning.main },
		{ value: 'urgent', label: 'Urgent', color: theme.palette.error.main },
	];

	const PRESET_COLORS = [
		theme.palette.primary.main,
		theme.palette.secondary.main,
		theme.palette.success.main,
		theme.palette.error.main,
		theme.palette.warning.main,
		theme.palette.info.main,
	];

	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [statusId, setStatusId] = useState<number>(statuses[0]?.id || 0);
	const [priority, setPriority] = useState<LeadPriority>('medium');
	const [assigneeId, setAssigneeId] = useState<number | null>(null);
	const [taskType, setTaskType] = useState<{ name: string; color: string }>({ name: 'Task', color: theme.palette.warning.main });
	const [milestone, setMilestone] = useState<{ name: string; color: string } | undefined>(undefined);
	const [selectedTags, setSelectedTags] = useState<ProjectTaskTag[]>([]);
	const [dueDate, setDueDate] = useState<string | undefined>(undefined);
	const [estimatedHours, setEstimatedHours] = useState<number | undefined>(undefined);
	const [createMore, setCreateMore] = useState(false);
	const [touched, setTouched] = useState(false);

	// Tabbed editor states
	const [editTab, setEditTab] = useState(0);
	const [isDescFocused, setIsDescFocused] = useState(false);
	const [newTypeName, setNewTypeName] = useState('');
	const [newMilestoneName, setNewMilestoneName] = useState('');

	// Popover anchors
	const [assigneeAnchor, setAssigneeAnchor] = useState<HTMLElement | null>(null);
	const [labelsAnchor, setLabelsAnchor] = useState<HTMLElement | null>(null);
	const [typeAnchor, setTypeAnchor] = useState<HTMLElement | null>(null);
	const [milestoneAnchor, setMilestoneAnchor] = useState<HTMLElement | null>(null);
	const [priorityAnchor, setPriorityAnchor] = useState<HTMLElement | null>(null);
	const [dueDateAnchor, setDueDateAnchor] = useState<HTMLElement | null>(null);
	const [estimateAnchor, setEstimateAnchor] = useState<HTMLElement | null>(null);
	const [statusAnchor, setStatusAnchor] = useState<HTMLElement | null>(null);

	const taskTypes = React.useMemo(() => {
		const typesMap = new Map<string, string>();
		typesMap.set('task', theme.palette.warning.main);
		typesMap.set('bug', theme.palette.error.main);
		typesMap.set('feature', theme.palette.success.main);
		typesMap.set('story', theme.palette.info.main);

		tasks.forEach((t) => {
			const tt = t.custom_fields?.task_type;
			if (tt && tt.name && tt.color) {
				typesMap.set(tt.name.toLowerCase(), tt.color);
			}
		});

		return Array.from(typesMap.entries()).map(([name, color]) => ({
			name: name.charAt(0).toUpperCase() + name.slice(1),
			color
		}));
	}, [tasks, theme]);

	const milestones = React.useMemo(() => {
		const mset = new Set<string>();
		tasks.forEach((t) => {
			if (t.custom_fields?.milestone?.name) {
				mset.add(t.custom_fields.milestone.name);
			}
		});
		return Array.from(mset).map((name) => {
			const t = tasks.find((tk) => tk.custom_fields?.milestone?.name === name);
			return {
				name,
				color: t?.custom_fields?.milestone?.color || theme.palette.primary.main,
			};
		});
	}, [tasks, theme]);

	useEffect(() => {
		if (open) {
			setTitle('');
			setDescription('');
			setStatusId(statuses[0]?.id || 0);
			setPriority('medium');
			setAssigneeId(null);
			setTaskType({ name: 'Task', color: theme.palette.warning.main });
			setMilestone(undefined);
			setNewMilestoneName('');
			setSelectedTags([]);
			setDueDate(undefined);
			setEstimatedHours(undefined);
			setTouched(false);
			setEditTab(0);
		}
	}, [open, statuses, theme]);

	const titleError = touched && !title.trim() ? 'Title is required' : '';
	const isValid = !!title.trim();
	const selectedAssignee = owners.find((o) => o.id === assigneeId) || null;
	const selectedStatus = statuses.find((s) => s.id === statusId) || statuses[0];

	const handleCreate = async () => {
		setTouched(true);
		if (!isValid) return;
		
		const payload: ProjectTaskCreate = {
			title: title.trim(),
			description: description.trim() || undefined,
			status_id: statusId,
			priority,
			assignee_id: assigneeId ?? undefined,
			due_date: dueDate || undefined,
			estimated_hours: estimatedHours,
			tags: selectedTags,
			custom_fields: {
				task_type: taskType,
				...(milestone ? { milestone } : {}),
			}
		};

		await onSubmit(payload, createMore);

		if (createMore) {
			setTitle('');
			setDescription('');
			setTouched(false);
			setEditTab(0);
		}
	};

	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth="md"
			fullWidth
			PaperProps={{
				sx: {
					borderRadius: '12px',
					border: '1px solid',
					borderColor: theme.palette.divider,
					overflow: 'hidden',
					bgcolor: theme.palette.background.paper,
					backgroundImage: 'none',
					boxShadow: theme.palette.mode === 'dark' ? '0 12px 40px rgba(0,0,0,0.5)' : '0 12px 40px rgba(0,0,0,0.12)',
				},
			}}
		>
			<TaskCreateHeader
				onClose={onClose}
				submitting={submitting}
				parentTask={parentTask}
				projectName={projectName}
			/>

			<DialogContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
				{/* Title Field */}
				<Stack spacing={1}>
					<Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem', color: 'text.primary' }}>
						Add a title <Box component="span" sx={{ color: theme.palette.error.main }}>*</Box>
					</Typography>
					<TextField
						placeholder="Title"
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						error={!!titleError}
						helperText={titleError}
						autoFocus
						fullWidth
						variant="outlined"
						sx={{
							'& .MuiOutlinedInput-root': {
								borderRadius: '6px',
								fontSize: '0.875rem',
								bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.01)' : 'transparent',
								'& fieldset': { borderColor: theme.palette.divider },
								'&:hover fieldset': { borderColor: theme.palette.mode === 'dark' ? '#8b949e' : '#858585' },
								'&.Mui-focused fieldset': { borderColor: theme.palette.primary.main, borderWidth: '1px' },
							},
						}}
					/>
				</Stack>

				<TaskCreateDescription
					description={description}
					setDescription={setDescription}
					editTab={editTab}
					setEditTab={setEditTab}
					isDescFocused={isDescFocused}
					setIsDescFocused={setIsDescFocused}
				/>

				<TaskCreatePills
					selectedStatus={selectedStatus}
					selectedAssignee={selectedAssignee}
					selectedTags={selectedTags}
					taskType={taskType}
					milestone={milestone}
					priority={priority}
					dueDate={dueDate}
					estimatedHours={estimatedHours}
					projectName={projectName}
					assigneeId={assigneeId}
					priorities={PRIORITIES}
					setStatusAnchor={setStatusAnchor}
					setAssigneeAnchor={setAssigneeAnchor}
					setLabelsAnchor={setLabelsAnchor}
					setTypeAnchor={setTypeAnchor}
					setMilestoneAnchor={setMilestoneAnchor}
					setPriorityAnchor={setPriorityAnchor}
					setDueDateAnchor={setDueDateAnchor}
					setEstimateAnchor={setEstimateAnchor}
				/>
			</DialogContent>

			<TaskCreateFooter
				onClose={onClose}
				handleCreate={handleCreate}
				createMore={createMore}
				setCreateMore={setCreateMore}
				submitting={submitting}
				isValid={isValid}
				parentTask={parentTask}
			/>

			<TaskCreatePopovers
				statusAnchor={statusAnchor}
				setStatusAnchor={setStatusAnchor}
				statusId={statusId}
				setStatusId={setStatusId}
				statuses={statuses}
				assigneeAnchor={assigneeAnchor}
				setAssigneeAnchor={setAssigneeAnchor}
				assigneeId={assigneeId}
				setAssigneeId={setAssigneeId}
				owners={owners}
				priorityAnchor={priorityAnchor}
				setPriorityAnchor={setPriorityAnchor}
				priority={priority}
				setPriority={setPriority}
				priorities={PRIORITIES}
				typeAnchor={typeAnchor}
				setTypeAnchor={setTypeAnchor}
				taskType={taskType}
				setTaskType={setTaskType}
				taskTypes={taskTypes}
				newTypeName={newTypeName}
				setNewTypeName={setNewTypeName}
				presetColors={PRESET_COLORS}
				milestoneAnchor={milestoneAnchor}
				setMilestoneAnchor={setMilestoneAnchor}
				milestone={milestone}
				setMilestone={setMilestone}
				milestones={milestones}
				newMilestoneName={newMilestoneName}
				setNewMilestoneName={setNewMilestoneName}
				labelsAnchor={labelsAnchor}
				setLabelsAnchor={setLabelsAnchor}
				selectedTags={selectedTags}
				setSelectedTags={setSelectedTags}
				existingTags={existingTags}
				dueDateAnchor={dueDateAnchor}
				setDueDateAnchor={setDueDateAnchor}
				dueDate={dueDate}
				setDueDate={setDueDate}
				estimateAnchor={estimateAnchor}
				setEstimateAnchor={setEstimateAnchor}
				estimatedHours={estimatedHours}
				setEstimatedHours={setEstimatedHours}
			/>
		</Dialog>
	);
};

export default ProjectTaskCreateDialog;
