import React from 'react';
import { Menu, MenuItem, ListItemIcon, ListItemText, useTheme, alpha } from '@mui/material';
import { Edit as EditIcon, ContentCopy as CopyIcon, Delete as DeleteIcon } from '@mui/icons-material';
import type { TrainingBatchPlan } from '../../../../../models/training';

interface PlanActionMenuProps {
	anchorEl: HTMLElement | null;
	onClose: () => void;
	onEdit: (entry: TrainingBatchPlan) => void;
	onReplicate: (entry: TrainingBatchPlan) => void;
	onDelete: (publicId: string) => void;
	selectedEntry: TrainingBatchPlan | null;
}

const PlanActionMenu: React.FC<PlanActionMenuProps> = ({
	anchorEl,
	onClose,
	onEdit,
	onReplicate,
	onDelete,
	selectedEntry
}) => {
	const theme = useTheme();
	if (!selectedEntry) return null;

	return (
		<Menu
			anchorEl={anchorEl}
			open={Boolean(anchorEl)}
			onClose={onClose}
			PaperProps={{
				elevation: 4,
				sx: { 
					minWidth: 180, 
					borderRadius: 2,
					mt: 1,
					'& .MuiMenuItem-root': {
						px: 2,
						py: 1,
						borderRadius: 1,
						mx: 0.5,
						mb: 0.5,
						'&:last-child': { mb: 0 },
						'&:hover': { bgcolor: 'action.hover' }
					}
				}
			}}
			transformOrigin={{ horizontal: 'right', vertical: 'top' }}
			anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
		>
			<MenuItem onClick={() => { onEdit(selectedEntry); onClose(); }}>
				<ListItemIcon><EditIcon fontSize="small" color="primary" /></ListItemIcon>
				<ListItemText primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}>Edit Session</ListItemText>
			</MenuItem>
			<MenuItem onClick={() => { onReplicate(selectedEntry); onClose(); }}>
				<ListItemIcon><CopyIcon fontSize="small" color="secondary" /></ListItemIcon>
				<ListItemText primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}>Duplicate to Tomorrow</ListItemText>
			</MenuItem>
			<MenuItem onClick={() => { onDelete(selectedEntry.public_id); onClose(); }} sx={{ color: 'error.main', '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.05) } }}>
				<ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
				<ListItemText primaryTypographyProps={{ variant: 'body2', fontWeight: 700 }}>Remove Session</ListItemText>
			</MenuItem>
		</Menu>
	);
};

export default PlanActionMenu;
