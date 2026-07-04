import React from 'react';
import { Box, Stack, Typography, useTheme } from '@mui/material';
import dayjs from 'dayjs';
import type { ProjectTask } from '../../../../../models/projects/projectTask';

interface ActivityTimelineProps {
	task: ProjectTask;
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ task }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';

	return (
		<Box sx={{ pl: 1 }}>
			<Typography variant="subtitle2" sx={{ fontWeight: 750, letterSpacing: '-0.01em', mb: 2 }}>
				Activity
			</Typography>
			<Stack
				spacing={3}
				sx={{
					borderLeft: '2px solid',
					borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
					pl: 3.5,
					position: 'relative',
				}}
			>
				{/* Created Checkpoint */}
				<Box sx={{ position: 'relative' }}>
					<Box
						sx={{
							position: 'absolute',
							left: '-37px',
							top: '4px',
							width: 10,
							height: 10,
							borderRadius: '50%',
							border: '3px solid',
							borderColor: 'primary.main',
							bgcolor: 'background.paper',
							boxShadow: `0 0 0 4px ${isDark ? 'rgba(139,124,246,0.1)' : 'rgba(139,124,246,0.05)'}`,
						}}
					/>
					<Typography variant="body2" sx={{ fontWeight: 650 }}>
						Task created
					</Typography>
					<Typography variant="caption" sx={{ color: 'text.secondary' }}>
						on {dayjs(task.created_at).format('MMM D, YYYY [at] h:mm A')}
					</Typography>
				</Box>

				{/* Updated Checkpoint */}
				<Box sx={{ position: 'relative' }}>
					<Box
						sx={{
							position: 'absolute',
							left: '-37px',
							top: '4px',
							width: 10,
							height: 10,
							borderRadius: '50%',
							border: '3px solid',
							borderColor: 'secondary.main',
							bgcolor: 'background.paper',
							boxShadow: `0 0 0 4px ${isDark ? 'rgba(78,168,255,0.1)' : 'rgba(78,168,255,0.05)'}`,
						}}
					/>
					<Typography variant="body2" sx={{ fontWeight: 650 }}>
						Last modified
					</Typography>
					<Typography variant="caption" sx={{ color: 'text.secondary' }}>
						on {dayjs(task.updated_at).format('MMM D, YYYY [at] h:mm A')}
					</Typography>
				</Box>
			</Stack>
		</Box>
	);
};

export default ActivityTimeline;
