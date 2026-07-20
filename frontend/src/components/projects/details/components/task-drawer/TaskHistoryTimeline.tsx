import React, { useEffect } from 'react';
import {
	Box,
	Stack,
	Typography,
	CircularProgress,
	useTheme,
	alpha,
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
	HistoryToggleOff,
	ChatBubbleOutline,
} from '@mui/icons-material';
import type { ProjectTask, ProjectTaskStatus, ProjectTaskHistoryEntry } from '../../../../../models/projects/projectTask';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { CRMOwnerOption } from '../../../../../models/crm/owner';
import { useAppDispatch, useAppSelector } from '../../../../../store/hooks';
import { fetchTaskHistory } from '../../../../../store/slices/projectsSlice';
import useDateTime from '../../../../../hooks/useDateTime';
import EnterpriseAvatar, { getAvatarColor } from '../../../../common/avatar/Avatar';

interface TaskHistoryTimelineProps {
	task: ProjectTask;
	tasks: ProjectTask[];
	statuses: ProjectTaskStatus[];
	owners: CRMOwnerOption[];
	projectName: string;
}

/** Every icon imported above shares this shape -- used instead of importing MUI's
 *  (unexported) SvgIconComponent type. */
type IconType = typeof AddCircleOutline;

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
	const { formatDateTime } = useDateTime();

	const { taskHistory, taskHistoryLoading } = useAppSelector((state) => state.projects);
	const taskFiles = useAppSelector((state) => state.projects.taskFiles);
	const subtasks = tasks.filter((t) => t.parent_task_id === task.id);

	// Audit logging only started recording events going forward from when this
	// feature shipped -- a task created (or last edited) before that has no real
	// "create" row. Rather than show a blank/misleading empty state for those,
	// fall back to the one fact we always know for certain: task.created_at.
	const hasCreateEvent = taskHistory.some((h) => h.action === 'create');

	// Re-fetch whenever anything that can generate a new history row for this task
	// changes -- the task itself (description/status/priority/etc.), its sub-tasks
	// (a sub-task's own updated_at, since editing it doesn't touch the parent's),
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

	// A colored status "pill" (reusing the status's own board color) instead of
	// plain bold text -- makes status transitions scannable at a glance and matches
	// how statuses are already rendered everywhere else in the drawer.
	const StatusPill: React.FC<{ statusId?: string | null }> = ({ statusId }) => {
		const s = statuses.find((st) => String(st.id) === String(statusId));
		if (!s) {
			return <span style={{ fontWeight: 700 }}>{statusId ? `#${statusId}` : '—'}</span>;
		}
		return (
			<Box
				component="span"
				sx={{
					display: 'inline-flex',
					alignItems: 'center',
					gap: 0.6,
					px: 1,
					py: 0.2,
					borderRadius: '100px',
					fontSize: '0.72rem',
					fontWeight: 700,
					bgcolor: alpha(s.color, 0.12),
					color: s.color,
					border: '1px solid',
					borderColor: alpha(s.color, 0.35),
					verticalAlign: 'middle',
					mx: 0.25,
				}}
			>
				<Box component="span" sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: s.color, display: 'inline-block', flexShrink: 0 }} />
				{s.name}
			</Box>
		);
	};

	// Each event type/field gets its own accent color, applied to both its icon
	// circle and (for status pills) reused via the status's own color -- gives the
	// feed a scannable rhythm instead of one flat gray icon for everything.
	const resolveEvent = (h: ProjectTaskHistoryEntry): { Icon: IconType; color: string } => {
		switch (h.action) {
			case 'create':
				return { Icon: AddCircleOutline, color: theme.palette.success.main };
			case 'comment':
				return { Icon: ChatBubbleOutline, color: theme.palette.info.main };
			case 'delete':
			case 'remove_subtask':
				return { Icon: h.action === 'delete' ? DeleteOutline : FormatListBulleted, color: theme.palette.error.main };
			case 'add_subtask':
				return { Icon: FormatListBulleted, color: theme.palette.success.main };
			case 'attach_file':
			case 'delete_file':
			case 'subtask_attach_file':
			case 'subtask_delete_file':
				return { Icon: AttachFile, color: '#d97706' };
			default:
				break;
		}
		const field = h.action === 'update_subtask' ? splitSubtaskField(h.field_name).field : (h.field_name || '');
		switch (field) {
			case 'status_id':
				return { Icon: Adjust, color: theme.palette.primary.main };
			case 'assignee_id':
				return { Icon: PersonOutline, color: theme.palette.secondary.main };
			case 'description':
				return { Icon: DescriptionOutlined, color: theme.palette.info.main };
			case 'tags':
				return { Icon: LocalOfferOutlined, color: '#d97706' };
			case 'priority':
				return { Icon: OutlinedFlag, color: '#d97706' };
			default:
				return { Icon: EditOutlined, color: theme.palette.text.secondary };
		}
	};

	// Resolves a raw field/old/new triple into human-readable display values --
	// shared by a task's own field changes and by a sub-task's field changes
	// rolled up onto its parent, so status/owner lookups and field labels aren't
	// duplicated between the two (they still get their own sentence phrasing below,
	// since "I changed X" and "sub-task Y had X changed" are different grammar).
	type FieldChangeParts =
		| { kind: 'status'; oldId?: string; newId?: string }
		| { kind: 'assignee'; newDisplay: string | null }
		| { kind: 'description' }
		| { kind: 'blob'; label: string }
		| { kind: 'generic'; label: string; oldDisplay: string; newDisplay: string };

	const resolveFieldChange = (field: string, oldValue?: string, newValue?: string): FieldChangeParts => {
		if (field === 'status_id') {
			return { kind: 'status', oldId: oldValue, newId: newValue };
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
	const assigneeChip = (name: string) => (
		<span style={{ fontWeight: 700, color: getAvatarColor(name, theme) }}>{name}</span>
	);

	// First-person phrasing for a task describing its own history, e.g. "changed
	// status from To do to Done".
	const describeOwnFieldChange = (field: string, oldValue?: string, newValue?: string): React.ReactNode => {
		const parts = resolveFieldChange(field, oldValue, newValue);
		switch (parts.kind) {
			case 'status':
				return <>moved this from <StatusPill statusId={parts.oldId} /> to <StatusPill statusId={parts.newId} /></>;
			case 'assignee':
				return parts.newDisplay ? <>assigned {assigneeChip(parts.newDisplay)}</> : <>removed the assignee</>;
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
				return <>moved from <StatusPill statusId={parts.oldId} /> to <StatusPill statusId={parts.newId} /></>;
			case 'assignee':
				return parts.newDisplay ? <>was assigned to {assigneeChip(parts.newDisplay)}</> : <>had its assignee removed</>;
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
			case 'comment':
				return <>commented</>;
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

	const railColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';

	const renderRow = (key: React.Key, Icon: IconType, color: string, content: React.ReactNode, opacity = 1) => (
		<Box
			key={key}
			sx={{
				display: 'flex',
				gap: 1.75,
				position: 'relative',
				zIndex: 1,
				py: 0.75,
				px: 1,
				mx: -1,
				borderRadius: '8px',
				opacity,
				transition: 'background-color 0.12s ease',
				'&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.02)' },
			}}
		>
			<Box
				sx={{
					width: 28,
					height: 28,
					borderRadius: '50%',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					bgcolor: alpha(color, isDark ? 0.16 : 0.1),
					border: '1px solid',
					borderColor: alpha(color, 0.3),
					color,
					flexShrink: 0,
				}}
			>
				<Icon sx={{ fontSize: 14 }} />
			</Box>
			<Box sx={{ flex: 1, minWidth: 0, pt: 0.2 }}>{content}</Box>
		</Box>
	);

	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 4, pl: 1 }}>
			<Stack direction="row" alignItems="center" spacing={0.75}>
				<HistoryToggleOff sx={{ fontSize: 15, color: 'text.secondary' }} />
				<Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem' }}>
					History of Changes
				</Typography>
				{taskHistory.length > 0 && (
					<Box
						sx={{
							px: 0.85,
							py: 0.05,
							borderRadius: '100px',
							bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
							color: 'text.secondary',
							fontSize: '0.68rem',
							fontWeight: 700,
						}}
					>
						{taskHistory.length}
					</Box>
				)}
			</Stack>

			{taskHistoryLoading && taskHistory.length === 0 ? (
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
							bgcolor: railColor,
							zIndex: 0,
						}}
					/>

					{taskHistory.map((h) => {
						const { Icon, color } = resolveEvent(h);
						// A comment with no author is ARIA's own reply (see the @ARIA-mention
						// handling in the comments endpoint) -- everything else with a null
						// actor is a genuinely unattributable event, not ARIA.
						const name = h.action === 'comment' && h.changed_by_user_id == null
							? 'ARIA'
							: actorName(h.changed_by_user_id);
						const nameColor = getAvatarColor(name, theme);

						return renderRow(
							h.id,
							Icon,
							color,
							<Stack spacing={0.75} sx={{ width: '100%' }}>
								<Stack direction="row" alignItems="center" spacing={0.9} sx={{ flexWrap: 'wrap', rowGap: 0.5 }}>
									<EnterpriseAvatar name={name} size={20} sx={{ fontSize: '0.62rem', borderRadius: '6px' }} />
									<Typography component="span" sx={{ fontWeight: 700, fontSize: '0.8rem', color: nameColor }}>
										{name}
									</Typography>
									<Typography component="span" variant="body2" sx={{ fontSize: '0.8rem', color: 'text.secondary', lineHeight: 1.5 }}>
										{describeEntry(h)}
									</Typography>
									<Typography component="span" sx={{ color: 'text.disabled', whiteSpace: 'nowrap', fontSize: '0.7rem', ml: 'auto', pl: 1 }}>
										{formatDateTime(h.changed_at)}
									</Typography>
								</Stack>
								{h.action === 'comment' && h.new_value && (
									<Box
										sx={{
											mt: 0.5,
											p: 1.25,
											borderRadius: '8px',
											bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
											border: '1px solid',
											borderColor: isDark ? '#30363d' : '#d0d7de',
											'& .markdown-body': {
												fontSize: '0.8rem',
												lineHeight: 1.5,
												color: 'text.primary',
											}
										}}
									>
										<Box className="markdown-body">
											<ReactMarkdown remarkPlugins={[remarkGfm]}>{h.new_value}</ReactMarkdown>
										</Box>
									</Box>
								)}
							</Stack>
						);
					})}

					{!hasCreateEvent && renderRow(
						'synthetic-create',
						AddCircleOutline,
						theme.palette.text.secondary,
						<Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'text.secondary', fontStyle: 'italic' }}>
							Task created
							<Box component="span" sx={{ ml: 1, whiteSpace: 'nowrap', fontSize: '0.7rem', fontStyle: 'normal', color: 'text.disabled' }}>
								{formatDateTime(task.created_at)}
							</Box>
						</Typography>,
						0.75
					)}
				</Box>
			)}
		</Box>
	);
};

export default TaskHistoryTimeline;
