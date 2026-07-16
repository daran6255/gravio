import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
	Container,
	Box,
	Typography,
	Button,
	CircularProgress,
	Fade,
} from '@mui/material';
import {
	CheckCircleOutline as CheckCircleIcon,
	ErrorOutline as ErrorIcon,
} from '@mui/icons-material';
import authService from '../../../services/authService';

const VerifyEmail: React.FC = () => {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const token = searchParams.get('token');

	const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
	const [message, setMessage] = useState<string>('Verifying your email address...');

	useEffect(() => {
		const verify = async () => {
			if (!token) {
				setStatus('error');
				setMessage('Verification token is missing. Please verify the URL link from your email.');
				return;
			}

			try {
				const response = await authService.verifyEmail(token);
				setStatus('success');
				setMessage(response.message || 'Your email address has been verified successfully!');
			} catch (error) {
				setStatus('error');
				const err = error as { response?: { data?: { detail?: string; error?: { message?: string } } } };
				setMessage(
					err.response?.data?.error?.message ||
					err.response?.data?.detail ||
					'Verification failed. The token may be invalid or expired. Tokens are valid for 24 hours.'
				);
			}
		};

		verify();
	}, [token]);

	const accentColor = status === 'loading' ? '#8B7CF6' : status === 'success' ? '#10b981' : '#ef4444';

	return (
		<Box
			component="main"
			sx={{
				minHeight: '100vh',
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center',
				backgroundColor: '#08090d',
				color: '#F4F5F7',
				position: 'relative',
				overflow: 'hidden',
			}}
		>
			<Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
				<Box sx={{ mb: 4, textAlign: 'center' }}>
					<Box
						component="img"
						src="/assets/img/logo/gravit-dark.svg"
						alt="Gravit"
						sx={{ height: 80, cursor: 'pointer' }}
						onClick={() => navigate('/')}
					/>
				</Box>

				<Fade in={true} timeout={600}>
					<Box
						sx={{
							p: { xs: 4, sm: 6 },
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							borderRadius: 3,
							backgroundColor: '#12141f',
							border: '1px solid rgba(255, 255, 255, 0.08)',
							boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
							textAlign: 'center',
							position: 'relative',
							overflow: 'hidden',
							'&::before': {
								content: '""',
								position: 'absolute',
								top: 0,
								left: 0,
								right: 0,
								height: 4,
								backgroundColor: accentColor,
							},
						}}
					>
						{status === 'loading' && (
							<Box sx={{ py: 4 }}>
								<CircularProgress size={64} thickness={4} sx={{ color: '#8B7CF6', mb: 3 }} />
								<Typography variant="h6" sx={{ fontWeight: 600, color: '#F4F5F7' }}>
									Verifying Account
								</Typography>
								<Typography variant="body2" sx={{ color: '#94A3B8', mt: 1 }}>
									Please wait while we validate your activation token...
								</Typography>
							</Box>
						)}

						{status === 'success' && (
							<Box>
								<CheckCircleIcon sx={{ fontSize: 72, color: '#10b981', mb: 2 }} />
								<Typography variant="h5" sx={{ fontWeight: 700, color: '#F4F5F7', mb: 2 }}>
									Email Verified!
								</Typography>
								<Typography variant="body1" sx={{ color: '#94A3B8', mb: 4, px: 2 }}>
									{message}
								</Typography>
								<Button
									variant="contained"
									fullWidth
									onClick={() => navigate('/auth/login')}
									sx={{
										py: 1.25,
										backgroundColor: '#8B7CF6',
										color: '#ffffff',
										'&:hover': {
											backgroundColor: '#7a6ae6',
											boxShadow: '0 4px 12px rgba(139, 124, 246, 0.3)',
										},
										textTransform: 'none',
										fontWeight: 700,
										borderRadius: 1.5,
									}}
								>
									Proceed to Sign In
								</Button>
							</Box>
						)}

						{status === 'error' && (
							<Box>
								<ErrorIcon sx={{ fontSize: 72, color: '#ef4444', mb: 2 }} />
								<Typography variant="h5" sx={{ fontWeight: 700, color: '#F4F5F7', mb: 2 }}>
									Verification Failed
								</Typography>
								<Typography variant="body1" sx={{ color: '#94A3B8', mb: 4, px: 2 }}>
									{message}
								</Typography>
								<Button
									variant="contained"
									fullWidth
									onClick={() => navigate('/auth/login')}
									sx={{
										py: 1.25,
										backgroundColor: '#8B7CF6',
										color: '#ffffff',
										'&:hover': {
											backgroundColor: '#7a6ae6',
											boxShadow: '0 4px 12px rgba(139, 124, 246, 0.3)',
										},
										textTransform: 'none',
										fontWeight: 700,
										borderRadius: 1.5,
									}}
								>
									Back to Login
								</Button>
							</Box>
						)}
					</Box>
				</Fade>
			</Container>
		</Box>
	);
};

export default VerifyEmail;
