import React, { useMemo } from 'react';
import { Grid } from '@mui/material';
import {
	PlaylistAddCheckOutlined as ActiveIcon,
	TaskAltOutlined as CompletedIcon,
	WarningAmberOutlined as OverdueIcon,
	AssignmentOutlined as TemplatesIcon,
} from '@mui/icons-material';
import StatCard from '../../../common/stats/StatCard';
import type { HRChecklistInstance, HRChecklistTemplate } from '../../../../models/hr';

interface LifecycleStatsBarProps {
	instances: HRChecklistInstance[];
	templates: HRChecklistTemplate[];
}

const LifecycleStatsBar: React.FC<LifecycleStatsBarProps> = ({ instances, templates }) => {
	const statsCards = useMemo(() => {
		const active = instances.filter((i) => i.status === 'pending').length;
		const completed = instances.filter((i) => i.status === 'completed').length;

		const today = new Date().toISOString().split('T')[0];
		let overdueTasks = 0;
		for (const inst of instances) {
			if (inst.status === 'completed') continue;
			for (const task of Object.values(inst.task_statuses)) {
				if (!task.completed && task.due_date && task.due_date < today) overdueTasks += 1;
			}
		}

		return [
			{
				title: 'ACTIVE TRACKERS',
				value: `${active}`,
				subtitle: 'Onboarding/offboarding in progress',
				icon: <ActiveIcon sx={{ color: '#8B7CF6', fontSize: 26 }} />,
				color: '#8B7CF6',
				tooltip: 'Checklist trackers currently launched and not yet fully completed.',
			},
			{
				title: 'COMPLETED',
				value: `${completed}`,
				subtitle: 'Trackers fully closed out',
				icon: <CompletedIcon sx={{ color: '#10B981', fontSize: 26 }} />,
				color: '#10B981',
				tooltip: 'Trackers where every task has been marked complete.',
			},
			{
				title: 'OVERDUE TASKS',
				value: `${overdueTasks}`,
				subtitle: 'Past their due date',
				icon: <OverdueIcon sx={{ color: '#F59E0B', fontSize: 26 }} />,
				color: '#F59E0B',
				tooltip: 'Incomplete tasks across all active trackers whose due date has passed.',
			},
			{
				title: 'TEMPLATES',
				value: `${templates.length}`,
				subtitle: `${templates.filter((t) => t.is_active).length} active`,
				icon: <TemplatesIcon sx={{ color: '#4EA8FF', fontSize: 26 }} />,
				color: '#4EA8FF',
				tooltip: 'Total onboarding/offboarding checklist templates defined for your organization.',
			},
		];
	}, [instances, templates]);

	return (
		<Grid container spacing={3}>
			{statsCards.map((card, idx) => (
				<Grid size={{ xs: 12, sm: 6, md: 3 }} key={idx}>
					<StatCard {...card} />
				</Grid>
			))}
		</Grid>
	);
};

export default LifecycleStatsBar;
