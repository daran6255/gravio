import React from 'react';
import { Paper, List, ListItem, Checkbox, IconButton, Tooltip, Stack, Chip, Typography, Box, useTheme, CircularProgress } from '@mui/material';
import { DeleteOutline, Assignment, Schedule, WarningAmber, CheckCircle } from '@mui/icons-material';
import type { DealTask } from '../../../../models/crm/dealTask';
import { useAppDispatch } from '../../../../store/hooks';
import { updateDealTask, deleteDealTask } from '../../../../store/slices/crmSlice';
import useToast from '../../../../hooks/useToast';

interface TaskListProps {
	tasks: (DealTask & { deal_title?: string })[];
	loading: boolean;
}

const isOverdue = (task: DealTask): boolean => {
	if (!task.due_date || task.status === 'completed') return false;
	return new Date(task.due_date) < new Date();
};

const formatDate = (dateStr?: string): string => {
	if (!dateStr) return '';
	return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

export const TaskList: React.FC<TaskListProps> = ({ tasks, loading }) => {
	const dispatch = useAppDispatch();
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const toast = useToast();

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

	if (loading) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
				<CircularProgress />
			</Box>
		);
	}

	if (tasks.length === 0) {
		return (
			<Paper sx={{ p: 4, textAlign: 'center', borderRadius: '16px', border: '1px solid', borderColor: 'divider' }}>
				<Typography color="text.secondary" sx={{ fontStyle: 'italic' }}>
					No tasks to display.
				</Typography>
			</Paper>
		);
	}

	return (
		<Paper sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
			<List disablePadding>
				{tasks.map((task, index) => {
					const isTaskCompleted = task.status === 'completed';
					const isTaskOverdue = isOverdue(task);

					return (
						<ListItem
							key={task.public_id}
							divider={index !== tasks.length - 1}
							sx={{
								px: 3,
								py: 2,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'space-between',
								bgcolor: isDark ? 'rgba(255, 255, 255, 0.01)' : 'transparent',
								'&:hover': {
									bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.01)',
								}
							}}
						>
							<Stack direction="row" spacing={2.5} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
								<Checkbox
									checked={isTaskCompleted}
									onChange={() => handleStatusToggle(task)}
									icon={<Box sx={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid', borderColor: 'text.disabled' }} />}
									checkedIcon={<CheckCircle color="success" sx={{ fontSize: 20 }} />}
									sx={{ p: 0 }}
								/>
								<Box sx={{ minWidth: 0 }}>
									<Typography
										variant="body2"
										sx={{
											fontWeight: 700,
											textDecoration: isTaskCompleted ? 'line-through' : 'none',
											color: isTaskCompleted ? 'text.secondary' : 'text.primary',
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
												display: 'block',
												mt: 0.5,
												wordBreak: 'break-word',
											}}
										>
											{task.notes.replace(/<[^>]*>/g, '')}
										</Typography>
									)}
								</Box>
							</Stack>

							<Stack direction="row" spacing={2} alignItems="center">
								{/* Associated Deal */}
								<Chip
									label={task.deal_title ? `Deal: ${task.deal_title}` : 'Linked Deal'}
									size="small"
									icon={<Assignment sx={{ fontSize: 10 }} />}
									sx={{
										fontSize: '0.65rem',
										fontWeight: 600,
										bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
										color: 'text.secondary',
										maxWidth: '180px',
									}}
								/>

								{/* Due Date */}
								{task.due_date && (
									<Stack direction="row" spacing={0.5} alignItems="center" sx={{ minWidth: 100, justifyContent: 'flex-end' }}>
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

								{/* Delete Button */}
								<Tooltip title="Delete Task">
									<IconButton
										size="small"
										onClick={() => handleDelete(task.public_id)}
										sx={{
											color: 'text.disabled',
											'&:hover': { color: 'error.main' },
										}}
									>
										<DeleteOutline sx={{ fontSize: 18 }} />
									</IconButton>
								</Tooltip>
							</Stack>
						</ListItem>
					);
				})}
			</List>
		</Paper>
	);
};

export default TaskList;
