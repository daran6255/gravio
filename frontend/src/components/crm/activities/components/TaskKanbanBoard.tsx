import React from 'react';
import { Box, Typography, Checkbox, Stack, useTheme, Tooltip, IconButton, Avatar, alpha } from '@mui/material';
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
		{ id: 'pending', label: 'Yet to Start', color: theme.palette.primary.main },
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

		const assignee = task.assignee_id ? owners.find((o) => o.id === task.assignee_id) : null;
		const initials = assignee ? (assignee.full_name || assignee.email).split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';

		const pColor = getPriorityColor(task.priority);
		const tColor = getTaskTypeColor(task.task_type);

		return (
			<KanbanCard id={task.public_id} data={{ item: task }}>
				<Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
					<Stack direction="row" spacing={1} alignItems="flex-start" sx={{ flex: 1, minWidth: 0, pr: 1 }}>
						<Checkbox
							checked={isTaskCompleted}
							onChange={() => handleStatusToggle(task)}
							icon={<Box sx={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid', borderColor: 'text.disabled' }} />}
							checkedIcon={<CheckCircle color="success" sx={{ fontSize: 20 }} />}
							sx={{ p: 0, mt: 0.25 }}
						/>
						<Typography
							variant="body2"
							sx={{
								fontWeight: 800,
								lineHeight: 1.3,
								textDecoration: isTaskCompleted ? 'line-through' : 'none',
								color: isTaskCompleted ? 'text.secondary' : (isDark ? 'text.primary' : '#1e293b'),
								wordBreak: 'break-word',
							}}
						>
							{task.title}
						</Typography>
					</Stack>
					<Tooltip title="Delete Task">
						<IconButton
							size="small"
							onClick={(e) => {
								e.stopPropagation();
								handleDelete(task.public_id);
							}}
							sx={{
								p: 0.25,
								mt: -0.5,
								mr: -0.5,
								color: 'text.disabled',
								'&:hover': { color: 'error.main' },
							}}
						>
							<DeleteOutline sx={{ fontSize: 16 }} />
						</IconButton>
					</Tooltip>
				</Stack>

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

				{/* Linked Deal — meta pill, matching DealCard's company pill */}
				<Box
					sx={{
						display: 'inline-flex',
						alignItems: 'center',
						gap: 0.5,
						px: 1,
						py: 0.25,
						borderRadius: '6px',
						bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
						mb: 1.5,
						width: 'fit-content',
						maxWidth: '100%',
					}}
				>
					<Assignment sx={{ fontSize: '0.72rem', color: 'text.secondary', flexShrink: 0 }} />
					<Typography
						variant="caption"
						noWrap
						sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.68rem', letterSpacing: '0.01em' }}
					>
						{task.deal_title ? `Deal: ${task.deal_title}` : 'Linked Deal'}
					</Typography>
				</Box>

				{/* Priority & Type badges — squared pill style matching DealCard's tag badges */}
				<Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mb: 1.5 }}>
					<Box
						sx={{
							px: 1,
							py: 0.25,
							borderRadius: '4px',
							fontSize: '0.625rem',
							fontWeight: 700,
							bgcolor: alpha(pColor, 0.08),
							color: pColor,
							textTransform: 'uppercase',
							letterSpacing: '0.02em',
						}}
					>
						{task.priority}
					</Box>
					<Box
						sx={{
							display: 'flex',
							alignItems: 'center',
							gap: 0.4,
							px: 1,
							py: 0.25,
							borderRadius: '4px',
							fontSize: '0.625rem',
							fontWeight: 700,
							bgcolor: alpha(tColor, 0.08),
							color: tColor,
							textTransform: 'uppercase',
							letterSpacing: '0.02em',
						}}
					>
						{getTaskTypeIcon(task.task_type)}
						{task.task_type}
					</Box>
				</Stack>

				<Stack direction="row" justifyContent="space-between" alignItems="flex-end" sx={{ mt: 1 }}>
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
									width: 22,
									height: 22,
									fontSize: '0.625rem',
									fontWeight: 700,
									bgcolor: theme.palette.primary.main,
									color: '#ffffff',
									boxShadow: `0 0 0 2px ${isDark ? '#141822' : '#ffffff'}`,
								}}
							>
								{initials}
							</Avatar>
						</Tooltip>
					)}
				</Stack>
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
