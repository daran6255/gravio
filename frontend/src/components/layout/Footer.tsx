import React from 'react';
import { Box, Typography, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const Footer: React.FC = () => {
	return (
		<Box
			component="footer"
			sx={{
				pt: 1,
				pb: 1,
				px: { xs: 2, sm: 3 },
				mt: 'auto',
				backgroundColor: (theme) => theme.palette.background.default,
				borderTop: (theme) => `1px solid ${theme.palette.divider}`,
				display: 'flex',
				flexDirection: { xs: 'column', md: 'row' },
				alignItems: 'center',
				justifyContent: 'space-between',
				gap: 1.5,
				transition: (theme) => theme.transitions.create(['background-color', 'border-color']),
			}}
		>
			<Typography
				variant="body2"
				sx={(theme) => ({
					color: 'text.secondary',
					...theme.typography.footerLink,
					letterSpacing: '0.01em',
				})}
			>
				Copyright © {new Date().getFullYear()}{' '}
				<Link
					href="https://gravit.taydens.com/"
					target="_blank"
					rel="noopener noreferrer"
					sx={{
						color: (theme) => theme.palette.primary.main,
						textDecoration: 'none',
						fontWeight: 600,
						display: 'inline',
						'&:hover': {
							color: (theme) => theme.palette.accent.main,
							textDecoration: 'underline'
						}
					}}
				>Gravit</Link>
				. All rights reserved.
			</Typography>

			<Box sx={{ display: 'flex', gap: { xs: 2, sm: 3 }, flexWrap: 'wrap', justifyContent: 'center' }}>
				{['Terms of Service', 'Privacy Policy', 'Cookie Settings', 'Security'].map((item) => (
					<Link
						key={item}
						component={item === 'Terms of Service' || item === 'Privacy Policy' ? RouterLink : 'a'}
						to={item === 'Terms of Service' ? '/terms' : item === 'Privacy Policy' ? '/privacy-policy' : undefined}
						href={item !== 'Terms of Service' && item !== 'Privacy Policy' ? '#' : undefined}
						underline="none"
						sx={(theme) => ({
							color: 'text.secondary',
							...theme.typography.footerLink,
							'&:hover': { color: theme.palette.primary.main },
							transition: 'color 0.2s',
						})}
					>
						{item}
					</Link>
				))}
			</Box>
		</Box>
	);
};

export default Footer;
