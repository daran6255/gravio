import React from 'react';
import { Box, Typography, Stack, useTheme } from '@mui/material';
import { HelpOutline } from '@mui/icons-material';
import PremiumTooltip from '../../../common/PremiumTooltip';
import { getStatusTone } from '../../../common/badge/StatusBadge';
import { PROJECT_STATUS_OPTIONS } from '../../../../models/projects/project';
import type { ProjectStatusCount } from '../../../../models/projects/project';

interface ProjectStatusBreakdownProps {
	statusCounts: ProjectStatusCount[];
}

const STATUS_LABELS = Object.fromEntries(PROJECT_STATUS_OPTIONS.map((o) => [o.value, o.label]));

export const ProjectStatusBreakdown: React.FC<ProjectStatusBreakdownProps> = ({ statusCounts }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const nonZero = statusCounts.filter((s) => s.count > 0);
	const maxCount = Math.max(1, ...nonZero.map((s) => s.count));
	const sorted = [...nonZero].sort((a, b) => b.count - a.count);

	const toneColor = {
		success: theme.palette.success.main,
		info: theme.palette.primary.main,
		warning: theme.palette.warning.main,
		error: theme.palette.error.main,
		default: theme.palette.text.disabled,
	};

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
				<Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Projects by Status</Typography>
				<PremiumTooltip title="How your delivery projects are distributed across the workflow." arrow placement="right">
					<HelpOutline sx={{ fontSize: 13, color: 'text.secondary', cursor: 'pointer', opacity: 0.7, '&:hover': { opacity: 1, color: 'primary.main' } }} />
				</PremiumTooltip>
			</Box>

			{sorted.length === 0 ? (
				<Typography variant="caption" color="text.secondary">No projects yet</Typography>
			) : (
				<Stack spacing={1.5}>
					{sorted.map((s) => {
						const color = toneColor[getStatusTone(s.status, 'project')];
						return (
							<Box key={s.status}>
								<Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
									<Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
										{STATUS_LABELS[s.status] ?? s.status}
									</Typography>
									<Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary' }}>{s.count}</Typography>
								</Stack>
								<Box sx={{ height: 6, borderRadius: '3px', bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', overflow: 'hidden' }}>
									<Box
										sx={{
											height: '100%',
											width: `${(s.count / maxCount) * 100}%`,
											borderRadius: '3px',
											bgcolor: color,
											transition: 'width 0.3s ease',
										}}
									/>
								</Box>
							</Box>
						);
					})}
				</Stack>
			)}
		</Box>
	);
};

export default ProjectStatusBreakdown;
