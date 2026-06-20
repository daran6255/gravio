import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
	Box,
	Typography,
	Button,
	TextField,
	CircularProgress,
	Paper,
	Fade,
	Stepper,
	Step,
	StepLabel,
	Link,
	InputAdornment,
	IconButton,
} from '@mui/material';
import {
	Visibility,
	VisibilityOff,
	BusinessOutlined as BusinessIcon,
	PersonOutline as PersonIcon,
	CheckCircleOutline as CheckCircleIcon,
	InfoOutlined as InfoIcon,
	RoomOutlined as RoomIcon,
	BadgeOutlined as BadgeIcon,
	MailOutline as MailIcon,
	LockOutlined as LockIcon,
	HelpOutline as HelpOutlineIcon,
} from '@mui/icons-material';
import useToast from '../../hooks/useToast';
import authService from '../../services/authService';
import AuthNavbar from '../../components/layout/AuthNavbar';
import AuthFooter from '../../components/layout/AuthFooter';

const steps = ['Organization Info', 'Admin Profile'];

const Register: React.FC = () => {
	const navigate = useNavigate();
	const toast = useToast();

	const [activeStep, setActiveStep] = useState(0);
	const [loading, setLoading] = useState(false);
	const [success, setSuccess] = useState(false);
	const [successMsg, setSuccessMsg] = useState('');

	// Form fields
	const [orgName, setOrgName] = useState('');
	const [orgLocation, setOrgLocation] = useState('');
	
	const [adminName, setAdminName] = useState('');
	const [adminUsername, setAdminUsername] = useState('');
	const [adminEmail, setAdminEmail] = useState('');
	const [adminPassword, setAdminPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);

	const handleNext = () => {
		if (activeStep === 0) {
			if (!orgName.trim()) {
				toast.error('Organization Name is required');
				return;
			}
			setActiveStep(1);
		}
	};

	const handleBack = () => {
		setActiveStep(0);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!adminName.trim() || !adminUsername.trim() || !adminEmail.trim() || !adminPassword.trim()) {
			toast.error('All admin profile fields are required');
			return;
		}

		setLoading(true);
		try {
			const payload = {
				organization: {
					name: orgName,
					location: orgLocation || undefined,
				},
				admin_user: {
					username: adminUsername.toLowerCase(),
					email: adminEmail,
					full_name: adminName,
					password: adminPassword,
				},
			};

			const response = await authService.onboard(payload);
			setSuccess(true);
			setSuccessMsg(response.message || 'Organization registered successfully! Verification email sent.');
			toast.success('Registration successful!');
		} catch (error) {
			console.error('Registration failed:', error);
			const err = error as { response?: { data?: { detail?: string } } };
			toast.error(err.response?.data?.detail || 'Registration failed. Please check your inputs.');
		} finally {
			setLoading(true);
			setLoading(false);
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
					pt: { xs: '84px', md: '96px' },
					pb: { xs: '130px', md: '76px' },
					px: 2,
					zIndex: 5,
					overflowY: 'auto',
				}}
			>
				<Fade in={true} timeout={800}>
					<Box sx={{ width: '100%', maxWidth: 480 }}>
						<Paper
							elevation={0}
							sx={{
								p: { xs: 2.5, sm: 3 },
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
							{success ? (
								<Box sx={{ textAlign: 'center', py: 2 }}>
									<CheckCircleIcon sx={{ fontSize: 72, color: '#10b981', mb: 3 }} />
									<Typography variant="h5" sx={{ fontWeight: 700, color: '#F4F5F7', mb: 2 }}>
										Registration Success!
									</Typography>
									<Typography variant="body1" sx={{ color: '#94A3B8', mb: 4 }}>
										{successMsg}
									</Typography>
									<Button
										variant="contained"
										fullWidth
										onClick={() => navigate('/login')}
										sx={{
											py: 1.25,
											backgroundColor: '#8B7CF6',
											color: '#ffffff',
											'&:hover': {
												backgroundColor: '#7a6ae6',
												boxShadow: '0 4px 12px rgba(139, 124, 246, 0.3)'
											},
											textTransform: 'none',
											fontWeight: 700,
											borderRadius: 1.5,
										}}
									>
										Return to Login
									</Button>
								</Box>
							) : (
								<Box>
									{/* Top Centered Brand Icon Box */}
									<Box sx={{ display: 'flex', justifyContent: 'center', mb: 1.5 }}>
										<Box
											sx={{
												backgroundColor: '#1c1e2b',
												p: 1.25,
												borderRadius: 1.5,
												display: 'flex',
												border: '1px solid rgba(139, 124, 246, 0.2)',
												boxShadow: '0 4px 12px rgba(139, 124, 246, 0.1)',
											}}
										>
											<svg width="24" height="24" viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg">
												<defs>
													<linearGradient id="lum-reg-icon" x1="0" y1="0" x2="1" y2="1">
														<stop offset="0" stop-color="#8B7CF6"/>
														<stop offset="1" stop-color="#4EA8FF"/>
													</linearGradient>
												</defs>
												<g transform="translate(90,90) scale(0.92)">
													<path d="M 36 -54 A 65 65 0 1 0 65 12 L 18 12" fill="none" stroke="url(#lum-reg-icon)" stroke-width="13" stroke-linecap="round"/>
													<circle cx="58" cy="-66" r="10" fill="#4EA8FF"/>
												</g>
											</svg>
										</Box>
									</Box>

									{/* Heading and Subheading */}
									<Box sx={{ mb: 2, textAlign: 'center' }}>
										<Typography component="h1" variant="h6" sx={{ fontWeight: 700, color: '#F4F5F7', mb: 0.5 }}>
											Create your account
										</Typography>
										<Typography variant="body2" sx={{ color: '#94A3B8', fontWeight: 500, fontSize: '0.825rem' }}>
											Start managing your infrastructure with Gravit
										</Typography>
									</Box>

									<Stepper
										activeStep={activeStep}
										alternativeLabel
										sx={{
											mb: 2,
											'& .MuiStepLabel-label': { color: '#94A3B8', fontWeight: 500, fontSize: '0.75rem' },
											'& .MuiStepLabel-label.Mui-active': { color: '#F4F5F7', fontWeight: 700 },
											'& .MuiStepLabel-label.Mui-completed': { color: '#8B7CF6' },
											'& .MuiStepIcon-root': { color: 'rgba(255, 255, 255, 0.1)', transform: 'scale(0.85)' },
											'& .MuiStepIcon-root.Mui-active': { color: '#8B7CF6' },
											'& .MuiStepIcon-root.Mui-completed': { color: '#8B7CF6' },
										}}
									>
										{steps.map((label) => (
											<Step key={label}>
												<StepLabel>{label}</StepLabel>
											</Step>
										))}
									</Stepper>

									{activeStep === 0 ? (
										<Box component="div">
											{/* Info helper box */}
											<Box
												sx={{
													border: '1px solid rgba(78, 168, 255, 0.15)',
													borderRadius: 2,
													p: 1.25,
													bgcolor: 'rgba(78, 168, 255, 0.03)',
													mb: 2,
													display: 'flex',
													alignItems: 'flex-start',
													gap: 1.5,
												}}
											>
												<InfoIcon sx={{ color: '#4EA8FF', mt: 0.25, fontSize: 18 }} />
												<Box>
													<Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#F4F5F7', mb: 0.25, fontSize: '0.8rem' }}>
														Scale Smarter
													</Typography>
													<Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', lineHeight: 1.35, fontSize: '0.725rem' }}>
														Join over 5,000 organizations leveraging Gravit to manage multi-tenant infrastructures, reduce complexity, and streamline resources.
													</Typography>
												</Box>
											</Box>

											<Box sx={{ mb: 1.25 }}>
												<Typography
													sx={{
														fontSize: '0.675rem',
														fontWeight: 700,
														color: '#94A3B8',
														textTransform: 'uppercase',
														letterSpacing: '0.05em',
														mb: 0.75,
														display: 'block'
													}}
												>
													Organization Name *
												</Typography>
												<TextField
													required
													fullWidth
													id="orgName"
													placeholder="e.g. Acme Corporation"
													size="small"
													value={orgName}
													onChange={(e) => setOrgName(e.target.value)}
													InputProps={{
														startAdornment: (
															<InputAdornment position="start">
																<BusinessIcon sx={{ color: '#64748b', fontSize: 18, mr: 0.5 }} />
															</InputAdornment>
														)
													}}
													sx={{
														'& .MuiOutlinedInput-root': {
															bgcolor: '#191c28',
															borderRadius: 1.5,
															color: '#F4F5F7',
															border: '1px solid rgba(255, 255, 255, 0.08)',
															'& fieldset': { border: 'none' },
															'&:hover': { border: '1px solid rgba(255, 255, 255, 0.15)' },
															'&.Mui-focused': {
																border: '1px solid #8B7CF6',
																boxShadow: '0 0 0 3px rgba(139, 124, 246, 0.15)'
															}
														},
														'& input::placeholder': { color: '#64748b', opacity: 1 }
													}}
												/>
											</Box>

											<Box sx={{ mb: 2 }}>
												<Typography
													sx={{
														fontSize: '0.675rem',
														fontWeight: 700,
														color: '#94A3B8',
														textTransform: 'uppercase',
														letterSpacing: '0.05em',
														mb: 0.75,
														display: 'block'
													}}
												>
													Location
												</Typography>
												<TextField
													fullWidth
													id="orgLocation"
													placeholder="e.g. New York, USA"
													size="small"
													value={orgLocation}
													onChange={(e) => setOrgLocation(e.target.value)}
													InputProps={{
														startAdornment: (
															<InputAdornment position="start">
																<RoomIcon sx={{ color: '#64748b', fontSize: 18, mr: 0.5 }} />
															</InputAdornment>
														)
													}}
													sx={{
														'& .MuiOutlinedInput-root': {
															bgcolor: '#191c28',
															borderRadius: 1.5,
															color: '#F4F5F7',
															border: '1px solid rgba(255, 255, 255, 0.08)',
															'& fieldset': { border: 'none' },
															'&:hover': { border: '1px solid rgba(255, 255, 255, 0.15)' },
															'&.Mui-focused': {
																border: '1px solid #8B7CF6',
																boxShadow: '0 0 0 3px rgba(139, 124, 246, 0.15)'
															}
														},
														'& input::placeholder': { color: '#64748b', opacity: 1 }
													}}
												/>
											</Box>

											<Button
												variant="contained"
												fullWidth
												onClick={handleNext}
												sx={{
													py: 1.15,
													backgroundColor: '#8B7CF6',
													color: '#ffffff',
													'&:hover': {
														backgroundColor: '#7a6ae6',
														boxShadow: '0 4px 12px rgba(139, 124, 246, 0.3)'
													},
													textTransform: 'none',
													fontWeight: 700,
													borderRadius: 1.5,
												}}
											>
												Next
											</Button>
										</Box>
									) : (
										<Box component="form" onSubmit={handleSubmit}>
											<Box sx={{ mb: 1.25 }}>
												<Typography
													sx={{
														fontSize: '0.675rem',
														fontWeight: 700,
														color: '#94A3B8',
														textTransform: 'uppercase',
														letterSpacing: '0.05em',
														mb: 0.75,
														display: 'block'
													}}
												>
													Full Name *
												</Typography>
												<TextField
													required
													fullWidth
													id="adminName"
													placeholder="Jane Doe"
													size="small"
													value={adminName}
													onChange={(e) => setAdminName(e.target.value)}
													InputProps={{
														startAdornment: (
															<InputAdornment position="start">
																<PersonIcon sx={{ color: '#64748b', fontSize: 18, mr: 0.5 }} />
															</InputAdornment>
														)
													}}
													sx={{
														'& .MuiOutlinedInput-root': {
															bgcolor: '#191c28',
															borderRadius: 1.5,
															color: '#F4F5F7',
															border: '1px solid rgba(255, 255, 255, 0.08)',
															'& fieldset': { border: 'none' },
															'&:hover': { border: '1px solid rgba(255, 255, 255, 0.15)' },
															'&.Mui-focused': {
																border: '1px solid #8B7CF6',
																boxShadow: '0 0 0 3px rgba(139, 124, 246, 0.15)'
															}
														},
														'& input::placeholder': { color: '#64748b', opacity: 1 }
													}}
												/>
											</Box>

											<Box sx={{ mb: 1.25 }}>
												<Typography
													sx={{
														fontSize: '0.675rem',
														fontWeight: 700,
														color: '#94A3B8',
														textTransform: 'uppercase',
														letterSpacing: '0.05em',
														mb: 0.75,
														display: 'block'
													}}
												>
													Username *
												</Typography>
												<TextField
													required
													fullWidth
													id="adminUsername"
													placeholder="janedoe"
													size="small"
													value={adminUsername}
													onChange={(e) => setAdminUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
													helperText="Lowercase letters, numbers, and underscores only."
													InputProps={{
														startAdornment: (
															<InputAdornment position="start">
																<BadgeIcon sx={{ color: '#64748b', fontSize: 18, mr: 0.5 }} />
															</InputAdornment>
														)
													}}
													FormHelperTextProps={{
														sx: { color: '#64748b', fontSize: '0.65rem', mt: 0.25 }
													}}
													sx={{
														'& .MuiOutlinedInput-root': {
															bgcolor: '#191c28',
															borderRadius: 1.5,
															color: '#F4F5F7',
															border: '1px solid rgba(255, 255, 255, 0.08)',
															'& fieldset': { border: 'none' },
															'&:hover': { border: '1px solid rgba(255, 255, 255, 0.15)' },
															'&.Mui-focused': {
																border: '1px solid #8B7CF6',
																boxShadow: '0 0 0 3px rgba(139, 124, 246, 0.15)'
															}
														},
														'& input::placeholder': { color: '#64748b', opacity: 1 }
													}}
												/>
											</Box>

											<Box sx={{ mb: 1.25 }}>
												<Typography
													sx={{
														fontSize: '0.675rem',
														fontWeight: 700,
														color: '#94A3B8',
														textTransform: 'uppercase',
														letterSpacing: '0.05em',
														mb: 0.75,
														display: 'block'
													}}
												>
													Email Address *
												</Typography>
												<TextField
													required
													fullWidth
													id="adminEmail"
													type="email"
													placeholder="jane@company.com"
													size="small"
													value={adminEmail}
													onChange={(e) => setAdminEmail(e.target.value)}
													InputProps={{
														startAdornment: (
															<InputAdornment position="start">
																<MailIcon sx={{ color: '#64748b', fontSize: 18, mr: 0.5 }} />
															</InputAdornment>
														)
													}}
													sx={{
														'& .MuiOutlinedInput-root': {
															bgcolor: '#191c28',
															borderRadius: 1.5,
															color: '#F4F5F7',
															border: '1px solid rgba(255, 255, 255, 0.08)',
															'& fieldset': { border: 'none' },
															'&:hover': { border: '1px solid rgba(255, 255, 255, 0.15)' },
															'&.Mui-focused': {
																border: '1px solid #8B7CF6',
																boxShadow: '0 0 0 3px rgba(139, 124, 246, 0.15)'
															}
														},
														'& input::placeholder': { color: '#64748b', opacity: 1 }
													}}
												/>
											</Box>

											<Box sx={{ mb: 2 }}>
												<Typography
													sx={{
														fontSize: '0.675rem',
														fontWeight: 700,
														color: '#94A3B8',
														textTransform: 'uppercase',
														letterSpacing: '0.05em',
														mb: 0.75,
														display: 'block'
													}}
												>
													Password *
												</Typography>
												<TextField
													required
													fullWidth
													id="adminPassword"
													type={showPassword ? 'text' : 'password'}
													placeholder="••••••••"
													size="small"
													value={adminPassword}
													onChange={(e) => setAdminPassword(e.target.value)}
													helperText="Min. 8 characters with an uppercase letter, number, and special character."
													FormHelperTextProps={{
														sx: { color: '#64748b', fontSize: '0.65rem', mt: 0.25 }
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
																	onClick={() => setShowPassword(!showPassword)}
																	edge="end"
																	size="small"
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
															'& fieldset': { border: 'none' },
															'&:hover': { border: '1px solid rgba(255, 255, 255, 0.15)' },
															'&.Mui-focused': {
																border: '1px solid #8B7CF6',
																boxShadow: '0 0 0 3px rgba(139, 124, 246, 0.15)'
															}
														},
														'& input::placeholder': { color: '#64748b', opacity: 1 }
													}}
												/>
											</Box>

											<Box sx={{ display: 'flex', gap: 2 }}>
												<Button
													variant="outlined"
													fullWidth
													onClick={handleBack}
													sx={{
														py: 1.15,
														borderColor: 'rgba(255, 255, 255, 0.12)',
														color: '#94A3B8',
														textTransform: 'none',
														fontWeight: 600,
														borderRadius: 1.5,
														'&:hover': {
															borderColor: '#94A3B8',
															color: '#F4F5F7',
															backgroundColor: 'rgba(255, 255, 255, 0.02)',
														},
													}}
												>
													Back
												</Button>
												<Button
													type="submit"
													variant="contained"
													fullWidth
													disabled={loading}
													sx={{
														py: 1.15,
														backgroundColor: '#8B7CF6',
														color: '#ffffff',
														'&:hover': {
															backgroundColor: '#7a6ae6',
															boxShadow: '0 4px 12px rgba(139, 124, 246, 0.3)'
														},
														'&.Mui-disabled': {
															backgroundColor: 'rgba(255, 255, 255, 0.05)',
															color: 'rgba(255, 255, 255, 0.3)',
														},
														textTransform: 'none',
														fontWeight: 700,
														borderRadius: 1.5,
													}}
												>
													{loading ? <CircularProgress size={24} color="inherit" /> : 'Register'}
												</Button>
											</Box>
										</Box>
									)}

									{/* Terms Disclaimer */}
									<Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, textAlign: 'center', opacity: 0.6, fontSize: '0.725rem', lineHeight: 1.35 }}>
										By clicking "Register" or "Next", you agree to our{' '}
										<Link component={RouterLink} to="/terms" sx={{ color: '#8B7CF6', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
											Terms of Service
										</Link>{' '}
										and{' '}
										<Link component={RouterLink} to="/privacy-policy" sx={{ color: '#8B7CF6', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
											Privacy Policy
										</Link>.
									</Typography>

									{/* Redirect Link */}
									{!success && (
										<Box sx={{ mt: 2, textAlign: 'center' }}>
											<Typography variant="body2" sx={{ color: '#94A3B8', fontSize: '0.825rem' }}>
												Already have an account?{' '}
												<Link
													component={RouterLink}
													to="/login"
													sx={{
														color: '#8B7CF6',
														textDecoration: 'none',
														fontWeight: 600,
														'&:hover': { textDecoration: 'underline' }
													}}
												>
													Sign in
												</Link>
											</Typography>
										</Box>
									)}
								</Box>
							)}
						</Paper>
					</Box>
				</Fade>

				{/* 24/7 Enterprise Help Widget (desktop: absolute bottom-right, mobile: flow below card) */}
				<Box
					sx={{
						position: { xs: 'static', md: 'absolute' },
						bottom: { xs: 24, md: 92 },
						right: 24,
						maxWidth: 320,
						width: '100%',
						mt: { xs: 4, md: 0 },
						zIndex: 10,
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
			<AuthFooter />
		</Box>
	);
};

export default Register;
