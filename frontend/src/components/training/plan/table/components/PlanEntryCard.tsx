import React from 'react';
import { Paper, Stack, Box, Typography, IconButton, useTheme, alpha } from '@mui/material';
import { MoreVert as MenuIcon } from '@mui/icons-material';
import { formatTime12h } from '../../utils/planFormatters';
import type { TrainingBatchPlan } from '../../../../../models/training';

interface PlanEntryCardProps {
	entry: TrainingBatchPlan;
	canEdit: boolean;
	isExporting: boolean;
	onMenuOpen: (event: React.MouseEvent<HTMLButtonElement>, entry: TrainingBatchPlan) => void;
}

const PlanEntryCard: React.FC<PlanEntryCardProps> = ({
	entry,
	canEdit,
	isExporting,
	onMenuOpen
}) => {
	const theme = useTheme();
	const isBreak = entry.activity_type === 'break';

	return (
		<Paper
			elevation={0}
			sx={{
				p: 1.5,
				bgcolor: isBreak ? 'action.hover' : alpha(theme.palette.primary.main, 0.04),
				borderLeft: '4px solid',
				borderLeftColor: isBreak ? 'text.disabled' : 'primary.main',
				borderRadius: 2,
				position: 'relative',
				boxShadow: '0 2px 12px ' + alpha(theme.palette.common.black, 0.04),
				transition: 'all 0.2s',
				'&:hover': {
					boxShadow: '0 4px 16px ' + alpha(theme.palette.common.black, 0.08),
					bgcolor: isBreak ? 'action.selected' : alpha(theme.palette.primary.main, 0.08)
				}
			}}
		>
			<Stack direction="row" justifyContent="space-between" alignItems="flex-start">
				<Box sx={{ flex: 1 }}>
					<Typography variant="body2" sx={{ fontWeight: 800, mb: 0.5, color: isBreak ? 'text.secondary' : 'text.primary', fontSize: '0.85rem' }}>
						{entry.activity_name}
					</Typography>
					<Typography variant="caption" display="flex" alignItems="center" color={isBreak ? 'text.disabled' : 'primary.main'} sx={{ fontWeight: 700, fontSize: '0.7rem' }}>
						{formatTime12h(entry.start_time)} - {formatTime12h(entry.end_time)}
					</Typography>
					{entry.trainer && ['course', 'hr_session', 'mock_interview'].includes(entry.activity_type) && (
						<Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.8, fontSize: '0.7rem', fontWeight: 600, bgcolor: alpha(theme.palette.primary.main, 0.05), py: 0.2, px: 0.8, borderRadius: 1, width: 'fit-content' }}>
							Trainer: {entry.trainer}
						</Typography>
					)}
					{entry.notes && (
						<Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.8, fontStyle: 'italic', opacity: 0.8, fontSize: '0.65rem' }}>
							Note: {entry.notes}
						</Typography>
					)}
				</Box>
				{canEdit && !isExporting && (
					<IconButton
						size="small"
						onClick={(e) => onMenuOpen(e, entry)}
						sx={{ 
							p: 0.5,
							ml: 1,
							color: 'text.secondary',
							bgcolor: 'background.paper',
							boxShadow: 1,
							'&:hover': { bgcolor: 'action.selected' }
						}}
					>
						<MenuIcon sx={{ fontSize: 18 }} />
					</IconButton>
				)}
			</Stack>
		</Paper>
	);
};

export default PlanEntryCard;
