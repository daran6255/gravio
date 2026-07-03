import React from 'react';
import { Box, Button, Link } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const AuthNavbar: React.FC = () => {
	const navigate = useNavigate();

	return (
		<Box
			component="header"
			sx={{
				position: 'fixed',
				top: 0,
				left: 0,
				right: 0,
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'space-between',
				py: 2,
				px: { xs: 3, md: 6 },
				borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
				bgcolor: '#08090d',
				zIndex: 1000,
			}}
		>
			<Box
				component="img"
				src="/assets/img/logo/gravit-dark.svg"
				alt="Gravit Logo"
				sx={{ height: 48, cursor: 'pointer' }}
				onClick={() => navigate('/')}
			/>
			
			{/* Desktop Center Navigation Links */}
			<Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 4 }}>
				{['Solutions', 'Documentation', 'Support'].map((link) => (
					<Link
						key={link}
						href="#"
						underline="none"
						sx={{
							color: '#94A3B8',
							fontSize: '0.875rem',
							fontWeight: 500,
							'&:hover': { color: '#F4F5F7' },
							transition: 'color 0.2s',
						}}
					>
						{link}
					</Link>
				))}
			</Box>

			{/* Right Authentication Buttons */}
			<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
				<Button
					variant="text"
					onClick={() => navigate('/auth/login')}
					sx={{
						color: '#F4F5F7',
						fontSize: '0.875rem',
						fontWeight: 600,
						textTransform: 'none',
						'&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.03)' },
					}}
				>
					Sign In
				</Button>
				<Button
					variant="contained"
					onClick={() => navigate('/auth/register')}
					sx={{
						backgroundColor: '#8B7CF6',
						color: '#ffffff',
						fontSize: '0.875rem',
						fontWeight: 600,
						px: 2.5,
						py: 1,
						borderRadius: 1.5,
						textTransform: 'none',
						boxShadow: '0 4px 12px rgba(139, 124, 246, 0.25)',
						'&:hover': {
							backgroundColor: '#7a6ae6',
							boxShadow: '0 6px 16px rgba(139, 124, 246, 0.35)',
						},
					}}
				>
					Get Started
				</Button>
			</Box>
		</Box>
	);
};

export default AuthNavbar;
