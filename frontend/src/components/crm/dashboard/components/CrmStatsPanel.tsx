import React from 'react';
import { Grid } from '@mui/material';
import { TrendingUp, AttachMoney, SwapHoriz, AccessTime } from '@mui/icons-material';
import StatCard from '../../../common/stats/StatCard';
import type { CRMStats } from '../../../../models/crm/crmStats';

interface CrmStatsPanelProps {
	stats: CRMStats | null;
}

export const CrmStatsPanel: React.FC<CrmStatsPanelProps> = ({ stats }) => {
	const statsCards = [
		{
			title: 'ACTIVE LEADS',
			value: stats?.total_active_leads ?? 0,
			subtitle: 'Not yet converted',
			icon: <TrendingUp sx={{ color: '#8B7CF6', fontSize: 26 }} />,
			color: '#8B7CF6',
		},
		{
			title: 'OPEN PIPELINE VALUE',
			value: stats ? stats.total_deal_value.toLocaleString() : 0,
			subtitle: 'Sum of open deals',
			icon: <AttachMoney sx={{ color: '#10B981', fontSize: 26 }} />,
			color: '#10B981',
		},
		{
			title: 'CONVERSION RATE',
			value: stats ? `${stats.conversion_rate}%` : '0%',
			subtitle: 'Leads converted to deals',
			icon: <SwapHoriz sx={{ color: '#4EA8FF', fontSize: 26 }} />,
			color: '#4EA8FF',
		},
		{
			title: 'OVERDUE TASKS',
			value: stats?.overdue_tasks_count ?? 0,
			subtitle: 'Past their due date',
			icon: <AccessTime sx={{ color: '#F59E0B', fontSize: 24 }} />,
			color: '#F59E0B',
		},
	];

	return (
		<Grid container spacing={3} sx={{ mb: 4 }}>
			{statsCards.map((card, idx) => (
				<Grid size={{ xs: 12, sm: 6, md: 3 }} key={idx}>
					<StatCard {...card} />
				</Grid>
			))}
		</Grid>
	);
};

export default CrmStatsPanel;
