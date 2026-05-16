import React from 'react';
import {
	Box,
	Typography,
	Divider,
	Chip,
	Paper,
	alpha,
	useTheme
} from '@mui/material';
import {
	Person as OwnerIcon,
	Category as TypeIcon,
	CheckCircle as StatusIcon
} from '@mui/icons-material';
import type { DSRProject } from '../../../models/dsr';

export interface ProjectStats {
	totalActivities: number;
	completedActivities: number;
	inProgressActivities: number;
	totalActualHours: number;
	totalEstimatedHours: number;
}

interface ProjectInfoBarProps {
	project: DSRProject;
	stats?: ProjectStats;
}

/**
 * Common Project Information Bar
 * Designed to be used within ModuleHeaders to show project context and real-time KPIs.
 */
const ProjectInfoBar: React.FC<ProjectInfoBarProps> = ({ project }) => {
	const theme = useTheme();

	return (
		<Paper
			elevation={0}
			sx={{
				bgcolor: alpha(theme.palette.common.white, 0.04),
				borderRadius: 2,
				p: { xs: 1.5, sm: 2 },
				border: '1px solid',
				borderColor: alpha(theme.palette.common.white, 0.1),
				display: 'flex',
				flexWrap: 'wrap',
				alignItems: 'center',
				gap: { xs: 2.5, md: 4 },
				backdropFilter: 'blur(10px)',
			}}
		>
			{/* Project Identity */}
			<Box>
				<Typography variant="caption" sx={{ color: alpha(theme.palette.common.white, 0.4), display: 'block', mb: 0.75, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.65rem' }}>
					Project Name
				</Typography>
				<Typography variant="body2" sx={{ fontWeight: 700, color: 'common.white', fontSize: '0.95rem' }}>
					{project.name}
				</Typography>
			</Box>

			<Divider orientation="vertical" flexItem sx={{ borderColor: alpha(theme.palette.common.white, 0.1), my: 0.5 }} />

			{/* Governance */}
			<Box>
				<Typography variant="caption" sx={{ color: alpha(theme.palette.common.white, 0.4), display: 'block', mb: 0.75, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.65rem' }}>
					Owner
				</Typography>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
					<OwnerIcon sx={{ fontSize: 16, color: theme.palette.primary.light }} />
					<Typography variant="body2" sx={{ color: 'common.white', fontWeight: 500 }}>
						{project.owner?.full_name || project.owner?.username || 'N/A'}
					</Typography>
				</Box>
			</Box>

			{/* Project Type */}
			<Divider orientation="vertical" flexItem sx={{ borderColor: alpha(theme.palette.common.white, 0.1), my: 0.5 }} />

			<Box>
				<Typography variant="caption" sx={{ color: alpha(theme.palette.common.white, 0.4), display: 'block', mb: 0.75, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.65rem' }}>
					Type
				</Typography>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
					<TypeIcon sx={{ fontSize: 16, color: theme.palette.accent.light }} />
					<Chip
						label={project.project_type.toUpperCase()}
						size="small"
						sx={{
							height: 20,
							fontSize: '0.65rem',
							fontWeight: 900,
							bgcolor: project.project_type === 'training' ? alpha(theme.palette.info.main, 0.2) : alpha(theme.palette.common.white, 0.1),
							color: project.project_type === 'training' ? theme.palette.info.light : 'common.white',
							borderRadius: 1,
							border: '1px solid',
							borderColor: project.project_type === 'training' ? alpha(theme.palette.info.main, 0.3) : alpha(theme.palette.common.white, 0.2)
						}}
					/>
				</Box>
			</Box>

			<Divider orientation="vertical" flexItem sx={{ borderColor: alpha(theme.palette.common.white, 0.1), my: 0.5 }} />

			{/* Overall Status */}
			<Box>
				<Typography variant="caption" sx={{ color: alpha(theme.palette.common.white, 0.4), display: 'block', mb: 0.75, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.65rem' }}>
					Status
				</Typography>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
					<StatusIcon sx={{ fontSize: 16, color: project.is_active ? theme.palette.success.light : theme.palette.text.disabled }} />
					<Chip
						label={project.is_active ? 'ACTIVE' : 'INACTIVE'}
						size="small"
						sx={{
							height: 20,
							fontSize: '0.65rem',
							fontWeight: 900,
							bgcolor: project.is_active ? alpha(theme.palette.success.main, 0.15) : alpha(theme.palette.common.white, 0.05),
							color: project.is_active ? theme.palette.success.light : alpha(theme.palette.common.white, 0.3),
							borderRadius: 1,
							border: '1px solid',
							borderColor: project.is_active ? alpha(theme.palette.success.main, 0.3) : alpha(theme.palette.common.white, 0.1)
						}}
					/>
				</Box>
			</Box>
		</Paper>
	);
};

export default ProjectInfoBar;
