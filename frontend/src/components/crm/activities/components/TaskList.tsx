import React from 'react';
import { Paper, Chip, Typography, Box, useTheme, Avatar, alpha, Tooltip, IconButton, Checkbox, Stack } from '@mui/material';
import { DeleteOutline, Assignment, Schedule, WarningAmber, CheckCircle, Description, Groups, Call, FactCheck, RateReview } from '@mui/icons-material';
import type { DealTask, DealTaskType, DealTaskPriority } from '../../../../models/crm/dealTask';
import type { CRMOwnerOption } from '../../../../models/crm/owner';
import { useAppDispatch } from '../../../../store/hooks';
import { updateDealTask, deleteDealTask } from '../../../../store/slices/crmSlice';
import useToast from '../../../../hooks/useToast';
import { Timeline, type TimelineItemDef } from '../../../common/timeline';

interface TaskListProps {
	tasks: (DealTask & { deal_title?: string })[];
	loading: boolean;
	owners: CRMOwnerOption[];
}

const isOverdue = (task: DealTask): boolean => {
	if (!task.due_date || task.status === 'completed') return false;
	return new Date(task.due_date) < new Date();
};

const formatDate = (dateStr?: string): string => {
	if (!dateStr) return '';
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

export const TaskList: React.FC<TaskListProps> = ({ tasks, loading, owners }) => {
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

	// Map deal tasks into common TimelineItemDef shapes
	const timelineItems: TimelineItemDef[] = tasks.map((task) => {
		const isTaskCompleted = task.status === 'completed';
		const isTaskOverdue = isOverdue(task);
		const pColor = getPriorityColor(task.priority);
		const assignee = task.assignee_id ? owners.find((o) => o.id === task.assignee_id) : null;
		const initials = assignee ? (assignee.full_name || assignee.email).split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';

		return {
			id: task.public_id,
			isCompleted: isTaskCompleted,
			title: (
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
			),
			subtitle: task.notes ? task.notes.replace(/<[^>]*>/g, '') : undefined,
			timestamp: task.due_date ? (
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
			) : undefined,
			icon: (
				<Checkbox
					checked={isTaskCompleted}
					onChange={() => handleStatusToggle(task)}
					icon={<Box sx={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid', borderColor: 'text.disabled' }} />}
					checkedIcon={<CheckCircle color="success" sx={{ fontSize: 16 }} />}
					sx={{ p: 0 }}
				/>
			),
			iconBgColor: isTaskCompleted ? alpha(theme.palette.success.main, 0.08) : (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'),
			iconBorderColor: isTaskCompleted ? alpha(theme.palette.success.main, 0.15) : 'transparent',
			actions: (
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
			),
			content: (
				<Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1, flexWrap: 'wrap', gap: 0.5 }}>
					{/* Priority Badge */}
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

					{/* Task Type Badge */}
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

					{/* Assignee Avatar */}
					{assignee && (
						<Tooltip title={`Assignee: ${assignee.full_name || assignee.email}`}>
							<Avatar
								sx={{
									width: 20,
									height: 20,
									fontSize: '0.6rem',
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
			)
		};
	});

	return (
		<Paper sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider', p: 3 }}>
			<Timeline items={timelineItems} loading={loading} emptyMessage="No tasks to display." />
		</Paper>
	);
};

export default TaskList;
