import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Paper, Stack, Typography, Chip, useTheme } from '@mui/material';
import { NotificationImportantOutlined, WarningAmberOutlined } from '@mui/icons-material';
import dayjs from 'dayjs';
import type { ProjectDeadlineItem } from '../../../models/projects/project';

interface ProjectAttentionPanelProps {
	upcomingDeadlines: ProjectDeadlineItem[];
	overdueProjects: ProjectDeadlineItem[];
}

const DeadlineRow: React.FC<{ item: ProjectDeadlineItem; overdue?: boolean }> = ({ item, overdue }) => {
	const navigate = useNavigate();
	const daysDiff = dayjs(item.end_date).diff(dayjs(), 'day');

	return (
		<Box
			onClick={() => navigate(item.public_id)}
			sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
		>
			<Box sx={{ maxWidth: '70%' }}>
				<Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
					{item.name}
				</Typography>
				<Typography variant="caption" color="text.secondary">
					Due {dayjs(item.end_date).format('MMM DD, YYYY')}
				</Typography>
			</Box>
			<Chip
				label={overdue ? `${Math.abs(daysDiff)}d overdue` : daysDiff === 0 ? 'Today' : `${daysDiff}d left`}
				size="small"
				color={overdue ? 'error' : daysDiff <= 3 ? 'warning' : 'primary'}
				variant="outlined"
				sx={{ fontWeight: 700, borderRadius: '6px' }}
			/>
		</Box>
	);
};

export const ProjectAttentionPanel: React.FC<ProjectAttentionPanelProps> = ({ upcomingDeadlines, overdueProjects }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';

	return (
		<Stack spacing={3}>
			<Paper variant="outlined" sx={{ p: 2.5, borderRadius: '16px', bgcolor: isDark ? 'background.paper' : '#ffffff' }}>
				<Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
					<WarningAmberOutlined color="error" fontSize="small" />
					<Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
						Overdue Projects
					</Typography>
				</Stack>

				{overdueProjects.length > 0 ? (
					<Stack spacing={2}>
						{overdueProjects.map((item) => (
							<DeadlineRow key={item.public_id} item={item} overdue />
						))}
					</Stack>
				) : (
					<Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
						No overdue projects — everything is on track.
					</Typography>
				)}
			</Paper>

			<Paper variant="outlined" sx={{ p: 2.5, borderRadius: '16px', bgcolor: isDark ? 'background.paper' : '#ffffff' }}>
				<Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
					<NotificationImportantOutlined color="primary" fontSize="small" />
					<Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
						Upcoming Deadlines
					</Typography>
				</Stack>

				{upcomingDeadlines.length > 0 ? (
					<Stack spacing={2}>
						{upcomingDeadlines.map((item) => (
							<DeadlineRow key={item.public_id} item={item} />
						))}
					</Stack>
				) : (
					<Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
						No upcoming project deadlines.
					</Typography>
				)}
			</Paper>
		</Stack>
	);
};

export default ProjectAttentionPanel;
