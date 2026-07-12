import React from 'react';
import { Box, Typography, Stack, LinearProgress, alpha, useTheme } from '@mui/material';

interface CoverageCardProps {
	total: number;
	filledCount: number;
	filledPct: number;
	vacantPct: number;
}

export const CoverageCard: React.FC<CoverageCardProps> = ({ total, filledCount, filledPct, vacantPct }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';

	return (
		<Box sx={{
			p: 2.5, borderRadius: '20px',
			bgcolor: theme.palette.background.paper,
			border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.04)',
			boxShadow: isDark ? '0 1px 2px rgba(0,0,0,0.4), 0 8px 20px rgba(0,0,0,0.2)' : '0 1px 2px rgba(15,23,42,0.04), 0 8px 20px rgba(15,23,42,0.05)',
		}}>
			<Typography variant="subtitle2" fontWeight={800} sx={{ mb: 2 }}>Coverage</Typography>

			<Stack spacing={0.5} sx={{ mb: 2 }}>
				<Stack direction="row" justifyContent="space-between">
					<Typography variant="caption" color="text.secondary" fontWeight={600}>Filled Titles</Typography>
					<Typography variant="caption" fontWeight={800}>{filledPct}%</Typography>
				</Stack>
				<LinearProgress
					variant="determinate"
					value={filledPct}
					sx={{
						height: 6, borderRadius: 3,
						bgcolor: alpha(theme.palette.success.main, 0.12),
						'& .MuiLinearProgress-bar': { borderRadius: 3, bgcolor: 'success.main' },
					}}
				/>
			</Stack>

			<Stack spacing={0.5}>
				<Stack direction="row" justifyContent="space-between">
					<Typography variant="caption" color="text.secondary" fontWeight={600}>Unfilled Titles</Typography>
					<Typography variant="caption" fontWeight={800}>{vacantPct}%</Typography>
				</Stack>
				<LinearProgress
					variant="determinate"
					value={vacantPct}
					sx={{
						height: 6, borderRadius: 3,
						bgcolor: alpha(theme.palette.warning.main, 0.12),
						'& .MuiLinearProgress-bar': { borderRadius: 3, bgcolor: 'warning.main' },
					}}
				/>
			</Stack>

			<Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 2 }}>
				{filledCount} of {total} titles have at least one employee assigned.
			</Typography>
		</Box>
	);
};

export default CoverageCard;
