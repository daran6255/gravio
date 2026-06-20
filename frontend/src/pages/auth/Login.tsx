import React, { useEffect } from 'react';
import {
	Box,
	Typography,
	Fade,
	Button,
	Link,
	Paper,
} from '@mui/material';
import { HelpOutline as HelpOutlineIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import useToast from '../../hooks/useToast';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { loginUser, clearError } from '../../store/slices/authSlice';
import LoginForm from '../../components/auth/LoginForm';

const Login: React.FC = () => {
	const dispatch = useAppDispatch();
	const navigate = useNavigate();
	const toast = useToast();
	const { loading, error, isAuthenticated, isInitialized } = useAppSelector((state) => state.auth);

	useEffect(() => {
		// Only redirect if auth is initialized and user is authenticated
		if (isInitialized && isAuthenticated) {
			navigate('/dashboard');
		}
	}, [isAuthenticated, isInitialized, navigate]);

	useEffect(() => {
		if (error) {
			toast.error(typeof error === 'string' ? error : 'Login failed');
			const timer = setTimeout(() => {
				dispatch(clearError());
			}, 5000);
			return () => clearTimeout(timer);
		}
	}, [error, toast, dispatch]);

	const handleLogin = async (email: string, password: string) => {
		try {
			await dispatch(loginUser({ email, password })).unwrap();
			toast.success('Login successful');
		} catch (err) {
			console.error('Login failed', err);
		}
	};

	return (
		<Box
			component="main"
			sx={{
				minHeight: '100vh',
				display: 'flex',
				flexDirection: 'column',
				backgroundColor: '#08090d',
				color: '#F4F5F7',
				position: 'relative',
				overflow: 'hidden',
			}}
		>
			{/* Top Navigation Bar */}
			<Box
				component="header"
				sx={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					py: 2,
					px: { xs: 3, md: 6 },
					borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
					bgcolor: '#08090d',
					zIndex: 10,
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
						onClick={() => navigate('/login')}
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
						onClick={() => navigate('/register')}
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

			{/* Main Content Area */}
			<Box
				sx={{
					flex: 1,
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					justifyContent: 'center',
					position: 'relative',
					py: { xs: 4, md: 6 },
					px: 2,
					zIndex: 5,
				}}
			>
				<Fade in={true} timeout={1000}>
					<Box sx={{ width: '100%', maxWidth: 440 }}>
						<LoginForm
							loading={loading}
							error={typeof error === 'string' ? error : null}
							onLogin={handleLogin}
						/>
					</Box>
				</Fade>

				{/* 24/7 Enterprise Help Widget (desktop: absolute bottom-right, mobile: flow below card) */}
				<Box
					sx={{
						position: { xs: 'static', md: 'absolute' },
						bottom: 24,
						right: 24,
						maxWidth: 320,
						width: '100%',
						mt: { xs: 4, md: 0 },
					}}
				>
					<Paper
						elevation={0}
						sx={{
							p: 2,
							display: 'flex',
							alignItems: 'flex-start',
							gap: 1.5,
							bgcolor: '#11141e',
							border: '1px solid rgba(255, 255, 255, 0.05)',
							borderRadius: 2,
						}}
					>
						<Box
							sx={{
								bgcolor: 'rgba(139, 124, 246, 0.1)',
								p: 1,
								borderRadius: 1,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
							}}
						>
							<HelpOutlineIcon sx={{ color: '#8B7CF6', fontSize: 20 }} />
						</Box>
						<Box>
							<Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#F4F5F7' }}>
								Need help?
							</Typography>
							<Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', mt: 0.5, lineHeight: 1.4 }}>
								Our enterprise support team is available 24/7 for account assistance.
							</Typography>
						</Box>
					</Paper>
				</Box>
			</Box>

			{/* Footer */}
			<Box
				component="footer"
				sx={{
					display: 'flex',
					flexDirection: { xs: 'column', md: 'row' },
					alignItems: 'center',
					justifyContent: 'space-between',
					py: 3,
					px: { xs: 3, md: 6 },
					borderTop: '1px solid rgba(255, 255, 255, 0.05)',
					bgcolor: '#08090d',
					gap: 2,
					zIndex: 10,
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
							href={item === 'Terms of Service' ? '/terms' : item === 'Privacy Policy' ? '/privacy-policy' : '#'}
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
		</Box>
	);
};

export default Login;
