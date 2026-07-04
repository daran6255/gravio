import React, { useState } from 'react';
import {
	Menu,
	MenuItem,
	ListItemIcon,
	ListItemText,
	Box,
	alpha,
	useTheme,
	Divider
} from '@mui/material';

export interface ActionMenuItem {
	label: string;
	icon?: React.ReactNode;
	onClick: () => void;
	color?: string;
	divider?: boolean;
	disabled?: boolean;
}

interface ActionMenuProps {
	trigger: React.ReactNode;
	actions: ActionMenuItem[];
	minWidth?: number;
	header?: React.ReactNode;
}

const ActionMenu: React.FC<ActionMenuProps> = ({
	trigger,
	actions,
	minWidth = 240,
	header
}) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

	const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
		setAnchorEl(event.currentTarget);
	};

	const handleClose = () => {
		setAnchorEl(null);
	};

	return (
		<>
			<Box onClick={handleOpen} sx={{ display: 'flex', width: '100%' }}>
				{trigger}
			</Box>

			<Menu
				anchorEl={anchorEl}
				open={Boolean(anchorEl)}
				onClose={handleClose}
				anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
				transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
				slotProps={{
					paper: {
						elevation: 0,
						sx: {
							minWidth,
							p: 0.75,
							mb: 1,
							ml: 1,
							borderRadius: 3,
							border: '1px solid',
							borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
							bgcolor: isDark ? 'rgba(21, 26, 38, 0.98)' : alpha(theme.palette.background.paper, 0.98),
							backdropFilter: 'blur(16px)',
							boxShadow: isDark
								? '0 16px 40px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3)'
								: '0 16px 40px rgba(15, 23, 42, 0.12), 0 2px 8px rgba(15, 23, 42, 0.06)'
						}
					}
				}}
			>
				{/* Custom Header */}
				{header && (
					<Box sx={{ px: 1.5, py: 1.25 }}>
						{header}
					</Box>
				)}

				{actions.flatMap((action, index) => {
					const color = action.color || theme.palette.text.secondary;
					const items: React.ReactNode[] = [];

					if (action.divider || (index === 0 && header)) {
						items.push(
							<Divider
								key={`divider-${index}`}
								sx={{
									my: 0.75,
									mx: 1,
									borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'
								}}
							/>
						);
					}

					items.push(
						<MenuItem
							key={index}
							onClick={() => {
								if (action.disabled) return;
								action.onClick();
								handleClose();
							}}
							disabled={action.disabled}
							sx={{
								borderRadius: 2,
								py: 0.75,
								px: 1.25,
								gap: 1.25,
								mb: index < actions.length - 1 ? 0.25 : 0,
								color: action.color || theme.palette.text.primary,
								transition: 'background-color 0.15s ease',
								'&:hover': {
									bgcolor: alpha(color, 0.08)
								}
							}}
						>
							{action.icon && (
								<ListItemIcon
									sx={{
										minWidth: '28px !important',
										width: 28,
										height: 28,
										borderRadius: '6px',
										bgcolor: alpha(color, 0.1),
										color,
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center'
									}}
								>
									{action.icon}
								</ListItemIcon>
							)}
							<ListItemText
								primary={action.label}
								slotProps={{
									primary: {
										sx: {
											fontSize: '0.825rem',
											fontWeight: 600,
											color: action.color || 'text.primary'
										}
									}
								}}
							/>
						</MenuItem>
					);

					return items;
				})}
			</Menu>
		</>
	);
};

export default ActionMenu;
