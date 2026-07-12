import React from 'react';
import { Box, Chip, IconButton, Stack, Typography, alpha, useTheme } from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, AssignmentOutlined as TaskIcon } from '@mui/icons-material';
import type { HRChecklistTemplate } from '../../../../models/hr';

interface TemplateCardProps {
	template: HRChecklistTemplate;
	canManage: boolean;
	onEdit: () => void;
	onDelete: () => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({ template, canManage, onEdit, onDelete }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const isOnboarding = template.checklist_type === 'onboarding';
	const accent = isOnboarding ? theme.palette.primary.main : theme.palette.error.main;

	return (
		<Box
			sx={{
				p: 2.5,
				borderRadius: '20px',
				height: '100%',
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'space-between',
				bgcolor: theme.palette.background.paper,
				border: '1px solid',
				borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.04)',
				boxShadow: isDark
					? '0 1px 2px rgba(0,0,0,0.4), 0 8px 20px rgba(0,0,0,0.2)'
					: '0 1px 2px rgba(15,23,42,0.04), 0 8px 20px rgba(15,23,42,0.05)',
				opacity: template.is_active ? 1 : 0.6,
			}}
		>
			<Box>
				<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
					<Chip
						label={isOnboarding ? 'Onboarding' : 'Offboarding'}
						size="small"
						sx={{
							fontWeight: 800, textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.4px',
							bgcolor: alpha(accent, 0.12), color: accent,
						}}
					/>
					{!template.is_active && <Chip label="INACTIVE" size="small" variant="outlined" />}
				</Stack>

				<Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1.5 }}>{template.name}</Typography>

				<Stack spacing={1}>
					{template.tasks.slice(0, 3).map((task) => (
						<Stack key={task.id} direction="row" spacing={1} alignItems="center">
							<TaskIcon sx={{ fontSize: '0.9rem', color: 'text.secondary' }} />
							<Typography variant="body2" color="text.secondary" noWrap sx={{ fontSize: '0.85rem' }}>
								{task.title}
							</Typography>
						</Stack>
					))}
					{template.tasks.length > 3 && (
						<Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic', pl: 2.5 }}>
							+ {template.tasks.length - 3} more tasks
						</Typography>
					)}
				</Stack>
			</Box>

			<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 2.5, pt: 1.5, borderTop: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)' }}>
				<Typography variant="caption" color="text.secondary" fontWeight={700}>
					{template.tasks.length} task{template.tasks.length !== 1 ? 's' : ''} defined
				</Typography>
				{canManage && (
					<Stack direction="row">
						<IconButton size="small" onClick={onEdit}>
							<EditIcon sx={{ fontSize: '1rem' }} />
						</IconButton>
						<IconButton size="small" color="error" onClick={onDelete}>
							<DeleteIcon sx={{ fontSize: '1rem' }} />
						</IconButton>
					</Stack>
				)}
			</Stack>
		</Box>
	);
};

export default TemplateCard;
