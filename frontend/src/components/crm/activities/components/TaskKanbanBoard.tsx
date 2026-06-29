import React from 'react';
import { Box, Typography, Checkbox, Stack, Chip, useTheme, Tooltip, IconButton, Avatar, alpha } from '@mui/material';
import { DeleteOutline, WarningAmber, Schedule, Assignment, CheckCircle, Description, Groups, Call, FactCheck, RateReview } from '@mui/icons-material';
import { useAppDispatch } from '../../../../store/hooks';
import { updateDealTask, deleteDealTask } from '../../../../store/slices/crmSlice';
import type { DealTask, DealTaskType, DealTaskPriority } from '../../../../models/crm/dealTask';
import type { CRMOwnerOption } from '../../../../models/crm/owner';
import { KanbanBoard, KanbanCard } from '../../../common/kanban';
import type { KanbanColumnDef } from '../../../common/kanban/KanbanBoard';
import useToast from '../../../../hooks/useToast';

interface TaskKanbanBoardProps {
	tasks: (DealTask & { deal_title?: string; deal_public_id?: string })[];
	loading: boolean;
	owners: CRMOwnerOption[];
}

const isOverdue = (task: DealTask): boolean => {
	if (!task.due_date || task.status === 'completed') return false;
	return new Date(task.due_date) < new Date();
};

const formatDate = (dateStr?: string): string => {
	if (!dateStr) return '';
	return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const getTaskTypeIcon = (type: DealTaskType) => {
	const s = { sx: { fontSize: 11 } };
	switch (type) {
		case 'document': return <Description {...s} />;
		case 'meeting': return <Groups {...s} />;
		case 'call': return <Call {...s} />;
		case 'action': return <FactCheck {...s} />;
		case 'review': return <RateReview {...s} />;
		default: return <Assignment {...s} />;
	}
};

const getTaskTypeColor = (type: DealTaskType): string => {
	const map: Record<DealTaskType, string> = {
		document: '#2196F3',
		meeting: '#9C27B0',
		call: '#4CAF50',
		action: '#FF9800',
		review: '#00BCD4',
		other: '#9E9E9E',
	};
	return map[type];
};

const getPriorityColor = (priority: DealTaskPriority): string => {
	const map: Record<DealTaskPriority, string> = {
		low: '#4CAF50',
		medium: '#2196F3',
		high: '#FF9800',
		urgent: '#F44336',
	};
	return map[priority] || '#9E9E9E';
};

export const TaskKanbanBoard: React.FC<TaskKanbanBoardProps> = ({ tasks, loading, owners }) => {
	const dispatch = useAppDispatch();
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const toast = useToast();

	const columns: KanbanColumnDef[] = [
		{ id: 'pending', label: 'Pending', color: theme.palette.primary.main },
		{ id: 'in_progress', label: 'In Progress', color: theme.palette.info.main },
		{ id: 'blocked', label: 'Blocked', color: '#9C27B0' },
		{ id: 'completed', label: 'Completed', color: theme.palette.success.main },
	];

	const handleStatusToggle = async (task: DealTask) => {
		const isCompleted = task.status === 'completed';
		try {
			await dispatch(updateDealTask({
				taskPublicId: task.public_id,
				payload: {
					status: isCompleted ? 'pending' : 'completed',
				}
			})).unwrap();
			toast.success(isCompleted ? 'Task marked as pending' : 'Task completed 🎉');
		} catch (err: any) {
			toast.error(err || 'Failed to update task');
		}
	};

	const handleDelete = async (publicId: string) => {
		try {
			await dispatch(deleteDealTask(publicId)).unwrap();
			toast.success('Task deleted');
		} catch (err: any) {
			toast.error(err || 'Failed to delete task');
		}
	};

	const handleMoveItem = async (task: DealTask, targetColumn: KanbanColumnDef) => {
		const targetStatus = targetColumn.id as DealTask['status'];
		try {
			await dispatch(updateDealTask({
				taskPublicId: task.public_id,
				payload: { status: targetStatus }
			})).unwrap();
			toast.success(`Task moved to ${targetColumn.label}`);
		} catch (err: any) {
			toast.error(err || 'Failed to move task');
		}
	};

	const renderCard = (task: DealTask & { deal_title?: string }) => {
		const isTaskCompleted = task.status === 'completed';
		const isTaskOverdue = isOverdue(task);
		const colColor = isTaskCompleted
			? theme.palette.success.main
			: (task.status === 'blocked' ? '#9C27B0' : (task.status === 'in_progress' ? theme.palette.info.main : theme.palette.primary.main));

		const assignee = task.assignee_id ? owners.find((o) => o.id === task.assignee_id) : null;
		const initials = assignee ? (assignee.full_name || assignee.email).split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';

		const pColor = getPriorityColor(task.priority);

		return (
			<KanbanCard id={task.public_id} data={{ item: task }}>
				<Box sx={{ borderLeft: '4px solid', borderLeftColor: colColor, pl: 1, ml: -1.5, my: -0.5 }}>
					<Stack direction="row" spacing={1.5} alignItems="flex-start">
						<Checkbox
							checked={isTaskCompleted}
							onChange={() => handleStatusToggle(task)}
							icon={<Box sx={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid', borderColor: 'text.disabled' }} />}
							checkedIcon={<CheckCircle color="success" sx={{ fontSize: 20 }} />}
							sx={{ p: 0, mt: 0.25 }}
						/>
						<Box sx={{ flex: 1, minWidth: 0 }}>
							<Typography
								variant="body2"
								sx={{
									fontWeight: 700,
									textDecoration: isTaskCompleted ? 'line-through' : 'none',
									color: isTaskCompleted ? 'text.secondary' : 'text.primary',
									mb: 0.5,
									wordBreak: 'break-word',
								}}
							>
								{task.title}
							</Typography>

							{task.notes && (
								<Typography
									variant="caption"
									color="text.secondary"
									sx={{
										display: '-webkit-box',
										WebkitLineClamp: 2,
										WebkitBoxOrient: 'vertical',
										overflow: 'hidden',
										mb: 1.5,
										wordBreak: 'break-word',
									}}
								>
									{task.notes.replace(/<[^>]*>/g, '')}
								</Typography>
							)}

							{/* Task Details Info Badges */}
							<Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mb: 1.5 }}>
								{/* Priority Chip */}
								<Chip
									label={`${task.priority} Priority`}
									size="small"
									sx={{
										fontSize: '0.65rem',
										height: 20,
										fontWeight: 700,
										bgcolor: alpha(pColor, 0.08),
										color: pColor,
										border: '1px solid',
										borderColor: alpha(pColor, 0.15),
										textTransform: 'capitalize',
									}}
								/>

								{/* Task Type Badges */}
								<Chip
									label={task.task_type}
									size="small"
									icon={getTaskTypeIcon(task.task_type)}
									sx={{
										fontSize: '0.65rem',
										height: 20,
										fontWeight: 600,
										bgcolor: alpha(getTaskTypeColor(task.task_type), 0.08),
										color: getTaskTypeColor(task.task_type),
										border: '1px solid',
										borderColor: alpha(getTaskTypeColor(task.task_type), 0.15),
										textTransform: 'capitalize',
									}}
								/>

								{/* Deal Relation Badges */}
								<Chip
									label={task.deal_title ? `Deal: ${task.deal_title}` : 'Linked Deal'}
									size="small"
									icon={<Assignment sx={{ fontSize: 10 }} />}
									sx={{
										fontSize: '0.65rem',
										height: 20,
										fontWeight: 600,
										bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
										color: 'text.secondary',
										maxWidth: '120px',
									}}
								/>
							</Stack>

							<Stack direction="row" alignItems="center" justifyContent="space-between">
								{/* Due Date Indicator */}
								{task.due_date ? (
									<Stack direction="row" spacing={0.5} alignItems="center">
										{isTaskOverdue ? (
											<WarningAmber sx={{ fontSize: 12, color: 'error.main' }} />
										) : (
											<Schedule sx={{ fontSize: 12, color: 'text.secondary' }} />
										)}
										<Typography
											variant="caption"
											sx={{
												fontWeight: 600,
												color: isTaskOverdue ? 'error.main' : 'text.secondary',
											}}
										>
											{formatDate(task.due_date)}
										</Typography>
									</Stack>
								) : (
									<Box />
								)}

								{/* Assignee Avatar */}
								{assignee && (
									<Tooltip title={`Assignee: ${assignee.full_name || assignee.email}`}>
										<Avatar
											sx={{
												width: 24,
												height: 24,
												fontSize: '0.65rem',
												fontWeight: 700,
												bgcolor: theme.palette.primary.main,
												color: '#ffffff',
											}}
										>
											{initials}
										</Avatar>
									</Tooltip>
								)}
							</Stack>
						</Box>

						<Tooltip title="Delete Task">
							<IconButton
								size="small"
								onClick={(e) => {
									e.stopPropagation();
									handleDelete(task.public_id);
								}}
								sx={{
									p: 0.25,
									color: 'text.disabled',
									'&:hover': { color: 'error.main' },
								}}
							>
								<DeleteOutline sx={{ fontSize: 16 }} />
							</IconButton>
						</Tooltip>
					</Stack>
				</Box>
			</KanbanCard>
		);
	};

	return (
		<KanbanBoard<DealTask>
			columns={columns}
			items={tasks}
			getItemId={(t) => t.public_id}
			getItemColumnId={(t) => t.status}
			renderCard={renderCard}
			onMoveItem={handleMoveItem}
			loading={loading}
			columnWidth={290}
		/>
	);
};

export default TaskKanbanBoard;
