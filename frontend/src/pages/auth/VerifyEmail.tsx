import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
	Container,
	Box,
	Typography,
	Button,
	CircularProgress,
	Paper,
	useTheme,
	Fade,
} from '@mui/material';
import {
	CheckCircleOutline as CheckCircleIcon,
	ErrorOutline as ErrorIcon,
} from '@mui/icons-material';
import authService from '../../services/authService';
import { useColorMode } from '../../theme/ThemeContext';

const VerifyEmail: React.FC = () => {
	const theme = useTheme();
	const navigate = useNavigate();
	const { mode } = useColorMode();
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
				const err = error as { response?: { data?: { detail?: string } } };
				setMessage(
					err.response?.data?.detail ||
					'Verification failed. The token may be invalid or expired. Tokens are valid for 24 hours.'
				);
			}
		};

		verify();
	}, [token]);

	return (
		<Box
			component="main"
			sx={{
				minHeight: '100vh',
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center',
				backgroundColor: theme.palette.background.default,
				backgroundImage: `radial-gradient(circle at 50% 50%, ${theme.palette.background.default} 0%, ${theme.palette.secondary.dark}20 100%)`,
				position: 'relative',
				overflow: 'hidden',
			}}
		>
			<Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
				<Box sx={{ mb: 4, textAlign: 'center' }}>
					<Box
						component="img"
						src={mode === 'dark' ? '/assets/img/logo/gravit-dark.svg' : '/assets/img/logo/gravit-light.svg'}
						alt="Gravit Logo"
						sx={{
							height: 48,
							mb: 1.5,
						}}
					/>
				</Box>

				<Fade in={true} timeout={600}>
					<Paper
						elevation={1}
						sx={{
							p: { xs: 4, sm: 6 },
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							borderRadius: 2,
							backgroundColor: theme.palette.background.paper,
							border: `1px solid ${theme.palette.divider}`,
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
								backgroundColor:
									status === 'loading'
										? theme.palette.primary.main
										: status === 'success'
										? theme.palette.success.main
										: theme.palette.error.main,
							},
						}}
					>
						{status === 'loading' && (
							<Box sx={{ py: 4 }}>
								<CircularProgress size={64} thickness={4} sx={{ color: theme.palette.primary.main, mb: 3 }} />
								<Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.secondary.main }}>
									Verifying Account
								</Typography>
								<Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
									Please wait while we validate your activation token...
								</Typography>
							</Box>
						)}

						{status === 'success' && (
							<Box>
								<CheckCircleIcon sx={{ fontSize: 72, color: theme.palette.success.main, mb: 2 }} />
								<Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.secondary.main, mb: 2 }}>
									Email Verified!
								</Typography>
								<Typography variant="body1" color="text.secondary" sx={{ mb: 4, px: 2 }}>
									{message}
								</Typography>
								<Button
									variant="contained"
									fullWidth
									onClick={() => navigate('/login')}
									sx={{
										py: 1.25,
										backgroundColor: theme.palette.primary.main,
										'&:hover': {
											backgroundColor: theme.palette.primary.dark,
										},
										textTransform: 'none',
										fontWeight: 700,
										borderRadius: 1,
									}}
								>
									Proceed to Sign In
								</Button>
							</Box>
						)}

						{status === 'error' && (
							<Box>
								<ErrorIcon sx={{ fontSize: 72, color: theme.palette.error.main, mb: 2 }} />
								<Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.secondary.main, mb: 2 }}>
									Verification Failed
								</Typography>
								<Typography variant="body1" color="text.secondary" sx={{ mb: 4, px: 2 }}>
									{message}
								</Typography>
								<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
									<Button
										variant="contained"
										fullWidth
										onClick={() => navigate('/login')}
										sx={{
											py: 1.25,
											backgroundColor: theme.palette.primary.main,
											'&:hover': {
												backgroundColor: theme.palette.primary.dark,
											},
											textTransform: 'none',
											fontWeight: 700,
											borderRadius: 1,
										}}
									>
										Back to Login
									</Button>
								</Box>
							</Box>
						)}
					</Paper>
				</Fade>
			</Container>
		</Box>
	);
};

export default VerifyEmail;
