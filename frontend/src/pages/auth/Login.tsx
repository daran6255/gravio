import React, { useEffect } from 'react';
import {
	Box,
	Fade,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import useToast from '../../hooks/useToast';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { loginUser, clearError } from '../../store/slices/authSlice';
import LoginForm from '../../components/auth/LoginForm';
import AuthBrandPanel from '../../components/layout/AuthBrandPanel';
import AuthRightFooter from '../../components/layout/AuthRightFooter';

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

	const handleLogin = async (identifier: string, password: string) => {
		try {
			await dispatch(loginUser({ identifier, password })).unwrap();
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
			}}
		>
			{/* Main Content Area: a single split card — brand panel (left) + form (right) */}
			<Box
				sx={{
					flex: 1,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					px: { xs: 2, md: 4 },
					py: { xs: 4, md: 6 },
				}}
			>
				<Fade in={true} timeout={600}>
					<Box
						sx={{
							position: 'relative',
							display: 'flex',
							flexDirection: { xs: 'column', md: 'row' },
							width: '100%',
							maxWidth: 1080,
							minHeight: { md: 620 },
							borderRadius: 4,
							overflow: 'hidden',
							border: '1px solid rgba(255, 255, 255, 0.07)',
							boxShadow: '0 30px 80px -20px rgba(0, 0, 0, 0.55)',
							bgcolor: '#0d0f18',
						}}
					>
						<AuthBrandPanel />

						<Box
							sx={{
								flex: { md: '0 0 50%' },
								display: 'flex',
								flexDirection: 'column',
							}}
						>
							<Box
								sx={{
									flex: 1,
									display: 'flex',
									flexDirection: 'column',
									alignItems: 'center',
									justifyContent: 'center',
									px: { xs: 4, sm: 6, md: 7 },
									py: { xs: 6, md: 5 },
								}}
							>
								<Box sx={{ width: '100%', maxWidth: 380 }}>
									{/* Logo shown here only on mobile, where the brand panel is hidden */}
									<Box
										component="img"
										src="/assets/img/logo/gravit-dark.svg"
										alt="Gravit"
										sx={{ display: { xs: 'block', md: 'none' }, height: 36, mx: 'auto', mb: 4 }}
									/>

									<LoginForm
										loading={loading}
										error={typeof error === 'string' ? error : null}
										onLogin={handleLogin}
									/>
								</Box>
							</Box>

							<AuthRightFooter />
						</Box>
					</Box>
				</Fade>
			</Box>
		</Box>
	);
};

export default Login;
