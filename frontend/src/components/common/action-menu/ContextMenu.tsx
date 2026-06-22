import React, { useState } from 'react';
import { IconButton, useTheme, type SxProps, type Theme } from '@mui/material';
import { MoreVert as MoreVertIcon } from '@mui/icons-material';
import ActionMenu, { type ActionMenuItem } from './ActionMenu';

interface ContextMenuProps {
	actions: ActionMenuItem[];
	icon?: React.ReactNode;
	size?: 'small' | 'medium' | 'large';
	minWidth?: number;
	buttonSx?: SxProps<Theme>;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
	actions,
	icon,
	size = 'small',
	minWidth,
	buttonSx
}) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

	return (
		<>
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
			<ActionMenu
				anchorEl={anchorEl}
				open={Boolean(anchorEl)}
				onClose={() => setAnchorEl(null)}
				actions={actions}
				minWidth={minWidth}
			/>
		</>
	);
};

export default ContextMenu;
