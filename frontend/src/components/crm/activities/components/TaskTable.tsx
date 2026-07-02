import React, { useState } from 'react';
import { TableRow, TableCell, Typography, Checkbox, Stack, Chip, useTheme, alpha, Tooltip, IconButton, Menu, MenuItem, Box } from '@mui/material';
import { DeleteOutline, WarningAmber, Schedule, Assignment, CheckCircle, Description, Groups, Call, FactCheck, RateReview } from '@mui/icons-material';
import type { DealTask, DealTaskType, DealTaskPriority, DealTaskStatus } from '../../../../models/crm/dealTask';
import { useAppDispatch } from '../../../../store/hooks';
import { updateDealTask, deleteDealTask } from '../../../../store/slices/crmSlice';
import useToast from '../../../../hooks/useToast';
import { TableView, type TableColumnDef } from '../../../common/table';

interface TaskTableProps {
	tasks: (DealTask & { deal_title?: string })[];
	loading: boolean;
}

const isOverdue = (task: DealTask): boolean => {
	if (!task.due_date || task.status === 'completed') return false;
	return new Date(task.due_date) < new Date();
};

const formatDate = (dateStr?: string): string => {
	if (!dateStr) return '—';
	return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
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

export const TaskTable: React.FC<TaskTableProps> = ({ tasks, loading }) => {
	const dispatch = useAppDispatch();
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const toast = useToast();

	// Status popover menu
	const [statusMenuAnchor, setStatusMenuAnchor] = useState<null | HTMLElement>(null);
	const [activeMenuTask, setActiveMenuTask] = useState<DealTask | null>(null);

	const handleStatusClick = (event: React.MouseEvent<HTMLDivElement>, task: DealTask) => {
		setStatusMenuAnchor(event.currentTarget);
		setActiveMenuTask(task);
	};

	const handleStatusClose = () => {
		setStatusMenuAnchor(null);
		setActiveMenuTask(null);
	};

	const handleStatusSelect = async (status: DealTaskStatus) => {
		if (activeMenuTask) {
			try {
				await dispatch(updateDealTask({
					taskPublicId: activeMenuTask.public_id,
					payload: { status }
				})).unwrap();
				toast.success(`Status updated to ${status.replace('_', ' ')}`);
			} catch (err: any) {
				toast.error(err || 'Failed to update status');
			}
		}
		handleStatusClose();
	};

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

	const columns: TableColumnDef[] = [
		{ id: 'done', label: 'Done', width: 60 },
		{ id: 'title', label: 'Task' },
		{ id: 'task_type', label: 'Type', width: 120 },
		{ id: 'priority', label: 'Priority', width: 120 },
		{ id: 'deal_title', label: 'Deal' },
		{ id: 'due_date', label: 'Due Date', width: 140 },
		{ id: 'status', label: 'Status', width: 140 },
		{ id: 'actions', label: '', align: 'right', width: 60 },
	];

	const renderRow = (task: DealTask & { deal_title?: string }) => {
		const isTaskCompleted = task.status === 'completed';
		const isTaskOverdue = isOverdue(task);
		const pColor = getPriorityColor(task.priority);
		const typeColor = getTaskTypeColor(task.task_type);

		return (
			<TableRow key={task.public_id} hover sx={{ bgcolor: isTaskCompleted ? (isDark ? 'rgba(0,0,0,0.05)' : 'rgba(0,0,0,0.01)') : 'transparent' }}>
				{/* Checkbox completed status toggle */}
				<TableCell padding="checkbox">
					<Checkbox
						checked={isTaskCompleted}
						onChange={() => handleStatusToggle(task)}
						icon={<Box sx={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid', borderColor: 'text.disabled' }} />}
						checkedIcon={<CheckCircle color="success" sx={{ fontSize: 20 }} />}
						sx={{ ml: 1 }}
					/>
				</TableCell>

				{/* Title and Notes */}
				<TableCell>
					<Typography
						variant="body2"
						sx={{
							fontWeight: 700,
							textDecoration: isTaskCompleted ? 'line-through' : 'none',
							color: isTaskCompleted ? 'text.secondary' : 'text.primary',
						}}
					>
						{task.title}
					</Typography>
					{task.notes && (
						<Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
							{task.notes.replace(/<[^>]*>/g, '')}
						</Typography>
					)}
				</TableCell>

				{/* Task Type */}
				<TableCell>
					<Chip
						label={task.task_type}
						size="small"
						icon={getTaskTypeIcon(task.task_type)}
						sx={{
							fontSize: '0.65rem',
							height: 22,
							fontWeight: 600,
							bgcolor: alpha(typeColor, 0.08),
							color: typeColor,
							border: '1px solid',
							borderColor: alpha(typeColor, 0.15),
							textTransform: 'capitalize',
						}}
					/>
				</TableCell>

				{/* Task Priority */}
				<TableCell>
					<Chip
						label={`${task.priority} Priority`}
						size="small"
						sx={{
							fontSize: '0.65rem',
							height: 22,
							fontWeight: 700,
							bgcolor: alpha(pColor, 0.08),
							color: pColor,
							border: '1px solid',
							borderColor: alpha(pColor, 0.15),
							textTransform: 'capitalize',
						}}
					/>
				</TableCell>

				{/* Linked Deal */}
				<TableCell>
					{task.deal_title ? (
						<Chip
							label={task.deal_title}
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
					) : (
						<Typography variant="caption" color="text.disabled">—</Typography>
					)}
				</TableCell>

				{/* Due Date with Overdue Indicator */}
				<TableCell>
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
						<Typography variant="caption" color="text.disabled">—</Typography>
					)}
				</TableCell>

				{/* Interactive Status Badge */}
				<TableCell>
					<Chip
						label={
							task.status === 'completed' ? 'Completed'
								: task.status === 'in_progress' ? 'In Progress'
									: task.status === 'blocked' ? 'Blocked'
										: 'Yet to Start'
						}
						size="small"
						onClick={(e) => handleStatusClick(e, task)}
						sx={{
							height: 22,
							fontSize: '0.65rem',
							fontWeight: 700,
							cursor: 'pointer',
							bgcolor: task.status === 'completed'
								? alpha(theme.palette.success.main, 0.08)
								: task.status === 'in_progress'
									? alpha(theme.palette.info.main, 0.08)
									: task.status === 'blocked'
										? alpha('#9C27B0', 0.08)
										: alpha(theme.palette.primary.main, 0.08),
							color: task.status === 'completed'
								? theme.palette.success.main
								: task.status === 'in_progress'
									? theme.palette.info.main
									: task.status === 'blocked'
										? '#9C27B0'
										: theme.palette.primary.main,
							border: '1px solid',
							borderColor: task.status === 'completed'
								? alpha(theme.palette.success.main, 0.15)
								: task.status === 'in_progress'
									? alpha(theme.palette.info.main, 0.15)
									: task.status === 'blocked'
										? alpha('#9C27B0', 0.15)
										: alpha(theme.palette.primary.main, 0.15),
						}}
					/>
				</TableCell>

				{/* Delete Action button */}
				<TableCell align="right">
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
				</TableCell>
			</TableRow>
		);
	};

	return (
		<>
			<TableView<DealTask & { deal_title?: string }>
				columns={columns}
				items={tasks}
				getItemId={(t) => t.public_id}
				renderRow={renderRow}
				loading={loading}
				emptyMessage="No tasks found matching current filters."
			/>

			{/* Status select Popover Menu */}
			<Menu
				anchorEl={statusMenuAnchor}
				open={Boolean(statusMenuAnchor)}
				onClose={handleStatusClose}
				slotProps={{
					paper: {
						sx: {
							borderRadius: '12px',
							boxShadow: '0px 4px 20px rgba(0,0,0,0.08)',
							border: '1px solid',
							borderColor: 'divider',
							'& .MuiMenuItem-root': {
								fontSize: '0.75rem',
								fontWeight: 600,
								py: 1,
								px: 2,
							}
						}
					}
				}}
			>
				<MenuItem onClick={() => handleStatusSelect('pending')}>Yet to Start</MenuItem>
				<MenuItem onClick={() => handleStatusSelect('in_progress')}>In Progress</MenuItem>
				<MenuItem onClick={() => handleStatusSelect('blocked')}>Blocked</MenuItem>
				<MenuItem onClick={() => handleStatusSelect('completed')}>Completed</MenuItem>
			</Menu>
		</>
	);
};

export default TaskTable;
