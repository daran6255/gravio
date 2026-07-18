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
			sx={(theme) => ({
				borderTop: `1px solid ${theme.layout.authPanel.divider}`,
				px: { xs: 4, sm: 6, md: 7 },
				py: 2.5,
				display: 'flex',
				flexWrap: 'wrap',
				alignItems: 'center',
				justifyContent: 'center',
				gap: { xs: 2, sm: 3 },
			})}
		>
			{items.map((item) => (
				<Link
					key={item.label}
					component={item.to ? RouterLink : 'a'}
					to={item.to}
					href={item.href}
					underline="none"
					sx={(theme) => ({
						color: theme.layout.authPanel.textSubtle,
						...theme.typography.footerLink,
						'&:hover': { color: theme.layout.authPanel.textMuted },
						transition: 'color 0.2s',
					})}
				>
					{item.label}
				</Link>
			))}
		</Box>
	);
};

export default AuthRightFooter;
