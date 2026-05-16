import React from 'react';
import { Grid } from '@mui/material';
import {
	Business as BusinessIcon,
	Category as IndustryIcon,
	Groups as TeamIcon,
	Assessment as StatsIcon,
} from '@mui/icons-material';
import StatCard from '../../../common/stats/StatCard';
import type { CompanyStats as CompanyStatsData, Company } from '../../../../models/company';

interface CompanyStatsProps {
	list: Company[];
	stats: CompanyStatsData | null;
}

const CompanyStats: React.FC<CompanyStatsProps> = ({ list, stats }) => {
	const total = stats?.total ?? list.length;
	const byStatus = stats?.by_status ?? {};

	const activeCount = (byStatus['active'] ?? 0) + (byStatus['customer'] ?? 0);
	const prospectCount = byStatus['prospect'] ?? 0;
	const industryCount = stats?.top_industries?.length
		?? new Set(list.map((c) => c.industry).filter(Boolean)).size;

	// Determine the top industry name for subtitle
	const topIndustry = stats?.top_industries?.[0]?.industry ?? null;

	return (
		<Grid container spacing={3} sx={{ mb: 4 }}>
			{/* Total Companies */}
			<Grid size={{ xs: 12, sm: 6, md: 3 }}>
				<StatCard
					title="Total Companies"
					value={total}
					icon={<BusinessIcon />}
					color="#007eb9"
					subtitle={`${total === 1 ? '1 company' : `${total} companies`} registered`}
				/>
			</Grid>

			{/* Active Clients */}
			<Grid size={{ xs: 12, sm: 6, md: 3 }}>
				<StatCard
					title="Active Clients"
					value={activeCount}
					icon={<TeamIcon />}
					color="#1d8102"
					subtitle="Active & customer accounts"
				/>
			</Grid>

			{/* Prospects */}
			<Grid size={{ xs: 12, sm: 6, md: 3 }}>
				<StatCard
					title="Prospects"
					value={prospectCount}
					icon={<StatsIcon />}
					color="#ec7211"
					subtitle="Awaiting conversion to client"
				/>
			</Grid>

			{/* Industries */}
			<Grid size={{ xs: 12, sm: 6, md: 3 }}>
				<StatCard
					title="Industries"
					value={industryCount}
					icon={<IndustryIcon />}
					color="#ff9900"
					subtitle={topIndustry ? `Top: ${topIndustry}` : 'Unique sectors covered'}
				/>
			</Grid>
		</Grid>
	);
};

export default CompanyStats;
