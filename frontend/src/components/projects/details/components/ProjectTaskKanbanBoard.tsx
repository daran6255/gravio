import React from 'react';
import { Box, Typography, Stack, Avatar, Tooltip, IconButton, alpha, useTheme } from '@mui/material';
import { WarningAmber, Schedule, AccountTreeOutlined, AddOutlined, PersonOutline, WorkspacePremiumOutlined } from '@mui/icons-material';
import { KanbanBoard, KanbanCard } from '../../../common/kanban';
import type { KanbanColumnDef } from '../../../common/kanban/KanbanBoard';
import type { ProjectTask, ProjectTaskStatus } from '../../../../models/projects/projectTask';
import type { CRMOwnerOption } from '../../../../models/crm/owner';

interface ProjectTaskKanbanBoardProps {
	tasks: ProjectTask[];
	statuses: ProjectTaskStatus[];
	owners: CRMOwnerOption[];
	loading: boolean;
	onMoveTask: (task: ProjectTask, targetStatus: ProjectTaskStatus) => void;
	onEditTask: (task: ProjectTask) => void;
	onAddSubtask: (parent: ProjectTask) => void;
	onDeleteTask: (task: ProjectTask) => void;
}

const isOverdue = (task: ProjectTask, statuses: ProjectTaskStatus[]): boolean => {
	if (!task.due_date) return false;
	const status = statuses.find((s) => s.id === task.status_id);
	if (status?.is_done_status) return false;
	return new Date(task.due_date) < new Date();
};

const formatDate = (dateStr?: string): string => {
	if (!dateStr) return '';
	return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const getPriorityColor = (priority: ProjectTask['priority']): string => {
	const map: Record<ProjectTask['priority'], string> = {
		low: '#4CAF50',
		medium: '#2196F3',
		high: '#FF9800',
		urgent: '#F44336',
	};
	return map[priority] || '#9E9E9E';
};

export const ProjectTaskKanbanBoard: React.FC<ProjectTaskKanbanBoardProps> = ({
	tasks, statuses, owners, loading, onMoveTask, onEditTask, onAddSubtask,
}) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';

	// Only top-level tasks get their own board card — a card with sub-tasks
	// shows a count chip instead of giving each sub-task its own board lane,
	// which would clutter columns fast.
	const topLevelTasks = tasks.filter((t) => t.parent_task_id == null);

	const columns: KanbanColumnDef[] = [...statuses]
		.sort((a, b) => a.order - b.order)
		.map((s) => ({ id: s.id, label: s.name, color: s.color }));

	const handleMoveItem = (task: ProjectTask, targetColumn: KanbanColumnDef) => {
		const targetStatus = statuses.find((s) => s.id === targetColumn.id);
		if (targetStatus) onMoveTask(task, targetStatus);
	};

	const renderCard = (task: ProjectTask) => {
		const overdue = isOverdue(task, statuses);
		const assignee = task.assignee_id ? owners.find((o) => o.id === task.assignee_id) : null;
		const initials = assignee ? (assignee.full_name || assignee.email).split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) : '?';
		const pColor = getPriorityColor(task.priority);
		
		// Subtask count and progress
		const subtasks = tasks.filter((t) => t.parent_task_id === task.id);
		const totalSubtasks = subtasks.length;
		const completedSubtasks = subtasks.filter((st) => {
			const subStatus = statuses.find((s) => s.id === st.status_id);
			return subStatus?.is_done_status ?? false;
		}).length;
		const subtasksPercent = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

		const currentType = task.custom_fields?.task_type || { name: 'Task', color: '#FF9800' };

		const dateText = (() => {
			if (!task.due_date) return null;
			const formattedDue = formatDate(task.due_date);
			if (!task.start_date) return formattedDue;
			const formattedStart = formatDate(task.start_date);
			return `${formattedStart} - ${formattedDue}`;
		})();

		const trackingText = (() => {
			if (task.actual_hours != null && task.estimated_hours != null) {
				return `${task.actual_hours}h / ${task.estimated_hours}h`;
			}
			if (task.actual_hours != null) {
				return `${task.actual_hours}h logged`;
			}
			if (task.estimated_hours != null) {
				return `${task.estimated_hours}h est.`;
			}
			return null;
		})();

		const createdDateText = (() => {
			return `Created ${new Date(task.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
		})();

		return (
			<KanbanCard id={task.public_id} data={{ item: task }} onClick={() => onEditTask(task)}>
				<Box sx={{ my: -0.5 }}>
					{/* Top metadata line: Task Type + Milestone (left) — ID (right) */}
					<Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1} sx={{ mb: 1.25 }}>
						<Stack direction="row" alignItems="center" flexWrap="wrap" sx={{ rowGap: 0.5, columnGap: 0.5 }}>
							{/* Task Type badge */}
							<Box
								sx={{
									px: 1,
									py: 0.25,
									borderRadius: '6px',
									fontSize: '0.64rem',
									fontWeight: 800,
									bgcolor: alpha(currentType.color, 0.12),
									color: currentType.color,
									letterSpacing: '0.04em',
									textTransform: 'uppercase',
									lineHeight: 1.4,
								}}
							>
								{currentType.name}
							</Box>

							{/* Milestone badge */}
							{task.custom_fields?.milestone && (
								<Stack
									direction="row"
									alignItems="center"
									spacing={0.5}
									sx={{
										px: 1,
										py: 0.25,
										borderRadius: '6px',
										bgcolor: alpha(task.custom_fields.milestone.color, 0.12),
										color: task.custom_fields.milestone.color,
									}}
								>
									<WorkspacePremiumOutlined sx={{ fontSize: 12 }} />
									<Typography sx={{ fontSize: '0.64rem', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', lineHeight: 1.4 }}>
										{task.custom_fields.milestone.name}
									</Typography>
								</Stack>
							)}
						</Stack>

						{/* Task ID */}
						<Typography variant="caption" sx={{ fontSize: '0.68rem', color: 'text.disabled', fontWeight: 700, flexShrink: 0 }}>
							#{task.id}
						</Typography>
					</Stack>

					{/* Title */}
					<Typography
						sx={{
							fontWeight: 700,
							fontSize: '0.9rem',
							color: 'text.primary',
							mb: 1.5,
							lineHeight: 1.4,
							letterSpacing: '-0.01em',
							wordBreak: 'break-word',
							display: '-webkit-box',
							WebkitLineClamp: 2,
							WebkitBoxOrient: 'vertical',
							overflow: 'hidden',
						}}
					>
						{task.title}
					</Typography>

					{/* Metadata Chips: Priority, Labels, Estimate */}
					<Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mb: totalSubtasks > 0 ? 1.5 : 1.75 }}>
						{/* Priority indicator */}
						<Stack
							direction="row"
							alignItems="center"
							spacing={0.5}
							sx={{
								px: 1,
								py: 0.375,
								borderRadius: '999px',
								bgcolor: 'action.hover',
							}}
						>
							<Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: pColor, flexShrink: 0 }} />
							<Typography sx={{ fontSize: '0.66rem', fontWeight: 700, textTransform: 'capitalize', color: 'text.secondary' }}>
								{task.priority} priority
							</Typography>
						</Stack>

						{/* Tags/Labels */}
						{task.tags?.map((tag) => (
							<Box
								key={tag.name}
								sx={{
									px: 1,
									py: 0.375,
									borderRadius: '999px',
									fontSize: '0.66rem',
									fontWeight: 700,
									bgcolor: alpha(tag.color, 0.1),
									color: tag.color,
								}}
							>
								{tag.name}
							</Box>
						))}

						{/* Billing type if non-billable */}
						{task.billing_type === 'non_billable' && (
							<Box sx={{ px: 1, py: 0.375, borderRadius: '999px', fontSize: '0.66rem', fontWeight: 700, bgcolor: 'action.hover', color: 'text.secondary' }}>
								Non-billable
							</Box>
						)}

						{/* Log/Time Tracking Estimate */}
						{trackingText && (
							<Stack direction="row" alignItems="center" spacing={0.5} sx={{ px: 1, py: 0.375, borderRadius: '999px', bgcolor: 'action.hover' }}>
								<Schedule sx={{ fontSize: 11, color: 'text.secondary' }} />
								<Typography sx={{ fontSize: '0.66rem', fontWeight: 700, color: 'text.secondary' }}>{trackingText}</Typography>
							</Stack>
						)}
					</Stack>

					{/* Subtasks Progress Bar */}
					{totalSubtasks > 0 && (
						<Box sx={{ mb: 1.75 }}>
							<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.625 }}>
								<Stack direction="row" alignItems="center" spacing={0.5}>
									<AccountTreeOutlined sx={{ fontSize: 13, color: 'text.secondary' }} />
									<Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', fontWeight: 600 }}>
										Sub-tasks
									</Typography>
								</Stack>
								<Typography sx={{ fontSize: '0.7rem', color: 'text.primary', fontWeight: 700 }}>
									{completedSubtasks}/{totalSubtasks} <Box component="span" sx={{ color: 'text.secondary', fontWeight: 600 }}>({Math.round(subtasksPercent)}%)</Box>
								</Typography>
							</Stack>
							<Box sx={{ width: '100%', height: 6, bgcolor: 'action.hover', borderRadius: 3, overflow: 'hidden' }}>
								<Box
									sx={{
										width: `${subtasksPercent}%`,
										height: '100%',
										borderRadius: 3,
										transition: 'width 0.3s ease',
										background: subtasksPercent === 100
											? '#2da44e'
											: 'linear-gradient(90deg, #8B7CF6 0%, #4EA8FF 100%)',
									}}
								/>
							</Box>
						</Box>
					)}

					{/* Footer: Due Date + Created + Add Subtask — Assignee Avatar */}
					<Stack
						direction="row"
						alignItems="center"
						justifyContent="space-between"
						sx={{ pt: 1.25, borderTop: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}
					>
						<Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" sx={{ minWidth: 0 }}>
							{dateText ? (
								<Stack direction="row" spacing={0.5} alignItems="center">
									{overdue ? <WarningAmber sx={{ fontSize: 13, color: 'error.main' }} /> : <Schedule sx={{ fontSize: 13, color: 'text.secondary' }} />}
									<Typography sx={{ fontWeight: 600, color: overdue ? 'error.main' : 'text.secondary', fontSize: '0.7rem', whiteSpace: 'nowrap' }}>
										{dateText}
									</Typography>
								</Stack>
							) : (
								<Typography sx={{ fontSize: '0.7rem', color: 'text.disabled', fontStyle: 'italic' }}>
									No due date
								</Typography>
							)}

							<Typography sx={{ fontSize: '0.68rem', color: 'text.disabled', whiteSpace: 'nowrap' }}>
								· {createdDateText}
							</Typography>

							<Tooltip title="Add sub-task">
								<IconButton
									size="small"
									onClick={(e) => { e.stopPropagation(); onAddSubtask(task); }}
									sx={{ p: 0.25, color: 'text.disabled', '&:hover': { color: theme.palette.primary.main, bgcolor: alpha(theme.palette.primary.main, 0.08) } }}
								>
									<AddOutlined sx={{ fontSize: 14 }} />
								</IconButton>
							</Tooltip>
						</Stack>

						{/* Assignee Avatar */}
						{assignee ? (
							<Tooltip title={`Assignee: ${assignee.full_name || assignee.email}`}>
								<Avatar
									sx={{
										width: 24,
										height: 24,
										fontSize: '0.62rem',
										fontWeight: 700,
										bgcolor: theme.palette.primary.main,
										color: '#ffffff',
										border: '2px solid',
										borderColor: isDark ? '#1B2130' : '#F8FAFC',
										flexShrink: 0,
									}}
								>
									{initials}
								</Avatar>
							</Tooltip>
						) : (
							<Tooltip title="Unassigned">
								<Avatar sx={{ width: 24, height: 24, bgcolor: 'transparent', border: '1.5px dashed', borderColor: 'text.disabled', color: 'text.disabled', flexShrink: 0 }}>
									<PersonOutline sx={{ fontSize: 12 }} />
								</Avatar>
							</Tooltip>
						)}
					</Stack>
				</Box>
			</KanbanCard>
		);
	};

	return (
		<KanbanBoard<ProjectTask>
			columns={columns}
			items={topLevelTasks}
			getItemId={(t) => t.public_id}
			getItemColumnId={(t) => t.status_id}
			renderCard={renderCard}
			onMoveItem={handleMoveItem}
			loading={loading}
			emptyMessage="No task statuses configured for this organization yet."
		/>
	);
};

export default ProjectTaskKanbanBoard;
