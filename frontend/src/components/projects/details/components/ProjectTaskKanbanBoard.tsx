import React from 'react';
import { Box, Typography, Stack, Chip, Avatar, Tooltip, IconButton, alpha, useTheme, Divider } from '@mui/material';
import { WarningAmber, Schedule, AccountTreeOutlined, AddOutlined, PersonOutline } from '@mui/icons-material';
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
			const subStatus = statuses.find((s) => s.id === st.status_id) || statuses[0];
			return subStatus.is_done_status;
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
					{/* Top metadata line: Task Type + Milestone + ID */}
					<Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1, flexWrap: 'wrap', gap: 0.5 }}>
						{/* Task Type badge */}
						<Box
							sx={{
								px: 1,
								py: 0.125,
								borderRadius: '4px',
								fontSize: '0.65rem',
								fontWeight: 800,
								bgcolor: alpha(currentType.color, 0.1),
								color: currentType.color,
								border: '1px solid',
								borderColor: alpha(currentType.color, 0.25),
								letterSpacing: '0.03em',
								textTransform: 'uppercase',
							}}
						>
							{currentType.name}
						</Box>

						{/* Milestone badge */}
						{task.custom_fields?.milestone && (
							<Box
								sx={{
									px: 1,
									py: 0.125,
									borderRadius: '4px',
									fontSize: '0.65rem',
									fontWeight: 800,
									bgcolor: alpha(task.custom_fields.milestone.color, 0.1),
									color: task.custom_fields.milestone.color,
									border: '1px solid',
									borderColor: alpha(task.custom_fields.milestone.color, 0.25),
									letterSpacing: '0.03em',
									textTransform: 'uppercase',
								}}
							>
								🏁 {task.custom_fields.milestone.name}
							</Box>
						)}

						{/* Task ID */}
						<Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary', fontWeight: 600 }}>
							#{task.id}
						</Typography>
					</Stack>

					{/* Title */}
					<Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem', color: 'text.primary', mb: 1.25, lineHeight: 1.4, wordBreak: 'break-word' }}>
						{task.title}
					</Typography>

					{/* Metadata Chips: Priority, Labels, Estimate */}
					<Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mb: 1.5 }}>
						{/* Priority Chip */}
						<Chip
							label={`${task.priority} priority`}
							size="small"
							sx={{
								fontSize: '0.65rem',
								height: 20,
								fontWeight: 700,
								textTransform: 'capitalize',
								bgcolor: alpha(pColor, 0.08),
								color: pColor,
								border: '1px solid',
								borderColor: alpha(pColor, 0.15),
							}}
						/>

						{/* Tags/Labels */}
						{task.tags?.map((tag) => (
							<Chip
								key={tag.name}
								label={tag.name}
								size="small"
								sx={{
									fontSize: '0.65rem',
									height: 20,
									fontWeight: 700,
									bgcolor: alpha(tag.color, 0.08),
									color: tag.color,
									border: '1px solid',
									borderColor: alpha(tag.color, 0.15),
								}}
							/>
						))}

						{/* Billing type if non-billable */}
						{task.billing_type === 'non_billable' && (
							<Chip
								label="Non-billable"
								size="small"
								sx={{ fontSize: '0.65rem', height: 20, fontWeight: 600, bgcolor: 'action.hover', color: 'text.secondary' }}
							/>
						)}

						{/* Log/Time Tracking Estimate */}
						{trackingText && (
							<Chip
								label={trackingText}
								size="small"
								icon={<Schedule sx={{ fontSize: 10 }} />}
								sx={{ fontSize: '0.65rem', height: 20, fontWeight: 600, bgcolor: 'action.hover', color: 'text.secondary' }}
							/>
						)}
					</Stack>

					{/* Subtasks Progress Bar */}
					{totalSubtasks > 0 && (
						<Box sx={{ mt: 1.5, mb: 1.5 }}>
							<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
								<Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
									<AccountTreeOutlined sx={{ fontSize: 12 }} /> Sub-tasks
								</Typography>
								<Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.primary', fontWeight: 700 }}>
									{completedSubtasks}/{totalSubtasks} ({Math.round(subtasksPercent)}%)
								</Typography>
							</Stack>
							<Box sx={{ width: '100%', height: 5, bgcolor: 'action.hover', borderRadius: 3, overflow: 'hidden' }}>
								<Box 
									sx={{ 
										width: `${subtasksPercent}%`, 
										height: '100%', 
										bgcolor: subtasksPercent === 100 ? '#2da44e' : 'primary.main', 
										borderRadius: 3, 
										transition: 'width 0.2s ease-in-out' 
									}} 
								/>
							</Box>
						</Box>
					)}

					{/* Divider between body and card actions/assignee */}
					<Divider sx={{ my: 1, opacity: 0.6 }} />

					{/* Bottom Actions Row: Due Date + Add Subtask Button + Assignee Avatar */}
					<Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ pt: 0.5 }}>
						{/* Due Date or Add subtask trigger */}
						<Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
							{dateText ? (
								<Stack direction="row" spacing={0.5} alignItems="center" sx={{ bgcolor: overdue ? alpha(theme.palette.error.main, 0.08) : 'transparent', px: 0.75, py: 0.25, borderRadius: '4px' }}>
									{overdue ? <WarningAmber sx={{ fontSize: 12, color: 'error.main' }} /> : <Schedule sx={{ fontSize: 12, color: 'text.secondary' }} />}
									<Typography variant="caption" sx={{ fontWeight: 600, color: overdue ? 'error.main' : 'text.secondary', fontSize: '0.7rem' }}>
										{dateText}
									</Typography>
								</Stack>
							) : (
								<Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.disabled', fontStyle: 'italic' }}>
									No due date
								</Typography>
							)}

							<Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.disabled' }}>
								• {createdDateText}
							</Typography>

							<Tooltip title="Add sub-task">
								<IconButton
									size="small"
									onClick={(e) => { e.stopPropagation(); onAddSubtask(task); }}
									sx={{ p: 0.25, color: 'text.disabled', '&:hover': { color: theme.palette.primary.main } }}
								>
									<AddOutlined sx={{ fontSize: 14 }} />
								</IconButton>
							</Tooltip>
						</Stack>

						{/* Assignee Avatar */}
						{assignee ? (
							<Tooltip title={`Assignee: ${assignee.full_name || assignee.email}`}>
								<Avatar sx={{ width: 22, height: 22, fontSize: '0.65rem', fontWeight: 700, bgcolor: theme.palette.primary.main, color: '#ffffff' }}>
									{initials}
								</Avatar>
							</Tooltip>
						) : (
							<Tooltip title="Unassigned">
								<Avatar sx={{ width: 22, height: 22, bgcolor: 'transparent', border: '1px dashed', borderColor: 'text.disabled', color: 'text.disabled' }}>
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
			columnWidth={290}
			emptyMessage="No task statuses configured for this organization yet."
		/>
	);
};

export default ProjectTaskKanbanBoard;
