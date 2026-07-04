import React from 'react';
import { Box, Typography, Stack, Chip, Avatar, Tooltip, IconButton, alpha, useTheme } from '@mui/material';
import { DeleteOutline, WarningAmber, Schedule, AccountTreeOutlined, AddOutlined, AttachMoneyOutlined } from '@mui/icons-material';
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
	tasks, statuses, owners, loading, onMoveTask, onEditTask, onAddSubtask, onDeleteTask,
}) => {
	const theme = useTheme();

	// Only top-level tasks get their own board card — a card with sub-tasks
	// shows a count chip instead of giving each sub-task its own board lane,
	// which would clutter columns fast.
	const topLevelTasks = tasks.filter((t) => t.parent_task_id == null);
	const subtaskCountByParent = tasks.reduce<Record<number, number>>((acc, t) => {
		if (t.parent_task_id != null) acc[t.parent_task_id] = (acc[t.parent_task_id] || 0) + 1;
		return acc;
	}, {});

	const columns: KanbanColumnDef[] = [...statuses]
		.sort((a, b) => a.order - b.order)
		.map((s) => ({ id: s.id, label: s.name, color: s.color }));

	const handleMoveItem = (task: ProjectTask, targetColumn: KanbanColumnDef) => {
		const targetStatus = statuses.find((s) => s.id === targetColumn.id);
		if (targetStatus) onMoveTask(task, targetStatus);
	};

	const renderCard = (task: ProjectTask) => {
		const status = statuses.find((s) => s.id === task.status_id);
		const overdue = isOverdue(task, statuses);
		const assignee = task.assignee_id ? owners.find((o) => o.id === task.assignee_id) : null;
		const initials = assignee ? (assignee.full_name || assignee.email).split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) : '?';
		const pColor = getPriorityColor(task.priority);
		const subtaskCount = subtaskCountByParent[task.id] || 0;

		return (
			<KanbanCard id={task.public_id} data={{ item: task }} onClick={() => onEditTask(task)}>
				<Box sx={{ borderLeft: '4px solid', borderLeftColor: status?.color || 'divider', pl: 1, ml: -1.5, my: -0.5 }}>
					<Stack direction="row" justifyContent="space-between" alignItems="flex-start">
						<Typography variant="body2" sx={{ fontWeight: 700, mb: 0.75, wordBreak: 'break-word' }}>
							{task.title}
						</Typography>
						<Tooltip title="Delete Task">
							<IconButton
								size="small"
								onClick={(e) => { e.stopPropagation(); onDeleteTask(task); }}
								sx={{ p: 0.25, color: 'text.disabled', '&:hover': { color: 'error.main' } }}
							>
								<DeleteOutline sx={{ fontSize: 16 }} />
							</IconButton>
						</Tooltip>
					</Stack>

					<Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mb: 1.25 }}>
						<Chip
							label={`${task.priority} priority`}
							size="small"
							sx={{
								fontSize: '0.65rem', height: 20, fontWeight: 700, textTransform: 'capitalize',
								bgcolor: alpha(pColor, 0.08), color: pColor, border: '1px solid', borderColor: alpha(pColor, 0.15),
							}}
						/>
						{task.billing_type === 'non_billable' && (
							<Chip label="Non-billable" size="small" sx={{ fontSize: '0.65rem', height: 20, fontWeight: 600 }} />
						)}
						{task.estimated_hours != null && (
							<Chip
								label={`${task.estimated_hours}h est.`}
								size="small"
								icon={<AttachMoneyOutlined sx={{ fontSize: 10 }} />}
								sx={{ fontSize: '0.65rem', height: 20, fontWeight: 600 }}
							/>
						)}
						{subtaskCount > 0 && (
							<Chip
								label={`${subtaskCount} sub-task${subtaskCount === 1 ? '' : 's'}`}
								size="small"
								icon={<AccountTreeOutlined sx={{ fontSize: 10 }} />}
								sx={{ fontSize: '0.65rem', height: 20, fontWeight: 600 }}
							/>
						)}
					</Stack>

					<Stack direction="row" alignItems="center" justifyContent="space-between">
						<Stack direction="row" spacing={1} alignItems="center">
							{task.due_date ? (
								<Stack direction="row" spacing={0.5} alignItems="center">
									{overdue ? <WarningAmber sx={{ fontSize: 12, color: 'error.main' }} /> : <Schedule sx={{ fontSize: 12, color: 'text.secondary' }} />}
									<Typography variant="caption" sx={{ fontWeight: 600, color: overdue ? 'error.main' : 'text.secondary' }}>
										{formatDate(task.due_date)}
									</Typography>
								</Stack>
							) : <Box />}
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

						{assignee && (
							<Tooltip title={`Assignee: ${assignee.full_name || assignee.email}`}>
								<Avatar sx={{ width: 24, height: 24, fontSize: '0.65rem', fontWeight: 700, bgcolor: theme.palette.primary.main, color: '#ffffff' }}>
									{initials}
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
