import React from 'react';
import { Box, Typography, Stack, useTheme } from '@mui/material';
import { HelpOutline } from '@mui/icons-material';
import PremiumTooltip from '../../../common/PremiumTooltip';
import type { IndustryStats } from '../../../../models/crm/crmStats';

interface CompaniesIndustryBreakdownProps {
	industryStats: IndustryStats[];
}

export const CompaniesIndustryBreakdown: React.FC<CompaniesIndustryBreakdownProps> = ({ industryStats }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const maxCount = Math.max(1, ...industryStats.map((s) => s.count));
	const sorted = [...industryStats].sort((a, b) => b.count - a.count);

	return (
		<Box
			sx={{
				borderRadius: '16px',
				border: '1px solid',
				borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
				bgcolor: 'background.paper',
				p: 2.5,
			}}
		>
			<Box display="flex" alignItems="center" gap={0.5} sx={{ mb: 2 }}>
				<Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Companies by Industry</Typography>
				<PremiumTooltip title="The top industries represented across your company accounts." arrow placement="right">
					<HelpOutline sx={{ fontSize: 13, color: 'text.secondary', cursor: 'pointer', opacity: 0.7, '&:hover': { opacity: 1, color: 'primary.main' } }} />
				</PremiumTooltip>
			</Box>

			{sorted.length === 0 ? (
				<Typography variant="caption" color="text.secondary">No companies yet</Typography>
			) : (
				<Stack spacing={1.5}>
					{sorted.map((s) => (
						<Box key={s.industry}>
							<Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
								<Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
									{s.industry}
								</Typography>
								<Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary' }}>{s.count}</Typography>
							</Stack>
							<Box sx={{ height: 6, borderRadius: '3px', bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', overflow: 'hidden' }}>
								<Box
									sx={{
										height: '100%',
										width: `${(s.count / maxCount) * 100}%`,
										borderRadius: '3px',
										bgcolor: 'primary.main',
										transition: 'width 0.3s ease',
									}}
								/>
							</Box>
						</Box>
					))}
				</Stack>
			)}
		</Box>
	);
};

export default CompaniesIndustryBreakdown;
