import React from 'react';
import { Grid } from '@mui/material';
import { Assignment, Schedule, WarningAmber, CheckCircle } from '@mui/icons-material';
import StatCard from '../../../common/stats/StatCard';
import type { DealTask } from '../../../../models/crm/dealTask';

interface TasksStatsPanelProps {
	tasks: DealTask[];
}

const isOverdue = (task: DealTask): boolean => {
	if (!task.due_date || task.status === 'completed') return false;
	return new Date(task.due_date) < new Date();
};

export const TasksStatsPanel: React.FC<TasksStatsPanelProps> = ({ tasks }) => {
	const total = tasks.length;
	const pending = tasks.filter((t) => t.status === 'pending').length;
	const completed = tasks.filter((t) => t.status === 'completed').length;
	const overdue = tasks.filter((t) => isOverdue(t)).length;

	const statCards = [
		{
			title: 'TOTAL TASKS',
			value: total,
			subtitle: 'All deal check-list items',
			icon: <Assignment sx={{ color: '#8B7CF6', fontSize: 26 }} />,
			color: '#8B7CF6',
			tooltip: 'The total number of tasks created across all active deals.',
		},
		{
			title: 'YET TO START',
			value: pending,
			subtitle: 'Tasks yet to be completed',
			icon: <Schedule sx={{ color: '#F59E0B', fontSize: 26 }} />,
			color: '#F59E0B',
			tooltip: 'The number of tasks currently in a pending, in-progress, or blocked state.',
		},
		{
			title: 'OVERDUE TASKS',
			value: overdue,
			subtitle: 'Tasks past their due date',
			icon: <WarningAmber sx={{ color: '#EF4444', fontSize: 26 }} />,
			color: '#EF4444',
			tooltip: 'The number of incomplete tasks whose due date has passed.',
		},
		{
			title: 'COMPLETED TASKS',
			value: completed,
			subtitle: 'Successfully completed tasks',
			icon: <CheckCircle sx={{ color: '#10B981', fontSize: 26 }} />,
			color: '#10B981',
			tooltip: 'The number of tasks that have been successfully checked off.',
		},
	];

	return (
		<Grid container spacing={3} sx={{ mb: 3 }}>
			{statCards.map((card, idx) => (
				<Grid size={{ xs: 12, sm: 6, md: 3 }} key={idx}>
					<StatCard {...card} />
				</Grid>
			))}
		</Grid>
	);
};

export default TasksStatsPanel;
