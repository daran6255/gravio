import React from 'react';
import { Button, useTheme } from '@mui/material';

interface MetaPillProps {
	icon: React.ReactNode;
	label: string;
	onClick: (event: React.MouseEvent<HTMLElement>) => void;
	active?: boolean;
}

/** A compact, chip-style button used to open a picker popover -- mirrors the
 * "Assignee / Label / Priority" pill row pattern from GitHub's issue form. */
export const MetaPill: React.FC<MetaPillProps> = ({ icon, label, onClick, active }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';

	return (
		<Button
			onClick={onClick}
			startIcon={icon}
			size="small"
			sx={{
				textTransform: 'none',
				fontWeight: 600,
				fontSize: '0.8rem',
				borderRadius: '999px',
				px: 1.5,
				py: 0.5,
				color: active ? 'primary.main' : 'text.secondary',
				bgcolor: active
					? (isDark ? 'rgba(139,124,246,0.12)' : 'rgba(139,124,246,0.08)')
					: (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'),
				border: '1px solid',
				borderColor: active ? 'primary.main' : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'),
				'&:hover': {
					bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
				},
			}}
		>
			{label}
		</Button>
	);
};

export default MetaPill;
