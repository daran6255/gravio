import React from 'react';
import { Box, Typography, Checkbox, Stack, Chip, useTheme, Tooltip, IconButton } from '@mui/material';
import { DeleteOutline, WarningAmber, Schedule, Assignment, CheckCircle } from '@mui/icons-material';
import { useAppDispatch } from '../../../../store/hooks';
import { updateDealTask, deleteDealTask } from '../../../../store/slices/crmSlice';
import type { DealTask } from '../../../../models/crm/dealTask';
import { KanbanBoard, KanbanCard } from '../../../common/kanban';
import type { KanbanColumnDef } from '../../../common/kanban/KanbanBoard';
import useToast from '../../../../hooks/useToast';

interface TaskKanbanBoardProps {
	tasks: (DealTask & { deal_title?: string; deal_public_id?: string })[];
	loading: boolean;
}

const isOverdue = (task: DealTask): boolean => {
	if (!task.due_date || task.status === 'completed') return false;
	return new Date(task.due_date) < new Date();
};

const formatDate = (dateStr?: string): string => {
	if (!dateStr) return '';
	return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

export const TaskKanbanBoard: React.FC<TaskKanbanBoardProps> = ({ tasks, loading }) => {
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

							<Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 1 }}>
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
										maxWidth: '150px',
									}}
								/>

								{task.due_date && (
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
