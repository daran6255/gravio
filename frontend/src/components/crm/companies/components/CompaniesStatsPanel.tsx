import React from 'react';
import { Grid } from '@mui/material';
import { Business, Verified, PersonSearch, AttachMoney } from '@mui/icons-material';
import StatCard from '../../../common/stats/StatCard';
import { useAppSelector } from '../../../../store/hooks';
import type { CRMCompanyStats } from '../../../../models/crm/crmStats';

interface CompaniesStatsPanelProps {
	stats: CRMCompanyStats | null;
}

export const CompaniesStatsPanel: React.FC<CompaniesStatsPanelProps> = ({ stats }) => {
	const displayCurrency = useAppSelector((state) => state.auth.user?.currency) || 'USD';

	const statsCards = [
		{
			title: 'TOTAL COMPANIES',
			value: stats?.total_companies ?? 0,
			subtitle: 'All accounts on file',
			icon: <Business sx={{ color: '#8B7CF6', fontSize: 26 }} />,
			color: '#8B7CF6',
			tooltip: 'The total number of company records in your CRM workspace.',
		},
		{
			title: 'CUSTOMERS',
			value: stats?.customer_count ?? 0,
			subtitle: 'Active customer accounts',
			icon: <Verified sx={{ color: '#10B981', fontSize: 26 }} />,
			color: '#10B981',
			tooltip: 'Companies marked as Customer — accounts that have converted from prospects.',
		},
		{
			title: 'PROSPECTS',
			value: stats?.prospect_count ?? 0,
			subtitle: 'Not yet converted',
			icon: <PersonSearch sx={{ color: '#F59E0B', fontSize: 26 }} />,
			color: '#F59E0B',
			tooltip: 'Companies marked as Prospect — accounts still being worked into the pipeline.',
		},
		{
			title: 'OPEN PIPELINE VALUE',
			value: new Intl.NumberFormat(undefined, {
				style: 'currency',
				currency: displayCurrency,
				minimumFractionDigits: 2,
				maximumFractionDigits: 2,
			}).format(stats?.total_open_pipeline_value ?? 0),
			subtitle: `${stats?.companies_with_open_deals ?? 0} companies with open deals`,
			icon: <AttachMoney sx={{ color: '#4EA8FF', fontSize: 26 }} />,
			color: '#4EA8FF',
			tooltip: 'The combined value of all open deals linked to a company.',
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

export default CompaniesStatsPanel;
