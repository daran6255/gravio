import React from 'react';
import { Typography, Box, useTheme } from '@mui/material';
import { People, Today, PieChart, Man, Woman, Transgender } from '@mui/icons-material';
import { SparkLineChart } from '@mui/x-charts';
import type { CandidateStats } from '../../../models/candidate';

interface CandidateStatCardsProps {
	stats: CandidateStats;
}

// Sparkline helper
const StatSparkLine = ({ color, data }: { color: string, data: number[] }) => (
	<Box sx={{ width: 100, height: 40 }}>
		<SparkLineChart
			data={data}
			height={40}
			// @ts-expect-error - The type definition might be lagging or 'colors' vs 'color' ambiguity
			colors={[color]}
			showHighlight={true}
			showTooltip={true}
		/>
	</Box>
);

import StatCard from '../../common/stats/StatCard';

const CandidateStatCards: React.FC<CandidateStatCardsProps> = ({ stats }) => {
	const theme = useTheme();

	return (
		<Box sx={{ display: 'flex', gap: 3, mb: 3, flexWrap: 'wrap' }}>
			{/* Card 1: Total Candidates */}
			<Box sx={{ flex: '1 1 300px' }}>
				<StatCard
					title="Total Candidates"
					count={(stats.total || 0).toLocaleString()}
					icon={People}
					color={theme.palette.primary.main}
				>
					<Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
						<StatSparkLine color={theme.palette.primary.light} data={stats.weekly.length > 0 ? stats.weekly : [0, 0, 0, 0, 0, 0, 0]} />
						<Typography variant="caption" color="success.main" sx={{ ml: 1, fontWeight: 700 }}>
							{stats.weekly[stats.weekly.length - 1] > 0 ? `+${stats.weekly[stats.weekly.length - 1]} today` : 'No new'}
						</Typography>
					</Box>
				</StatCard>
			</Box>

			{/* Card 2: Gender Distribution */}
			<Box sx={{ flex: '1 1 300px' }}>
				<StatCard
					title="Gender Distribution"
					icon={PieChart}
					color={theme.palette.secondary.main}
				>
					<Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
						{/* Male */}
						<Box sx={{ textAlign: 'center' }}>
							<Man sx={{ color: '#1976d2', fontSize: 20 }} />
							<Typography variant="body1" sx={{ fontWeight: 700, color: '#1976d2' }}>
								{stats.male}
							</Typography>
							<Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, fontSize: '0.6rem' }}>
								MALE
							</Typography>
						</Box>

						{/* Divider */}
						<Box sx={{ width: '1px', height: '30px', bgcolor: '#e2e8f0', mb: 1 }} />

						{/* Female */}
						<Box sx={{ textAlign: 'center' }}>
							<Woman sx={{ color: '#9c27b0', fontSize: 20 }} />
							<Typography variant="body1" sx={{ fontWeight: 700, color: '#9c27b0' }}>
								{stats.female}
							</Typography>
							<Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, fontSize: '0.6rem' }}>
								FEMALE
							</Typography>
						</Box>

						{/* Divider */}
						<Box sx={{ width: '1px', height: '30px', bgcolor: '#e2e8f0', mb: 1 }} />

						{/* Other */}
						<Box sx={{ textAlign: 'center' }}>
							<Transgender sx={{ color: '#ed6c02', fontSize: 20 }} />
							<Typography variant="body1" sx={{ fontWeight: 700, color: '#ed6c02' }}>
								{stats.others}
							</Typography>
							<Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, fontSize: '0.6rem' }}>
								OTHER
							</Typography>
						</Box>
					</Box>
				</StatCard>
			</Box>

			{/* Card 3: Registered Today */}
			<Box sx={{ flex: '1 1 300px' }}>
				<StatCard
					title="Registered Today"
					count={(stats.today || 0).toLocaleString()}
					icon={Today}
					color={theme.palette.success.main}
					subtitle="Candidates registered in last 24h"
				>
					<Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
						<StatSparkLine color={theme.palette.success.light} data={stats.weekly.length > 0 ? stats.weekly : [0, 0, 0, 0, 0, 0, 0]} />
						<Typography variant="caption" sx={{ ml: 1, color: 'text.secondary', fontWeight: 600 }}>
							Last 7 days
						</Typography>
					</Box>
				</StatCard>
			</Box>
		</Box>
	);
};


export default CandidateStatCards;
