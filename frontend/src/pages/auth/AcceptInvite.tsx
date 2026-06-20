import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
	Container,
	Box,
	Typography,
	Button,
	CircularProgress,
	Paper,
	TextField,
	IconButton,
	InputAdornment,
	useTheme,
	Fade,
} from '@mui/material';
import {
	CheckCircleOutline as CheckCircleIcon,
	ErrorOutline as ErrorIcon,
	LockOutlined as LockIcon,
	Visibility,
	VisibilityOff,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { acceptInvite } from '../../store/slices/authSlice';
import { useColorMode } from '../../theme/ThemeContext';

const AcceptInvite: React.FC = () => {
	const theme = useTheme();
	const navigate = useNavigate();
	const dispatch = useAppDispatch();
	const { mode } = useColorMode();
	const [searchParams] = useSearchParams();
	const token = searchParams.get('token');
	const { loading, error } = useAppSelector((state) => state.auth);

	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [status, setStatus] = useState<'form' | 'success' | 'error'>(token ? 'form' : 'error');
	const [formError, setFormError] = useState<string | null>(null);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setFormError(null);

		if (!token) return;

		if (password !== confirmPassword) {
			setFormError("Passwords don't match.");
			return;
		}

		try {
			await dispatch(acceptInvite({ token, newPassword: password })).unwrap();
			setStatus('success');
			setTimeout(() => navigate('/dashboard'), 1500);
		} catch {
			setStatus('error');
		}
	};

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
						sx={{ height: 48, mb: 1.5 }}
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
									status === 'form'
										? theme.palette.primary.main
										: status === 'success'
										? theme.palette.success.main
										: theme.palette.error.main,
							},
						}}
					>
						{status === 'form' && (
							<Box sx={{ width: '100%' }}>
								<Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.secondary.main, mb: 1 }}>
									Set Your Password
								</Typography>
								<Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
									You've been invited to join Gravit. Choose a password to activate your account.
								</Typography>

								{(formError || error) && (
									<Box
										role="alert"
										sx={{
											mb: 2,
											p: 1.5,
											bgcolor: 'rgba(239, 68, 68, 0.1)',
											color: theme.palette.error.main,
											borderRadius: 1,
											border: `1px solid ${theme.palette.error.main}33`,
											fontSize: '0.875rem',
											textAlign: 'left',
										}}
									>
										{formError || (typeof error === 'string' ? error : 'Failed to accept invite.')}
									</Box>
								)}

								<Box component="form" onSubmit={handleSubmit} sx={{ textAlign: 'left' }}>
									<TextField
										required
										fullWidth
										type={showPassword ? 'text' : 'password'}
										label="New Password"
										size="small"
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										helperText="Min. 8 characters with an uppercase letter, number, and special character."
										sx={{ mb: 2 }}
										InputProps={{
											startAdornment: (
												<InputAdornment position="start">
													<LockIcon sx={{ fontSize: 18 }} />
												</InputAdornment>
											),
											endAdornment: (
												<InputAdornment position="end">
													<IconButton
														aria-label={showPassword ? 'hide password' : 'show password'}
														onClick={() => setShowPassword((p) => !p)}
														edge="end"
														size="small"
													>
														{showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
													</IconButton>
												</InputAdornment>
											),
										}}
									/>
									<TextField
										required
										fullWidth
										type={showPassword ? 'text' : 'password'}
										label="Confirm Password"
										size="small"
										value={confirmPassword}
										onChange={(e) => setConfirmPassword(e.target.value)}
										sx={{ mb: 3 }}
										InputProps={{
											startAdornment: (
												<InputAdornment position="start">
													<LockIcon sx={{ fontSize: 18 }} />
												</InputAdornment>
											),
										}}
									/>
									<Button
										type="submit"
										variant="contained"
										fullWidth
										disabled={loading || !token}
										sx={{
											py: 1.25,
											backgroundColor: theme.palette.primary.main,
											'&:hover': { backgroundColor: theme.palette.primary.dark },
											textTransform: 'none',
											fontWeight: 700,
											borderRadius: 1,
										}}
									>
										{loading ? <CircularProgress size={24} color="inherit" /> : 'Activate Account'}
									</Button>
								</Box>
							</Box>
						)}

						{status === 'success' && (
							<Box>
								<CheckCircleIcon sx={{ fontSize: 72, color: theme.palette.success.main, mb: 2 }} />
								<Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.secondary.main, mb: 2 }}>
									Account Activated!
								</Typography>
								<Typography variant="body1" color="text.secondary">
									Redirecting you to your dashboard...
								</Typography>
							</Box>
						)}

						{status === 'error' && (
							<Box>
								<ErrorIcon sx={{ fontSize: 72, color: theme.palette.error.main, mb: 2 }} />
								<Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.secondary.main, mb: 2 }}>
									Invite Link Invalid
								</Typography>
								<Typography variant="body1" color="text.secondary" sx={{ mb: 4, px: 2 }}>
									{!token
										? 'This invite link is missing its token. Please use the link from your invite email.'
										: typeof error === 'string'
										? error
										: 'This invite link is invalid or has expired. Please ask for a new invite.'}
								</Typography>
								<Button
									variant="contained"
									fullWidth
									onClick={() => navigate('/login')}
									sx={{
										py: 1.25,
										backgroundColor: theme.palette.primary.main,
										'&:hover': { backgroundColor: theme.palette.primary.dark },
										textTransform: 'none',
										fontWeight: 700,
										borderRadius: 1,
									}}
								>
									Back to Login
								</Button>
							</Box>
						)}
					</Paper>
				</Fade>
			</Container>
		</Box>
	);
};

export default AcceptInvite;
