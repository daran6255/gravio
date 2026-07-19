import React, { useEffect } from 'react';
import {
	Box,
	Stack,
	Typography,
	Avatar,
	CircularProgress,
	useTheme,
} from '@mui/material';
import {
	AddCircleOutline,
	DeleteOutline,
	FormatListBulleted,
	AttachFile,
	Adjust,
	PersonOutline,
	DescriptionOutlined,
	LocalOfferOutlined,
	OutlinedFlag,
	EditOutlined,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import type { ProjectTask, ProjectTaskStatus, ProjectTaskHistoryEntry } from '../../../../../models/projects/projectTask';
import type { CRMOwnerOption } from '../../../../../models/crm/owner';
import { useAppDispatch, useAppSelector } from '../../../../../store/hooks';
import { fetchTaskHistory } from '../../../../../store/slices/projectsSlice';

interface TaskHistoryTimelineProps {
	task: ProjectTask;
	tasks: ProjectTask[];
	statuses: ProjectTaskStatus[];
	owners: CRMOwnerOption[];
	projectName: string;
}

const FIELD_LABELS: Record<string, string> = {
	title: 'Title',
	description: 'Description',
	priority: 'Priority',
	due_date: 'Due date',
	start_date: 'Start date',
	estimated_hours: 'Estimated hours',
	actual_hours: 'Actual hours',
	billing_type: 'Billing type',
	parent_task_id: 'Parent task',
	tags: 'Tags',
	custom_fields: 'Task details',
};

export const TaskHistoryTimeline: React.FC<TaskHistoryTimelineProps> = ({
	task,
	tasks,
	statuses,
	owners,
	projectName,
}) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const dispatch = useAppDispatch();

	const { taskHistory, taskHistoryLoading } = useAppSelector((state) => state.projects);
	const taskFiles = useAppSelector((state) => state.projects.taskFiles);
	const subtasks = tasks.filter((t) => t.parent_task_id === task.id);

	// Audit logging only started recording events going forward from when this
	// feature shipped -- a task created (or last edited) before that has no real
	// "create" row. Rather than show a blank/misleading empty state for those,
	// fall back to the one fact we always know for certain: task.created_at.
	const hasCreateEvent = taskHistory.some((h) => h.action === 'create');

	// Re-fetch whenever anything that can generate a new history row for this task
	// changes -- the task itself (description/status/priority/etc.), its sub-tasks,
	// or its attached files.
	const subtasksVersion = subtasks.map((t) => `${t.id}:${t.updated_at}`).join(',');

	useEffect(() => {
		if (task.public_id) {
			dispatch(fetchTaskHistory(task.public_id));
		}
	}, [task.public_id, task.updated_at, subtasksVersion, taskFiles.length, dispatch]);

	const ownerName = (id?: number | null) => {
		if (id == null) return 'Unassigned';
		const o = owners.find((ow) => ow.id === id);
		return o ? (o.full_name || o.email) : `User #${id}`;
	};

	const statusName = (id?: string | null) => {
		if (!id) return '—';
		const s = statuses.find((st) => String(st.id) === String(id));
		return s ? s.name : `#${id}`;
	};

	const actorName = (id?: number) => {
		if (id == null) return 'Unknown user';
		const o = owners.find((ow) => ow.id === id);
		return o ? (o.full_name || o.email) : `User #${id}`;
	};

	// A sub-task update rolled up onto the parent smuggles its title into
	// field_name as "<field>::<subtask title>" (AuditLog has no dedicated column
	// for it) -- split that back apart everywhere it's read.
	const splitSubtaskField = (fieldName?: string): { field: string; subtaskTitle: string } => {
		const [field, subtaskTitle] = (fieldName || '').split('::');
		return { field: field || '', subtaskTitle: subtaskTitle || 'a sub-task' };
	};

	const getHistoryIcon = (h: ProjectTaskHistoryEntry) => {
		const iconSx = { fontSize: 15, color: 'text.secondary' } as const;
		switch (h.action) {
			case 'create':
				return <AddCircleOutline sx={{ ...iconSx, color: 'success.main' }} />;
			case 'delete':
				return <DeleteOutline sx={{ ...iconSx, color: 'error.main' }} />;
			case 'add_subtask':
			case 'remove_subtask':
				return <FormatListBulleted sx={iconSx} />;
			case 'attach_file':
			case 'delete_file':
			case 'subtask_attach_file':
			case 'subtask_delete_file':
				return <AttachFile sx={iconSx} />;
			default:
				break;
		}
		const field = h.action === 'update_subtask' ? splitSubtaskField(h.field_name).field : h.field_name;
		switch (field) {
			case 'status_id':
				return <Adjust sx={iconSx} />;
			case 'assignee_id':
				return <PersonOutline sx={iconSx} />;
			case 'description':
				return <DescriptionOutlined sx={iconSx} />;
			case 'tags':
				return <LocalOfferOutlined sx={iconSx} />;
			case 'priority':
				return <OutlinedFlag sx={iconSx} />;
			default:
				return <EditOutlined sx={iconSx} />;
		}
	};

	// Resolves a raw field/old/new triple into human-readable display values --
	// shared by a task's own field changes and by a sub-task's field changes
	// rolled up onto its parent, so status/owner lookups and field labels aren't
	// duplicated between the two (they still get their own sentence phrasing below,
	// since "I changed X" and "sub-task Y had X changed" are different grammar).
	type FieldChangeParts =
		| { kind: 'status'; oldDisplay: string; newDisplay: string }
		| { kind: 'assignee'; newDisplay: string | null }
		| { kind: 'description' }
		| { kind: 'blob'; label: string }
		| { kind: 'generic'; label: string; oldDisplay: string; newDisplay: string };

	const resolveFieldChange = (field: string, oldValue?: string, newValue?: string): FieldChangeParts => {
		if (field === 'status_id') {
			return { kind: 'status', oldDisplay: statusName(oldValue), newDisplay: statusName(newValue) };
		}
		if (field === 'assignee_id') {
			return { kind: 'assignee', newDisplay: newValue ? ownerName(Number(newValue)) : null };
		}
		if (field === 'description') {
			return { kind: 'description' };
		}
		if (field === 'tags' || field === 'custom_fields') {
			return { kind: 'blob', label: FIELD_LABELS[field] || field };
		}
		return {
			kind: 'generic',
			label: FIELD_LABELS[field] || field.replace(/_/g, ' ') || 'this task',
			oldDisplay: oldValue || '—',
			newDisplay: newValue || '—',
		};
	};

	const b = (text: React.ReactNode) => <span style={{ fontWeight: 600 }}>{text}</span>;

	// First-person phrasing for a task describing its own history, e.g. "changed
	// status from To do to Done".
	const describeOwnFieldChange = (field: string, oldValue?: string, newValue?: string): React.ReactNode => {
		const parts = resolveFieldChange(field, oldValue, newValue);
		switch (parts.kind) {
			case 'status':
				return <>moved this from {b(parts.oldDisplay)} to {b(parts.newDisplay)}</>;
			case 'assignee':
				return parts.newDisplay
					? <>assigned <span style={{ fontWeight: 600, color: theme.palette.primary.main }}>{parts.newDisplay}</span></>
					: <>removed the assignee</>;
			case 'description':
				return <>updated the description</>;
			case 'blob':
				return <>updated {parts.label.toLowerCase()}</>;
			case 'generic':
				return (
					<>
						changed {b(parts.label.toLowerCase())} from{' '}
						<span style={{ textDecoration: 'line-through', opacity: 0.6 }}>{parts.oldDisplay}</span> to {b(parts.newDisplay)}
					</>
				);
		}
	};

	// Third-person phrasing for a sub-task's change rolled up onto its parent, e.g.
	// "sub-task 'Roof Installation' moved from To do to Done".
	const describeSubtaskFieldChange = (field: string, oldValue?: string, newValue?: string): React.ReactNode => {
		const parts = resolveFieldChange(field, oldValue, newValue);
		switch (parts.kind) {
			case 'status':
				return <>moved from {b(parts.oldDisplay)} to {b(parts.newDisplay)}</>;
			case 'assignee':
				return parts.newDisplay
					? <>was assigned to <span style={{ fontWeight: 600, color: theme.palette.primary.main }}>{parts.newDisplay}</span></>
					: <>had its assignee removed</>;
			case 'description':
				return <>had its description updated</>;
			case 'blob':
				return <>had {parts.label.toLowerCase()} updated</>;
			case 'generic':
				return (
					<>
						had {b(parts.label.toLowerCase())} changed from{' '}
						<span style={{ textDecoration: 'line-through', opacity: 0.6 }}>{parts.oldDisplay}</span> to {b(parts.newDisplay)}
					</>
				);
		}
	};

	const describeEntry = (h: ProjectTaskHistoryEntry): React.ReactNode => {
		switch (h.action) {
			case 'create':
				return <>added this to {b(projectName)}</>;
			case 'delete':
				return <>deleted this task</>;
			case 'add_subtask':
				return <>added sub-task {b(h.new_value)}</>;
			case 'remove_subtask':
				return <>removed sub-task {b(h.old_value)}</>;
			case 'attach_file':
				return <>attached file {b(h.new_value)}</>;
			case 'delete_file':
				return <>removed file {b(h.old_value)}</>;
			case 'subtask_attach_file':
				return <>attached file {b(h.new_value)} to sub-task {b(h.field_name)}</>;
			case 'subtask_delete_file':
				return <>removed file {b(h.old_value)} from sub-task {b(h.field_name)}</>;
			case 'update_subtask': {
				const { field, subtaskTitle } = splitSubtaskField(h.field_name);
				return <>sub-task {b(subtaskTitle)} {describeSubtaskFieldChange(field, h.old_value, h.new_value)}</>;
			}
			default:
				return <>{describeOwnFieldChange(h.field_name || '', h.old_value, h.new_value)}</>;
		}
	};

	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 4, pl: 1 }}>
			<Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem', mb: 1 }}>
				History of Changes
			</Typography>

			{taskHistoryLoading ? (
				<Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
					<CircularProgress size={22} />
				</Box>
			) : (
				<Box sx={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
					{/* Connecting vertical rail line */}
					<Box
						sx={{
							position: 'absolute',
							left: 14,
							top: 14,
							bottom: 14,
							width: 2,
							bgcolor: isDark ? '#30363d' : '#d0d7de',
							zIndex: 0,
						}}
					/>

					{taskHistory.map((h) => (
						<Box key={h.id} sx={{ display: 'flex', gap: 2, mb: 3.5, position: 'relative', zIndex: 1 }}>
							{/* Circle Icon Container */}
							<Box
								sx={{
									width: 30,
									height: 30,
									borderRadius: '50%',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									bgcolor: isDark ? '#161b22' : '#f6f8fa',
									border: '1px solid',
									borderColor: isDark ? '#30363d' : '#d0d7de',
									flexShrink: 0,
								}}
							>
								{getHistoryIcon(h)}
							</Box>

							{/* Right side event detail text */}
							<Box sx={{ flex: 1, pt: 0.5 }}>
								<Stack direction="row" alignItems="center" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 0.5 }}>
									<Avatar
										sx={{
											width: 18,
											height: 18,
											fontSize: '0.6rem',
											fontWeight: 700,
											bgcolor: theme.palette.primary.main,
											color: 'white',
										}}
									>
										{actorName(h.changed_by_user_id)[0]?.toUpperCase()}
									</Avatar>
									<Typography variant="body2" sx={{ fontSize: '0.825rem', color: 'text.primary' }}>
										<span style={{ fontWeight: 700 }}>{actorName(h.changed_by_user_id)}</span> {describeEntry(h)}{' '}
										<Box component="span" sx={{ color: 'text.secondary', ml: 1, whiteSpace: 'nowrap', fontSize: '0.75rem' }}>
											on {dayjs(h.changed_at).format('MMM D, YYYY')}
										</Box>
									</Typography>
								</Stack>
							</Box>
						</Box>
					))}

					{!hasCreateEvent && (
						<Box sx={{ display: 'flex', gap: 2, position: 'relative', zIndex: 1, opacity: 0.75 }}>
							<Box
								sx={{
									width: 30,
									height: 30,
									borderRadius: '50%',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									bgcolor: isDark ? '#161b22' : '#f6f8fa',
									border: '1px solid',
									borderColor: isDark ? '#30363d' : '#d0d7de',
									flexShrink: 0,
								}}
							>
								<AddCircleOutline sx={{ fontSize: 15, color: 'text.secondary' }} />
							</Box>
							<Box sx={{ flex: 1, pt: 0.5 }}>
								<Typography variant="body2" sx={{ fontSize: '0.825rem', color: 'text.secondary', fontStyle: 'italic' }}>
									Task created{' '}
									<Box component="span" sx={{ ml: 1, whiteSpace: 'nowrap', fontSize: '0.75rem' }}>
										on {dayjs(task.created_at).format('MMM D, YYYY')}
									</Box>
								</Typography>
							</Box>
						</Box>
					)}
				</Box>
			)}
		</Box>
	);
};

export default TaskHistoryTimeline;
