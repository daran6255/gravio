import React from 'react';
import { Grid } from '@mui/material';
import { FolderOpenOutlined, PlayCircleOutline, WarningAmberOutlined, AccountBalanceWalletOutlined } from '@mui/icons-material';
import StatCard from '../../../common/stats/StatCard';
import type { ProjectStats } from '../../../../models/projects/project';

interface ProjectsStatsPanelProps {
	stats: ProjectStats | null;
}

export const ProjectsStatsPanel: React.FC<ProjectsStatsPanelProps> = ({ stats }) => {
	const countFor = (status: string) => stats?.status_counts.find((s) => s.status === status)?.count ?? 0;
	const activeCount = countFor('active');
	const onHoldCount = countFor('on_hold');

	const primaryBudget = stats?.budget_by_currency[0];
	const otherCurrencyCount = (stats?.budget_by_currency.length ?? 0) - 1;
	const budgetValue = primaryBudget
		? new Intl.NumberFormat(undefined, {
			style: 'currency',
			currency: primaryBudget.currency,
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		}).format(primaryBudget.total)
		: '—';
	const taskCompletionPct = stats && stats.total_tasks > 0
		? Math.round((stats.completed_tasks / stats.total_tasks) * 100)
		: null;

	const statsCards = [
		{
			title: 'TOTAL PROJECTS',
			value: stats?.total_projects ?? 0,
			subtitle: `${activeCount} active, ${onHoldCount} on hold`,
			icon: <FolderOpenOutlined sx={{ color: '#8B7CF6', fontSize: 26 }} />,
			color: '#8B7CF6',
			tooltip: 'The total number of delivery projects in this organization.',
		},
		{
			title: 'ACTIVE PROJECTS',
			value: activeCount,
			subtitle: taskCompletionPct !== null ? `${taskCompletionPct}% of tasks completed` : 'No tasks yet',
			icon: <PlayCircleOutline sx={{ color: '#10B981', fontSize: 26 }} />,
			color: '#10B981',
			tooltip: 'Projects currently in the Active status, and the share of their tasks marked done.',
		},
		{
			title: 'OVERDUE PROJECTS',
			value: stats?.overdue_count ?? 0,
			subtitle: 'Past due date, still open',
			icon: <WarningAmberOutlined sx={{ color: '#EF4444', fontSize: 26 }} />,
			color: '#EF4444',
			tooltip: 'Active or On Hold projects whose end date has already passed.',
		},
		{
			title: 'TOTAL BUDGET',
			value: budgetValue,
			subtitle: otherCurrencyCount > 0 ? `+${otherCurrencyCount} other currenc${otherCurrencyCount === 1 ? 'y' : 'ies'}` : 'Across all projects',
			icon: <AccountBalanceWalletOutlined sx={{ color: '#4EA8FF', fontSize: 26 }} />,
			color: '#4EA8FF',
			tooltip: 'The combined budget of all projects, shown in the most common project currency.',
		},
	];

	return (
		<Grid container spacing={3} sx={{ mb: 3 }}>
			{statsCards.map((card, idx) => (
				<Grid size={{ xs: 12, sm: 6, md: 3 }} key={idx}>
					<StatCard {...card} />
				</Grid>
			))}
		</Grid>
	);
};

export default ProjectsStatsPanel;
