import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
	Box,
	Typography,
	Button,
	CircularProgress,
	Paper,
	TextField,
	IconButton,
	InputAdornment,
	Fade,
} from '@mui/material';
import {
	CheckCircleOutline as CheckCircleIcon,
	ErrorOutline as ErrorIcon,
	LockOutlined as LockIcon,
	Visibility,
	VisibilityOff,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { acceptInvite } from '../../../store/slices/authSlice';
import AuthNavbar from '../../../components/layout/AuthNavbar';
import AuthFooter from '../../../components/layout/AuthFooter';

const AcceptInvite: React.FC = () => {
	const navigate = useNavigate();
	const dispatch = useAppDispatch();
	const [searchParams] = useSearchParams();
	const token = searchParams.get('token');
	const { loading, error } = useAppSelector((state) => state.auth);

	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [status, setStatus] = useState<'form' | 'success' | 'error'>(token ? 'form' : 'error');
	const [formError, setFormError] = useState<string | null>(null);

	// Client-side strength check criteria
	const isMinLength = password.length >= 8;
	const hasUppercase = /[A-Z]/.test(password);
	const hasNumber = /[0-9]/.test(password);
	const hasSpecial = /[!@#$%^&*()_+={}\[\]|\\:;"'<>,.?/-]/.test(password);
	const isPasswordValid = isMinLength && hasUppercase && hasNumber && hasSpecial;
	const passwordsMatch = password === confirmPassword;

	const handleTogglePasswordVisibility = () => {
		setShowPassword((prev) => !prev);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setFormError(null);

		if (!token) return;

		if (!isPasswordValid) {
			setFormError('Password does not meet the pattern requirements.');
			return;
		}

		if (!passwordsMatch) {
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
				backgroundColor: '#08090d',
				color: '#F4F5F7',
				position: 'relative',
				overflow: 'hidden',
			}}
		>
			{/* Top Navigation Bar */}
			<AuthNavbar />

			{/* Main Content Area */}
			<Box
				sx={{
					flex: 1,
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					justifyContent: 'center',
					position: 'relative',
					pt: { xs: '100px', md: '120px' },
					pb: { xs: '140px', md: '100px' },
					px: 2,
					zIndex: 5,
					overflowY: 'auto',
				}}
			>
				<Fade in={true} timeout={1000}>
					<Box sx={{ width: '100%', maxWidth: 440 }}>
						<Paper
							elevation={0}
							sx={{
								p: { xs: 4, sm: 5 },
								display: 'flex',
								flexDirection: 'column',
								borderRadius: 2,
								backgroundColor: '#11141e',
								border: '1px solid rgba(255, 255, 255, 0.05)',
								width: '100%',
								position: 'relative',
								overflow: 'hidden',
							}}
						>
							{/* Top Centered Brand Icon Box */}
							<Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
								<Box
									sx={{
										backgroundColor: '#1c1e2b',
										p: 1.5,
										borderRadius: 2,
										display: 'flex',
										border: '1px solid rgba(139, 124, 246, 0.2)',
										boxShadow: '0 4px 12px rgba(139, 124, 246, 0.1)',
									}}
								>
									{/* Embedded SVG of Gravit G symbol mark */}
									<svg width="40" height="40" viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg">
										<defs>
											<linearGradient id="lum-card-icon" x1="0" y1="0" x2="1" y2="1">
												<stop offset="0" stopColor="#8B7CF6"/>
												<stop offset="1" stopColor="#4EA8FF"/>
											</linearGradient>
										</defs>
										<g transform="translate(90,90) scale(0.92)">
											<path d="M 36 -54 A 65 65 0 1 0 65 12 L 18 12" fill="none" stroke="url(#lum-card-icon)" strokeWidth="13" strokeLinecap="round"/>
											<circle cx="58" cy="-66" r="10" fill="#4EA8FF"/>
										</g>
									</svg>
								</Box>
							</Box>

							{/* Heading and Subheading */}
							<Box sx={{ mb: 4, textAlign: 'center' }}>
								<Typography component="h1" variant="h5" sx={{ fontWeight: 700, color: '#F4F5F7', mb: 1 }}>
									{status === 'form' ? 'Set Your Password' : status === 'success' ? 'Account Activated!' : 'Invite Link Invalid'}
								</Typography>
								<Typography variant="body2" sx={{ color: '#94A3B8', fontWeight: 500 }}>
									{status === 'form'
										? "You've been invited to join Gravit. Choose a password to activate your account."
										: status === 'success'
										? 'Redirecting you to your dashboard...'
										: 'This invite link is invalid or has expired.'}
								</Typography>
							</Box>

							{/* Error Notification Alert */}
							{(formError || error) && (
								<Box
									role="alert"
									aria-live="assertive"
									sx={{
										mb: 3,
										p: 1.5,
										bgcolor: 'rgba(239, 68, 68, 0.1)',
										color: '#ef4444',
										borderRadius: 1,
										border: '1px solid rgba(239, 68, 68, 0.2)',
										fontSize: '0.875rem',
									}}
								>
									<Typography variant="body2" sx={{ fontWeight: 500 }}>
										{formError || (typeof error === 'string' ? error : 'Failed to accept invite.')}
									</Typography>
								</Box>
							)}

							{status === 'form' && (
								<Box component="form" onSubmit={handleSubmit} noValidate>
									{/* New Password */}
									<Box sx={{ mb: 2.5 }}>
										<Typography
											sx={{
												fontSize: '0.7rem',
												fontWeight: 700,
												color: '#94A3B8',
												textTransform: 'uppercase',
												letterSpacing: '0.05em',
												mb: 1,
												display: 'block',
											}}
										>
											New Password
										</Typography>
										<TextField
											required
											fullWidth
											name="password"
											type={showPassword ? 'text' : 'password'}
											id="password"
											placeholder="••••••••"
											size="small"
											value={password}
											onChange={(e) => setPassword(e.target.value)}
											inputProps={{
												'aria-required': 'true',
											}}
											InputProps={{
												startAdornment: (
													<InputAdornment position="start">
														<LockIcon sx={{ color: '#64748b', fontSize: 18, mr: 0.5 }} />
													</InputAdornment>
												),
												endAdornment: (
													<InputAdornment position="end">
														<IconButton
															aria-label={showPassword ? 'hide password' : 'show password'}
															onClick={handleTogglePasswordVisibility}
															edge="end"
															size="small"
															title={showPassword ? 'Hide password' : 'Show password'}
															sx={{ color: '#64748b' }}
														>
															{showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
														</IconButton>
													</InputAdornment>
												),
											}}
											sx={{
												'& .MuiOutlinedInput-root': {
													bgcolor: '#191c28',
													borderRadius: 1.5,
													color: '#F4F5F7',
													border: '1px solid rgba(255, 255, 255, 0.08)',
													'& fieldset': {
														border: 'none',
													},
													'&:hover': {
														border: '1px solid rgba(255, 255, 255, 0.15)',
													},
													'&.Mui-focused': {
														border: '1px solid #8B7CF6',
														boxShadow: '0 0 0 3px rgba(139, 124, 246, 0.15)',
													},
												},
												'& input::placeholder': {
													color: '#64748b',
													opacity: 1,
												},
											}}
										/>

										{/* Interactive Password Requirements Checklist */}
										<Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
											<Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.02em', mb: 0.25 }}>
												Password Requirements:
											</Typography>
											{[
												{ label: 'Minimum 8 characters', met: isMinLength },
												{ label: 'At least one uppercase letter (A-Z)', met: hasUppercase },
												{ label: 'At least one number (0-9)', met: hasNumber },
												{ label: 'At least one special character (e.g. !@#$%)', met: hasSpecial },
											].map((req, idx) => (
												<Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
													{req.met ? (
														<CheckCircleIcon sx={{ fontSize: 16, color: '#10B981' }} />
													) : (
														<Box
															sx={{
																width: 6,
																height: 6,
																borderRadius: '50%',
																bgcolor: '#64748b',
																ml: 0.625,
																mr: 0.625,
															}}
														/>
													)}
													<Typography
														sx={{
															fontSize: '0.75rem',
															color: req.met ? '#10B981' : '#94A3B8',
															fontWeight: req.met ? 600 : 400,
															transition: 'color 0.2s',
														}}
													>
														{req.label}
													</Typography>
												</Box>
											))}
										</Box>
									</Box>

									{/* Confirm Password */}
									<Box sx={{ mb: 3.5 }}>
										<Typography
											sx={{
												fontSize: '0.7rem',
												fontWeight: 700,
												color: '#94A3B8',
												textTransform: 'uppercase',
												letterSpacing: '0.05em',
												mb: 1,
												display: 'block',
											}}
										>
											Confirm Password
										</Typography>
										<TextField
											required
											fullWidth
											name="confirmPassword"
											type={showPassword ? 'text' : 'password'}
											id="confirmPassword"
											placeholder="••••••••"
											size="small"
											value={confirmPassword}
											onChange={(e) => setConfirmPassword(e.target.value)}
											inputProps={{
												'aria-required': 'true',
											}}
											InputProps={{
												startAdornment: (
													<InputAdornment position="start">
														<LockIcon sx={{ color: '#64748b', fontSize: 18, mr: 0.5 }} />
													</InputAdornment>
												),
											}}
											sx={{
												'& .MuiOutlinedInput-root': {
													bgcolor: '#191c28',
													borderRadius: 1.5,
													color: '#F4F5F7',
													border: '1px solid rgba(255, 255, 255, 0.08)',
													'& fieldset': {
														border: 'none',
													},
													'&:hover': {
														border: '1px solid rgba(255, 255, 255, 0.15)',
													},
													'&.Mui-focused': {
														border: '1px solid #8B7CF6',
														boxShadow: '0 0 0 3px rgba(139, 124, 246, 0.15)',
													},
												},
												'& input::placeholder': {
													color: '#64748b',
													opacity: 1,
												},
											}}
										/>

										{/* Match validation status */}
										{confirmPassword && (
											<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.5 }}>
												{passwordsMatch ? (
													<CheckCircleIcon sx={{ fontSize: 16, color: '#10B981' }} />
												) : (
													<ErrorIcon sx={{ fontSize: 16, color: '#ef4444' }} />
												)}
												<Typography
													sx={{
														fontSize: '0.75rem',
														color: passwordsMatch ? '#10B981' : '#ef4444',
														fontWeight: 600,
													}}
												>
													{passwordsMatch ? 'Passwords match' : "Passwords don't match"}
												</Typography>
											</Box>
										)}
									</Box>

									{/* Activate Button */}
									<Button
										type="submit"
										fullWidth
										variant="contained"
										disabled={loading || !token || !isPasswordValid || !passwordsMatch}
										aria-busy={loading}
										aria-label={loading ? 'Activating account' : 'Activate Account'}
										sx={{
											py: 1.25,
											backgroundColor: '#8B7CF6',
											color: '#ffffff',
											'&:hover': {
												backgroundColor: '#7a6ae6',
												boxShadow: '0 4px 12px rgba(139, 124, 246, 0.3)',
											},
											'&.Mui-disabled': {
												backgroundColor: 'rgba(255, 255, 255, 0.05)',
												color: 'rgba(255, 255, 255, 0.3)',
											},
											textTransform: 'none',
											fontWeight: 700,
											fontSize: '0.95rem',
											transition: 'all 0.2s',
											borderRadius: 1.5,
										}}
									>
										{loading ? <CircularProgress size={24} color="inherit" aria-hidden="true" /> : 'Activate Account'}
									</Button>
								</Box>
							)}

							{status === 'success' && (
								<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2 }}>
									<CheckCircleIcon sx={{ fontSize: 72, color: '#10B981', mb: 2 }} />
									<Typography variant="body1" sx={{ color: '#94A3B8', textAlign: 'center' }}>
										Your password has been set. Redirecting you to the dashboard...
									</Typography>
								</Box>
							)}

							{status === 'error' && (
								<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2 }}>
									<ErrorIcon sx={{ fontSize: 72, color: '#ef4444', mb: 2 }} />
									<Typography variant="body1" sx={{ color: '#94A3B8', textAlign: 'center', mb: 4 }}>
										{!token
											? 'This invite link is missing its token. Please use the link from your invite email.'
											: typeof error === 'string'
											? error
											: 'This invite link is invalid or has expired. Please ask for a new invite.'}
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
						</Paper>
					</Box>
				</Fade>
			</Box>

			{/* Footer */}
			<AuthFooter />
		</Box>
	);
};

export default AcceptInvite;
