import React from 'react';
import { Grid } from '@mui/material';
import { ShowChart, TrendingUp, BusinessCenter } from '@mui/icons-material';
import StatCard from '../../../common/stats/StatCard';
import { useAppSelector } from '../../../../store/hooks';
import type { Deal } from '../../../../models/crm/deal';

interface DealsStatsPanelProps {
	deals: Deal[];
}

export const DealsStatsPanel: React.FC<DealsStatsPanelProps> = ({ deals }) => {
	const displayCurrency = useAppSelector((state) => state.auth.user?.currency) || 'USD';

	const totalValue = deals.reduce((sum, d) => sum + (d.value || 0), 0);
	const weightedValue = deals.reduce((sum, d) => {
		const prob = d.probability || 0;
		return sum + (d.value || 0) * (prob / 100);
	}, 0);
	const activeDeals = deals.filter((d) => d.status === 'open' || d.status === 'on_hold').length;

	const statsCards = [
		{
			title: 'TOTAL PIPELINE VALUE',
			value: new Intl.NumberFormat(undefined, {
				style: 'currency',
				currency: displayCurrency,
				minimumFractionDigits: 2,
				maximumFractionDigits: 2,
			}).format(totalValue),
			subtitle: 'Sum of all deal values',
			icon: <ShowChart sx={{ color: '#8B7CF6', fontSize: 26 }} />,
			color: '#8B7CF6',
			tooltip: 'The total nominal value of all active opportunities in this sales pipeline.',
		},
		{
			title: 'WEIGHTED PIPELINE VALUE',
			value: new Intl.NumberFormat(undefined, {
				style: 'currency',
				currency: displayCurrency,
				minimumFractionDigits: 2,
				maximumFractionDigits: 2,
			}).format(weightedValue),
			subtitle: 'Probability-adjusted forecast',
			icon: <TrendingUp sx={{ color: '#10B981', fontSize: 26 }} />,
			color: '#10B981',
			tooltip: 'The calculated forecast value taking into account each deal value multiplied by its stage probability.',
		},
		{
			title: 'ACTIVE DEALS',
			value: activeDeals,
			subtitle: 'Open opportunities',
			icon: <BusinessCenter sx={{ color: '#F59E0B', fontSize: 26 }} />,
			color: '#F59E0B',
			tooltip: 'The count of opportunities currently in progress (Open or On Hold) within this pipeline.',
		},
	];

	return (
		<Grid container spacing={{ xs: 2, md: 3 }} sx={{ mb: 3 }}>
			{statsCards.map((card, idx) => (
				<Grid size={{ xs: 12, sm: 6, md: 4 }} key={idx}>
					<StatCard {...card} />
				</Grid>
			))}
		</Grid>
	);
};

export default DealsStatsPanel;
