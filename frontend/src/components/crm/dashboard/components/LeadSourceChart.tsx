import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { PieChart } from '@mui/x-charts/PieChart';
import type { SourceStats } from '../../../../models/crm/crmStats';

const COLORS = ['#8B7CF6', '#10B981', '#4EA8FF', '#F59E0B', '#F472B6', '#94A3B8', '#34D399'];

interface LeadSourceChartProps {
	sources: SourceStats[];
}

export const LeadSourceChart: React.FC<LeadSourceChartProps> = ({ sources }) => {
	return (
		<Card sx={{ borderRadius: '16px', height: '100%' }}>
			<CardContent>
				<Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
					Lead Source Breakdown
				</Typography>
				{sources.length === 0 ? (
					<Box sx={{ py: 6, textAlign: 'center' }}>
						<Typography variant="body2" color="text.secondary">No leads logged yet.</Typography>
					</Box>
				) : (
					<PieChart
						height={320}
						series={[{
							data: sources.map((s, idx) => ({
								id: idx,
								value: s.count,
								label: s.source.replace('_', ' '),
								color: COLORS[idx % COLORS.length],
							})),
							innerRadius: 50,
							paddingAngle: 1,
						}]}
					/>
				)}
			</CardContent>
		</Card>
	);
};

export default LeadSourceChart;
