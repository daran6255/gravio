import React from 'react';
import { Box, Typography, LinearProgress, useTheme, alpha } from '@mui/material';

interface DocumentProgressBarProps {
	uploadedCount: number;
	totalRequired: number;
}

/**
 * DocumentProgressBar - Premium visual indicator for document collection progress.
 * Features a theme-aligned gradient and percentage-based tracking.
 */
const DocumentProgressBar: React.FC<DocumentProgressBarProps> = ({
	uploadedCount,
	totalRequired
}) => {
	const theme = useTheme();
	const progress = totalRequired > 0 ? (uploadedCount / totalRequired) * 100 : 0;
	const isComplete = progress === 100;

	return (
		<Box sx={{ minWidth: 200 }}>
			<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
				<Typography variant="caption" sx={{ fontWeight: 700, color: 'common.white', opacity: 0.9 }}>
					Documentation Progress
				</Typography>
				<Typography variant="caption" sx={{ fontWeight: 700, color: 'common.white' }}>
					{uploadedCount} / {totalRequired} ({Math.round(progress)}%)
				</Typography>
			</Box>
			<LinearProgress
				variant="determinate"
				value={progress}
				sx={{
					height: 6,
					borderRadius: 3,
					bgcolor: alpha(theme.palette.common.white, 0.2),
					'& .MuiLinearProgress-bar': {
						borderRadius: 3,
						bgcolor: isComplete ? theme.palette.success.light : theme.palette.common.white,
						backgroundImage: isComplete 
							? 'none' 
							: `linear-gradient(90deg, ${alpha(theme.palette.common.white, 0.8)} 0%, ${theme.palette.common.white} 100%)`
					}
				}}
			/>
		</Box>
	);
};

export default DocumentProgressBar;
