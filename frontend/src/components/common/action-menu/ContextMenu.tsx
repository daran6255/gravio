import React, { useState } from 'react';
import {
	IconButton,
	Menu,
	MenuItem,
	ListItemIcon,
	ListItemText,
	Tooltip,
	Box,
	alpha,
	useTheme,
	type SxProps,
	type Theme
} from '@mui/material';
import { MoreVert as MoreVertIcon } from '@mui/icons-material';

export interface ActionMenuItem {
	label: string;
	icon: React.ReactNode;
	onClick: () => void;
	color?: string;
	divider?: boolean;
	disabled?: boolean;
	/** Shown on hover when disabled, explaining why the action is unavailable. */
	tooltip?: string;
}

interface ContextMenuProps {
	actions: ActionMenuItem[];
	icon?: React.ReactNode;
	size?: 'small' | 'medium' | 'large';
	minWidth?: number;
	buttonSx?: SxProps<Theme>;
	/** Tooltip shown on hover over the trigger button itself (e.g. "Actions"). */
	triggerTooltip?: string;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
	actions,
	icon,
	size = 'small',
	minWidth = 240,
	buttonSx,
	triggerTooltip
}) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

	const triggerButton = (
		<IconButton
			size={size}
			onClick={(e) => {
				e.stopPropagation();
				setAnchorEl(e.currentTarget);
			}}
			sx={{
				bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
				'&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' },
				...buttonSx
			}}
		>
			{icon || <MoreVertIcon sx={{ fontSize: 20 }} />}
		</IconButton>
	);

	return (
		<>
			{triggerTooltip ? <Tooltip title={triggerTooltip}>{triggerButton}</Tooltip> : triggerButton}

			<Menu
				anchorEl={anchorEl}
				open={Boolean(anchorEl)}
				onClose={() => setAnchorEl(null)}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
				transformOrigin={{ vertical: 'top', horizontal: 'right' }}
				slotProps={{
					paper: {
						elevation: 0,
						sx: {
							minWidth,
							p: 0.75,
							mt: 1,
							borderRadius: 3,
							border: '1px solid',
							borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
							bgcolor: isDark ? 'rgba(28, 32, 42, 0.98)' : alpha(theme.palette.background.paper, 0.98),
							backdropFilter: 'blur(16px)',
							boxShadow: isDark
								? '0 16px 40px rgba(0, 0, 0, 0.55), 0 2px 8px rgba(0,0,0,0.4)'
								: '0 16px 40px rgba(15, 23, 42, 0.12), 0 2px 8px rgba(15,23,42,0.06)'
						}
					}
				}}
			>
				{actions.flatMap((action, index) => {
					const color = action.color || theme.palette.text.secondary;
					const item = (
						<MenuItem
							key={`item-${index}`}
							onClick={() => {
								if (action.disabled) return;
								action.onClick();
								setAnchorEl(null);
							}}
							disableRipple={action.disabled}
							sx={{
								borderRadius: 2,
								py: 1,
								px: 1.25,
								gap: 1.25,
								mb: index < actions.length - 1 ? 0.25 : 0,
								cursor: action.disabled ? 'not-allowed' : 'pointer',
								opacity: action.disabled ? 0.5 : 1,
								transition: 'background-color 0.15s ease',
								'&:hover': action.disabled ? { bgcolor: 'transparent' } : {
									bgcolor: alpha(color, 0.08)
								}
							}}
						>
							<ListItemIcon
								sx={{
									minWidth: '32px !important',
									width: 32,
									height: 32,
									borderRadius: '10px',
									bgcolor: alpha(color, 0.12),
									color,
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center'
								}}
							>
								{action.icon}
							</ListItemIcon>
							<ListItemText
								primary={action.label}
								slotProps={{
									primary: {
										sx: { fontSize: '0.85rem', fontWeight: 600, color: action.disabled ? 'text.secondary' : 'text.primary' }
									}
								}}
							/>
						</MenuItem>
					);

					const renderedItem = action.disabled && action.tooltip ? (
						<Tooltip key={`tooltip-${index}`} title={action.tooltip} placement="left" arrow>
							<span>{item}</span>
						</Tooltip>
					) : item;

					if (action.divider) {
						return [
							<Box 
								key={`divider-${index}`} 
								sx={{ my: 0.5, mx: 1, borderTop: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }} 
							/>,
							renderedItem
						];
					}

					return [renderedItem];
				})}
			</Menu>
		</>
	);
};

export default ContextMenu;
