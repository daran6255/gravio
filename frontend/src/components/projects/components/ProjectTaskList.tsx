import React from 'react';
import { Box, Typography, Stack, Chip, Avatar, IconButton, Tooltip, CircularProgress, useTheme, alpha } from '@mui/material';
import { DeleteOutline, AddOutlined, SubdirectoryArrowRight } from '@mui/icons-material';
import type { ProjectTask, ProjectTaskStatus } from '../../../models/projects/projectTask';
import type { CRMOwnerOption } from '../../../models/crm/owner';

interface ProjectTaskListProps {
	tasks: ProjectTask[];
	statuses: ProjectTaskStatus[];
	owners: CRMOwnerOption[];
	loading: boolean;
	onEditTask: (task: ProjectTask) => void;
	onAddSubtask: (parent: ProjectTask) => void;
	onDeleteTask: (task: ProjectTask) => void;
}

const formatDate = (dateStr?: string): string => {
	if (!dateStr) return '—';
	return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

export const ProjectTaskList: React.FC<ProjectTaskListProps> = ({ tasks, statuses, owners, loading, onEditTask, onAddSubtask, onDeleteTask }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';

	if (loading) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
				<CircularProgress size={32} />
			</Box>
		);
	}

	const topLevelTasks = tasks.filter((t) => t.parent_task_id == null);
	const subtasksByParent = tasks.reduce<Record<number, ProjectTask[]>>((acc, t) => {
		if (t.parent_task_id != null) {
			acc[t.parent_task_id] = acc[t.parent_task_id] || [];
			acc[t.parent_task_id].push(t);
		}
		return acc;
	}, {});

	if (topLevelTasks.length === 0) {
		return (
			<Box sx={{ textAlign: 'center', py: 8 }}>
				<Typography color="text.secondary" sx={{ fontStyle: 'italic' }}>
					No tasks yet. Add the first task to get started.
				</Typography>
			</Box>
		);
	}

	const renderRow = (task: ProjectTask, depth: number) => {
		const status = statuses.find((s) => s.id === task.status_id);
		const assignee = task.assignee_id ? owners.find((o) => o.id === task.assignee_id) : null;
		const initials = assignee ? (assignee.full_name || assignee.email).split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) : null;

		return (
			<Box key={task.public_id}>
				<Stack
					direction="row"
					spacing={1.5}
					alignItems="center"
					sx={{
						p: 1.5,
						pl: depth > 0 ? 5 : 1.5,
						borderRadius: '10px',
						border: '1px solid',
						borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
						bgcolor: depth > 0 ? (isDark ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.01)') : 'transparent',
						mb: 1,
						cursor: 'pointer',
						'&:hover': { borderColor: theme.palette.primary.main },
					}}
					onClick={() => onEditTask(task)}
				>
					{depth > 0 && <SubdirectoryArrowRight sx={{ fontSize: 16, color: 'text.disabled', flexShrink: 0 }} />}

					<Box sx={{ flex: 1, minWidth: 0 }}>
						<Typography variant="body2" sx={{ fontWeight: depth > 0 ? 500 : 700 }} noWrap>
							{task.title}
						</Typography>
						<Stack direction="row" spacing={1.5} sx={{ mt: 0.4 }} flexWrap="wrap" useFlexGap>
							<Chip
								label={status?.name || 'No status'}
								size="small"
								sx={{
									fontSize: '0.65rem', height: 18, fontWeight: 700,
									bgcolor: alpha(status?.color || '#9E9E9E', 0.12), color: status?.color || 'text.secondary',
								}}
							/>
							<Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>{task.priority} priority</Typography>
							{task.due_date && <Typography variant="caption" color="text.secondary">Due {formatDate(task.due_date)}</Typography>}
							{task.estimated_hours != null && <Typography variant="caption" color="text.secondary">{task.estimated_hours}h est.</Typography>}
							{task.billing_type === 'non_billable' && <Typography variant="caption" color="text.secondary">Non-billable</Typography>}
						</Stack>
					</Box>

					{assignee && (
						<Tooltip title={assignee.full_name || assignee.email}>
							<Avatar sx={{ width: 24, height: 24, fontSize: '0.65rem', fontWeight: 700 }}>{initials}</Avatar>
						</Tooltip>
					)}

					{depth === 0 && (
						<Tooltip title="Add sub-task">
							<IconButton size="small" onClick={(e) => { e.stopPropagation(); onAddSubtask(task); }} sx={{ color: 'text.disabled', '&:hover': { color: 'primary.main' } }}>
								<AddOutlined sx={{ fontSize: 16 }} />
							</IconButton>
						</Tooltip>
					)}
					<Tooltip title="Delete task">
						<IconButton size="small" onClick={(e) => { e.stopPropagation(); onDeleteTask(task); }} sx={{ color: 'text.disabled', '&:hover': { color: 'error.main' } }}>
							<DeleteOutline sx={{ fontSize: 16 }} />
						</IconButton>
					</Tooltip>
				</Stack>

				{(subtasksByParent[task.id] || []).map((sub) => renderRow(sub, depth + 1))}
			</Box>
		);
	};

	return <Box>{topLevelTasks.map((task) => renderRow(task, 0))}</Box>;
};

export default ProjectTaskList;
