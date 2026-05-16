import React from 'react';
import { Box, Typography, Link } from '@mui/material';

const Footer: React.FC = () => {
	return (
		<Box
			component="footer"
			sx={{
				py: 2.5,
				mt: 'auto',
				backgroundColor: (theme) => theme.palette.background.default,
				borderTop: (theme) => `1px solid ${theme.palette.divider}`,
				textAlign: 'center',
				transition: (theme) => theme.transitions.create(['background-color', 'border-color']),
			}}
		>
			<Typography
				variant="body2"
				sx={{
					color: 'text.secondary',
					fontWeight: 500,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					gap: 0.5,
					letterSpacing: '0.01em',
					fontSize: '0.8125rem'
				}}
			>
				<span>Copyright © {new Date().getFullYear()}</span>
				<Link
					href="https://winvinaya.com/"
					target="_blank"
					rel="noopener noreferrer"
					sx={{
						color: (theme) => theme.palette.secondary.main,
						textDecoration: 'none',
						fontWeight: 500,
						'&:hover': {
							color: (theme) => theme.palette.accent.main,
							textDecoration: 'underline'
						}
					}}
				>
					WinVinaya InfoSystems
				</Link>
				<span>. All rights reserved.</span>
			</Typography>
		</Box>
	);
};

export default Footer;
