import React from 'react';
import { Box, Typography, Stack, LinearProgress, alpha, useTheme } from '@mui/material';
import { AccountTreeOutlined as HierarchyIcon } from '@mui/icons-material';
import { getAccent } from '../accentColors';

interface GradeDistributionCardProps {
	gradeStats: Array<[string, number]>;
	total: number;
}

export const GradeDistributionCard: React.FC<GradeDistributionCardProps> = ({ gradeStats, total }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';

	return (
		<Box sx={{
			p: 2.5, borderRadius: '20px',
			bgcolor: theme.palette.background.paper,
			border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.04)',
			boxShadow: isDark ? '0 1px 2px rgba(0,0,0,0.4), 0 8px 20px rgba(0,0,0,0.2)' : '0 1px 2px rgba(15,23,42,0.04), 0 8px 20px rgba(15,23,42,0.05)',
		}}>
			<Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2.5 }}>
				<HierarchyIcon sx={{ fontSize: '1.1rem', color: 'text.secondary' }} />
				<Typography variant="subtitle2" fontWeight={800}>Grade Distribution</Typography>
			</Stack>
			<Stack spacing={1.75}>
				{gradeStats.map(([grade, count], idx) => {
					const accent = getAccent(theme, idx);
					const pct = total ? Math.round((count / total) * 100) : 0;
					return (
						<Box key={grade}>
							<Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 0.6 }}>
								<Stack direction="row" spacing={1} alignItems="center">
									<Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: accent, flexShrink: 0 }} />
									<Typography variant="body2" fontWeight={700}>{grade}</Typography>
								</Stack>
								<Stack direction="row" spacing={1} alignItems="baseline">
									<Typography variant="body2" fontWeight={800}>{count}</Typography>
									<Typography variant="caption" color="text.secondary" sx={{ minWidth: 32, textAlign: 'right' }}>
										{pct}%
									</Typography>
								</Stack>
							</Stack>
							<LinearProgress
								variant="determinate"
								value={pct}
								sx={{
									height: 7, borderRadius: 4,
									bgcolor: alpha(accent, 0.12),
									'& .MuiLinearProgress-bar': { borderRadius: 4, bgcolor: accent },
								}}
							/>
						</Box>
					);
				})}
			</Stack>
		</Box>
	);
};

export default GradeDistributionCard;
