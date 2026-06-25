import React from 'react';
import { Card, CardContent, Typography, Box, useTheme } from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import type { StageStats } from '../../../../models/crm/crmStats';

interface PipelineValueChartProps {
	stages: StageStats[];
}

export const PipelineValueChart: React.FC<PipelineValueChartProps> = ({ stages }) => {
	const theme = useTheme();

	return (
		<Card sx={{ borderRadius: '16px', height: '100%' }}>
			<CardContent>
				<Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
					Pipeline Value by Stage
				</Typography>
				{stages.length === 0 ? (
					<Box sx={{ py: 6, textAlign: 'center' }}>
						<Typography variant="body2" color="text.secondary">No open deals yet.</Typography>
					</Box>
				) : (
					<BarChart
						height={320}
						xAxis={[{ scaleType: 'band', data: stages.map((s) => s.stage_name) }]}
						series={[{ data: stages.map((s) => s.total_value), label: 'Deal Value', color: theme.palette.primary.main }]}
						grid={{ horizontal: true }}
					/>
				)}
			</CardContent>
		</Card>
	);
};

export default PipelineValueChart;
