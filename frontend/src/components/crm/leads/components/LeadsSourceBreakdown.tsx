import React from 'react';
import { Box, Typography, Stack, useTheme } from '@mui/material';
import { HelpOutline } from '@mui/icons-material';
import PremiumTooltip from '../../../common/PremiumTooltip';
import type { SourceStats } from '../../../../models/crm/crmStats';

interface LeadsSourceBreakdownProps {
	sourceStats: SourceStats[];
}

export const LeadsSourceBreakdown: React.FC<LeadsSourceBreakdownProps> = ({ sourceStats }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const maxCount = Math.max(1, ...sourceStats.map((s) => s.count));
	const sorted = [...sourceStats].sort((a, b) => b.count - a.count);

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
				<Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Leads by Source</Typography>
				<PremiumTooltip title="The acquisition channel from which candidates registered (e.g. Website, Referral, campaigns)." arrow placement="right">
					<HelpOutline sx={{ fontSize: 13, color: 'text.secondary', cursor: 'pointer', opacity: 0.7, '&:hover': { opacity: 1, color: 'primary.main' } }} />
				</PremiumTooltip>
			</Box>

			{sorted.length === 0 ? (
				<Typography variant="caption" color="text.secondary">No leads yet</Typography>
			) : (
				<Stack spacing={1.5}>
					{sorted.map((s) => (
						<Box key={s.source}>
							<Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
								<Typography variant="body2" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>
									{s.source.replace('_', ' ')}
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

export default LeadsSourceBreakdown;
