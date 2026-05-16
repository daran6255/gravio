import React from 'react';
import { Avatar } from '@mui/material';

interface PlacementAvatarProps {
	name: string;
	size?: number;
	src?: string;
}

const getRandomColor = (name: string) => {
	const colors = ['#007eb9', '#d13212', '#1d8102', '#ff9900', '#545b64'];
	let hash = 0;
	for (let i = 0; i < name.length; i++) {
		hash = name.charCodeAt(i) + ((hash << 5) - hash);
	}
	return colors[Math.abs(hash) % colors.length];
};

const PlacementAvatar: React.FC<PlacementAvatarProps> = ({ name, size = 32, src }) => {
	const initials = name
		.split(' ')
		.map((n) => n[0])
		.join('')
		.toUpperCase()
		.substring(0, 2);

	return (
		<Avatar
			src={src}
			sx={{
				width: size,
				height: size,
				fontSize: size * 0.45,
				fontWeight: 700,
				bgcolor: src ? 'transparent' : getRandomColor(name),
				color: '#ffffff',
				border: '1px solid rgba(0,0,0,0.05)'
			}}
		>
			{initials}
		</Avatar>
	);
};

export default PlacementAvatar;
