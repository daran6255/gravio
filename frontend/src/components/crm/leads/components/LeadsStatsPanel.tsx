import React from 'react';
import { Grid } from '@mui/material';
import { Inbox, MarkEmailRead, Verified, SwapHoriz } from '@mui/icons-material';
import StatCard from '../../../common/stats/StatCard';
import type { CRMLeadStats } from '../../../../models/crm/crmStats';

interface LeadsStatsPanelProps {
	stats: CRMLeadStats | null;
}

export const LeadsStatsPanel: React.FC<LeadsStatsPanelProps> = ({ stats }) => {
	const statsCards = [
		{
			title: 'TOTAL LEADS',
			value: stats?.total_leads ?? 0,
			subtitle: 'All leads in your pipeline',
			icon: <Inbox sx={{ color: '#8B7CF6', fontSize: 26 }} />,
			color: '#8B7CF6',
		},
		{
			title: 'NEW LEADS',
			value: stats?.new_count ?? 0,
			subtitle: 'Not yet contacted',
			icon: <MarkEmailRead sx={{ color: '#F59E0B', fontSize: 26 }} />,
			color: '#F59E0B',
		},
		{
			title: 'QUALIFIED LEADS',
			value: stats?.qualified_count ?? 0,
			subtitle: 'Ready to convert',
			icon: <Verified sx={{ color: '#10B981', fontSize: 26 }} />,
			color: '#10B981',
		},
		{
			title: 'CONVERSION RATE',
			value: stats ? `${stats.conversion_rate}%` : '0%',
			subtitle: `${stats?.converted_count ?? 0} converted to deals`,
			icon: <SwapHoriz sx={{ color: '#4EA8FF', fontSize: 26 }} />,
			color: '#4EA8FF',
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

export default LeadsStatsPanel;
