import React, { memo } from 'react';
import { TableRow, TableCell, Stack, Typography, Box, Chip } from '@mui/material';
import {
	Schedule as DueIcon,
	Flag as PriorityIcon,
	Edit as EditIcon,
	Delete as DeleteIcon
} from '@mui/icons-material';
import StatusBadge from '../../../common/badge/StatusBadge';
import DataTableActions, { type TableMenuAction } from '../../../common/table/DataTableActions';
import { useDateTime } from '../../../../hooks/useDateTime';
import type { CRMTask } from '../../../../models/crmTask';

interface TaskTableRowProps {
	task: CRMTask;
	isAdmin: boolean;
	onEdit: (task: CRMTask) => void;
	onDelete?: (task: CRMTask) => void;
	onClick: (task: CRMTask) => void;
}

const getPriorityColor = (priority: string) => {
	switch (priority) {
		case 'urgent': return 'error.main';
		case 'high': return 'warning.main';
		case 'medium': return 'info.main';
		case 'low': return 'success.main';
		default: return 'text.secondary';
	}
};

const TaskTableRow: React.FC<TaskTableRowProps> = memo(({
	task,
	isAdmin,
	onEdit,
	onDelete,
	onClick,
}) => {
	const { formatDate } = useDateTime();

	const actions: TableMenuAction<CRMTask>[] = [
		{
			label: 'Edit',
			icon: <EditIcon fontSize="small" />,
			onClick: (item) => onEdit(item)
		},
		{
			label: 'Delete',
			icon: <DeleteIcon fontSize="small" />,
			onClick: (item) => onDelete?.(item),
			color: 'error.main',
			hidden: !isAdmin || !onDelete
		}
	];

	return (
		<TableRow
			hover
			tabIndex={-1}
			onClick={() => onClick(task)}
			sx={{
				cursor: 'pointer',
				'&:hover': { bgcolor: 'action.hover' },
				'&:last-child td': { borderBottom: 0 },
			}}
		>
			{/* Task Title & Type */}
			<TableCell>
				<Box>
					<Typography
						variant="body2"
						sx={{ fontWeight: 700, color: 'primary.main' }}
					>
						{task.title}
					</Typography>
					<Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
						{task.task_type.replace(/_/g, ' ')}
					</Typography>
				</Box>
			</TableCell>

			{/* Status */}
			<TableCell>
				<StatusBadge
					label={task.status.replace(/_/g, ' ')}
					status={task.status}
					type="task"
				/>
			</TableCell>

			{/* Priority */}
			<TableCell>
				<Stack direction="row" spacing={0.5} alignItems="center">
					<PriorityIcon sx={{ fontSize: 14, color: getPriorityColor(task.priority) }} />
					<Typography 
						variant="caption" 
						sx={{ 
							fontWeight: 700, 
							textTransform: 'uppercase', 
							color: getPriorityColor(task.priority) 
						}}
					>
						{task.priority}
					</Typography>
				</Stack>
			</TableCell>

			{/* Due Date */}
			<TableCell>
				<Stack direction="row" spacing={1} alignItems="center">
					<DueIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
					<Typography variant="body2" color="text.primary">
						{formatDate(task.due_date)}
					</Typography>
				</Stack>
			</TableCell>

			{/* Related To */}
			<TableCell>
				{task.related_to_type ? (
					<Chip
						label={`${task.related_to_type}: ${task.related_to_id || '—'}`}
						size="small"
						variant="outlined"
						sx={{ fontSize: '0.7rem', height: 20, textTransform: 'capitalize' }}
					/>
				) : (
					<Typography variant="body2" color="text.disabled">—</Typography>
				)}
			</TableCell>

			{/* Assigned To */}
			<TableCell>
				<Typography variant="body2" color="text.secondary">
					{task.assigned_user?.full_name || 'Unassigned'}
				</Typography>
			</TableCell>

			{/* Actions */}
			<TableCell align="right" onClick={(e) => e.stopPropagation()}>
				<DataTableActions
					item={task}
					actions={actions}
				/>
			</TableCell>
		</TableRow>
	);
});

TaskTableRow.displayName = 'TaskTableRow';

export default TaskTableRow;
