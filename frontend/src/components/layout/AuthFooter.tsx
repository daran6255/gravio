import React from 'react';
import { Box, Typography, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const AuthFooter: React.FC = () => {
	return (
		<Box
			component="footer"
			sx={{
				position: { xs: 'static', md: 'fixed' },
				bottom: { xs: 'auto', md: 0 },
				left: { xs: 'auto', md: 0 },
				right: { xs: 'auto', md: 0 },
				display: 'flex',
				flexDirection: { xs: 'column', md: 'row' },
				alignItems: 'center',
				justifyContent: 'space-between',
				py: { xs: 2, md: 3 },
				px: { xs: 3, md: 6 },
				borderTop: '1px solid rgba(255, 255, 255, 0.05)',
				bgcolor: '#08090d',
				gap: { xs: 1.5, md: 2 },
				zIndex: 1000,
				mt: { xs: 2, md: 0 },
			}}
		>
			<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
				<Box
					component="img"
					src="/assets/img/logo/gravit-dark.svg"
					alt="Gravit Logo"
					sx={{ height: 28 }}
				/>
				<Typography variant="caption" sx={{ color: '#94A3B8', opacity: 0.8 }}>
					© {new Date().getFullYear()} Gravit Inc. All rights reserved.
				</Typography>
			</Box>
			
			<Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'center' }}>
				{['Terms of Service', 'Privacy Policy', 'Cookie Settings', 'Security'].map((item) => (
					<Link
						key={item}
						component={item === 'Terms of Service' || item === 'Privacy Policy' ? RouterLink : 'a'}
						to={item === 'Terms of Service' ? '/terms' : item === 'Privacy Policy' ? '/privacy-policy' : undefined}
						href={item !== 'Terms of Service' && item !== 'Privacy Policy' ? '#' : undefined}
						underline="none"
						sx={{
							color: '#94A3B8',
							fontSize: '0.75rem',
							fontWeight: 500,
							'&:hover': { color: '#F4F5F7' },
							transition: 'color 0.2s',
						}}
					>
						{item}
					</Link>
				))}
			</Box>
		</Box>
	);
};

export default AuthFooter;
