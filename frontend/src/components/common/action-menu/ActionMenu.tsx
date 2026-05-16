import React, { memo } from 'react';
import {
	Menu,
	MenuItem,
	ListItemIcon,
	ListItemText,
	Box,
	alpha,
	useTheme
} from '@mui/material';

export interface ActionMenuItem {
	label: string;
	icon: React.ReactNode;
	onClick: () => void;
	color?: string;
	divider?: boolean;
	disabled?: boolean;
}

interface ActionMenuProps {
	anchorEl: HTMLElement | null;
	open: boolean;
	onClose: () => void;
	actions: ActionMenuItem[];
	minWidth?: number;
}

const ActionMenu: React.FC<ActionMenuProps> = memo(({
	anchorEl,
	open,
	onClose,
	actions,
	minWidth = 180
}) => {
	const theme = useTheme();

	return (
		<Menu
			anchorEl={anchorEl}
			open={open}
			onClose={onClose}
			anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
			transformOrigin={{ vertical: 'top', horizontal: 'right' }}
			slotProps={{
				paper: {
					elevation: 4,
					sx: {
						minWidth,
						borderRadius: 2,
						mt: 1,
						border: '1px solid',
						borderColor: 'divider',
						bgcolor: alpha(theme.palette.background.paper, 0.95),
						backdropFilter: 'blur(8px)',
						'& .MuiMenuItem-root': {
							fontSize: '0.85rem',
							fontWeight: 600,
							py: 1.25,
							px: 2,
							gap: 1.5,
							transition: 'all 0.2s ease',
							'&:hover': {
								bgcolor: alpha(theme.palette.primary.main, 0.04),
								color: 'primary.main',
								'& .MuiListItemIcon-root': {
									color: 'inherit',
									transform: 'translateX(2px)'
								}
							}
						}
					}
				}
			} as any}
		>
			{actions.map((action, index) => (
				<React.Fragment key={index}>
					{action.divider && <Box sx={{ my: 0.5, borderTop: '1px solid', borderColor: 'divider' }} />}
					<MenuItem
						onClick={() => {
							action.onClick();
							onClose();
						}}
						disabled={action.disabled}
						sx={{
							color: action.color || 'text.primary',
							'& .MuiListItemIcon-root': {
								color: action.color || 'text.secondary',
								minWidth: 'auto !important',
								transition: 'transform 0.2s ease'
							}
						}}
					>
						<ListItemIcon>
							{action.icon}
						</ListItemIcon>
						<ListItemText 
							primary={action.label}
							primaryTypographyProps={{ 
								variant: 'body2', 
								fontWeight: 600,
								sx: { fontSize: '0.825rem' }
							}}
						/>
					</MenuItem>
				</React.Fragment>
			))}
		</Menu>
	);
});

ActionMenu.displayName = 'ActionMenu';

export default ActionMenu;
