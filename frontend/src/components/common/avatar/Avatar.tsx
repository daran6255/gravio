import React from 'react';
import { Avatar as MuiAvatar, type AvatarProps as MuiAvatarProps, useTheme } from '@mui/material';

interface EnterpriseAvatarProps extends MuiAvatarProps {
	name: string;
	size?: number;
}

/**
 * EnterpriseAvatar Component
 * A professional, character-based avatar that generates consistent colors from names.
 * Optimized for enterprise consoles with a clean, semi-square aesthetic.
 */
const EnterpriseAvatar: React.FC<EnterpriseAvatarProps> = ({ name, size = 40, sx, ...props }) => {
	const theme = useTheme();

	// Enterprise color palette (high-contrast vibrant colors suitable for both light & dark modes)
	const colors = [
		theme.palette.primary.main,
		theme.palette.secondary.main,
		'#3b82f6', // Bright Blue
		'#7c3aed', // Violet Purple
		'#0d9488', // Vibrant Teal
		'#16a34a', // Forest Green
		'#d97706', // Amber Orange
		'#e11d48', // Crimson Rose
	];

	const stringToColor = (str: string) => {
		let hash = 0;
		for (let i = 0; i < str.length; i++) {
			hash = str.charCodeAt(i) + ((hash << 5) - hash);
		}
		const index = Math.abs(hash) % colors.length;
		return colors[index];
	};

	const getInitials = (str: string) => {
		return str
			.split(' ')
			.map((n) => n[0])
			.slice(0, 2)
			.join('')
			.toUpperCase();
	};

	const color = stringToColor(name);

	return (
		<MuiAvatar
			{...props}
			sx={{
				bgcolor: color,
				// MUI's Avatar only auto-contrasts text against its *default* background —
				// once we override bgcolor via sx, the text color must be computed explicitly,
				// otherwise it falls back to theme.palette.background.default (dark in dark
				// mode), making initials unreadable against these fixed palette colors.
				color: theme.palette.getContrastText(color),
				width: size,
				height: size,
				fontSize: `${size * 0.4}px`,
				fontWeight: 700,
				borderRadius: '4px', // Enterprise precision
				border: `1px solid ${theme.palette.divider}`,
				...sx
			}}
		>
			{getInitials(name)}
		</MuiAvatar>
	);
};

export default EnterpriseAvatar;
