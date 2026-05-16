import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import {
	CheckCircle as PresentIcon,
	Cancel as AbsentIcon,
	AccessTime as LateIcon,
	Contrast as HalfDayIcon,
	EventBusy as HolidayIcon,
} from '@mui/icons-material';

import { useTheme, alpha } from '@mui/material';

// Function to get status map with theme colors
export const getStatusMap = (theme: any) => ({
	present: { label: 'P', color: theme.palette.success.main, icon: <PresentIcon fontSize="small" /> },
	absent: { label: 'A', color: theme.palette.error.main, icon: <AbsentIcon fontSize="small" /> },
	late: { label: 'L', color: theme.palette.warning.main, icon: <LateIcon fontSize="small" /> },
	half_day: { label: 'H', color: theme.palette.info.main, icon: <HalfDayIcon fontSize="small" /> },
});

const AttendanceLegendBar: React.FC = () => {
	const theme = useTheme();
	const statusMap = getStatusMap(theme);

	return (
		<Paper 
			elevation={0} 
			sx={{ 
				mt: 4, 
				p: 2.5, 
				bgcolor: alpha(theme.palette.background.default, 0.5),
				border: '1px solid',
				borderColor: 'divider',
				borderRadius: 2
			}}
		>
			<Typography 
				variant="caption" 
				sx={{ 
					fontWeight: 800, 
					mb: 2, 
					display: 'block', 
					color: 'text.secondary',
					letterSpacing: '0.1em',
					textTransform: 'uppercase'
				}}
			>
				Report Legend
			</Typography>
			<Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
				{Object.entries(statusMap).map(([val, info]) => (
					<Box key={val} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
						<Box sx={{ color: info.color, display: 'flex' }}>{info.icon}</Box>
						<Typography variant="caption" sx={{ fontWeight: 600, textTransform: 'capitalize', color: 'text.primary' }}>
							{val.replace('_', ' ')}
						</Typography>
					</Box>
				))}
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
					<HolidayIcon sx={{ fontSize: 18, color: 'error.main' }} />
					<Typography variant="caption" sx={{ fontWeight: 600, color: 'text.primary' }}>Holiday</Typography>
				</Box>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
					<Typography 
						variant="caption" 
						sx={{ 
							color: 'text.disabled', 
							fontWeight: 800, 
							border: '1px solid',
							borderColor: 'divider', 
							px: 1, 
							py: 0.2,
							borderRadius: 0.5,
							fontSize: '0.65rem',
							bgcolor: 'background.paper'
						}}
					>
						W/E
					</Typography>
					<Typography variant="caption" sx={{ fontWeight: 600, color: 'text.primary' }}>Weekend</Typography>
				</Box>
			</Box>
		</Paper>
	);
};

export default AttendanceLegendBar;
