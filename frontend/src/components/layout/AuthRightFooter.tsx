import React from 'react';
import { Box, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const items = [
	{ label: 'Terms of Service', to: '/terms' },
	{ label: 'Privacy Policy', to: '/privacy-policy' },
	{ label: '24/7 Support', href: '#' },
];

const AuthRightFooter: React.FC = () => {
	return (
		<Box
			sx={{
				borderTop: '1px solid rgba(255, 255, 255, 0.06)',
				px: { xs: 4, sm: 6, md: 7 },
				py: 2.5,
				display: 'flex',
				flexWrap: 'wrap',
				alignItems: 'center',
				justifyContent: 'center',
				gap: { xs: 2, sm: 3 },
			}}
		>
			{items.map((item) => (
				<Link
					key={item.label}
					component={item.to ? RouterLink : 'a'}
					to={item.to}
					href={item.href}
					underline="none"
					sx={{
						color: '#64748b',
						fontSize: '0.75rem',
						fontWeight: 500,
						'&:hover': { color: '#94A3B8' },
						transition: 'color 0.2s',
					}}
				>
					{item.label}
				</Link>
			))}
		</Box>
	);
};

export default AuthRightFooter;
