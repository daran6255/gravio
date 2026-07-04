import React from 'react';
import { Box, Stack, Typography, Chip, Avatar, useTheme, alpha } from '@mui/material';
import { CalendarMonthOutlined, AttachMoneyOutlined, FolderOpenOutlined } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import StatusBadge from '../../common/badge/StatusBadge';
import type { Project } from '../../../models/projects/project';
import type { CRMOwnerOption } from '../../../models/crm/owner';

interface ProjectDetailHeaderProps {
	project: Project;
	owners: CRMOwnerOption[];
}

const formatDate = (dateStr?: string): string => {
	if (!dateStr) return '—';
	return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatBudget = (project: Project): string => {
	if (project.budget == null) return '—';
	return new Intl.NumberFormat(undefined, { style: 'currency', currency: project.currency }).format(project.budget);
};

export const ProjectDetailHeader: React.FC<ProjectDetailHeaderProps> = ({ project, owners }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const navigate = useNavigate();
	const owner = project.owner_id ? owners.find((o) => o.id === project.owner_id) : undefined;

	return (
		<Box
			sx={{
				bgcolor: isDark ? '#141822' : '#ffffff',
				border: '1px solid',
				borderColor: 'divider',
				borderRadius: 4,
				p: 3,
				mb: 3,
			}}
		>
			<Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems={{ md: 'center' }} justifyContent="space-between">
				<Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
					<StatusBadge label={project.status.replace('_', ' ')} status={project.status} type="project" />

					{project.deal_id && (
						<Chip
							label="Converted from a Won deal"
							size="small"
							icon={<FolderOpenOutlined sx={{ fontSize: 14 }} />}
							onClick={() => navigate('/crm/deals')}
							sx={{ fontWeight: 600, cursor: 'pointer' }}
						/>
					)}

					<Stack direction="row" spacing={1} alignItems="center">
						<CalendarMonthOutlined sx={{ fontSize: 16, color: 'text.secondary' }} />
						<Typography variant="caption" color="text.secondary">
							{formatDate(project.start_date)} — {formatDate(project.end_date)}
						</Typography>
					</Stack>

					<Stack direction="row" spacing={1} alignItems="center">
						<AttachMoneyOutlined sx={{ fontSize: 16, color: 'text.secondary' }} />
						<Typography variant="caption" color="text.secondary">
							{formatBudget(project)}
						</Typography>
					</Stack>
				</Stack>

				{owner && (
					<Stack direction="row" spacing={1} alignItems="center">
						<Avatar sx={{ width: 28, height: 28, fontSize: '0.75rem', fontWeight: 700, bgcolor: alpha('#8B7CF6', 0.15), color: '#8B7CF6' }}>
							{(owner.full_name || owner.email)[0]?.toUpperCase()}
						</Avatar>
						<Box>
							<Typography variant="caption" color="text.secondary" display="block">Owner</Typography>
							<Typography variant="body2" sx={{ fontWeight: 600 }}>{owner.full_name || owner.email}</Typography>
						</Box>
					</Stack>
				)}
			</Stack>

			{project.description && (
				<Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
					{project.description}
				</Typography>
			)}
		</Box>
	);
};

export default ProjectDetailHeader;
