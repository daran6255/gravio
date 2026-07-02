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

	// Enterprise color palette (consistent with AWS/Cloudscape outcomes)
	const colors = [
		theme.palette.primary.main,
		theme.palette.secondary.main,
		'#4EA8FF', // Gravit Sky Blue
		'#6c5ce7', // Purple
		'#0f172a', // Slate Dark
		'#10b981', // Success Green
		'#ef4444', // Error Red
		'#64748b', // Slate Gray
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
