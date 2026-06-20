import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
	Container,
	Box,
	Typography,
	Button,
	TextField,
	CircularProgress,
	Paper,
	useTheme,
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
	Business as BusinessIcon,
	Person as PersonIcon,
	CheckCircleOutline as CheckCircleIcon,
} from '@mui/icons-material';
import useToast from '../../hooks/useToast';
import authService from '../../services/authService';
import { useColorMode } from '../../theme/ThemeContext';

const steps = ['Organization Info', 'Admin Profile'];

const Register: React.FC = () => {
	const theme = useTheme();
	const navigate = useNavigate();
	const toast = useToast();
	const { mode } = useColorMode();

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
			setLoading(true); // Keep loading state visual while shifting to success screen
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
				alignItems: 'center',
				justifyContent: 'center',
				backgroundColor: theme.palette.background.default,
				backgroundImage: `radial-gradient(circle at 50% 50%, ${theme.palette.background.default} 0%, ${theme.palette.secondary.dark}30 100%)`,
				position: 'relative',
				overflow: 'hidden',
				py: 4,
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
					<Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontWeight: 500 }}>
						Register your organization and activate your 30-day free trial.
					</Typography>
				</Box>

				<Fade in={true} timeout={800}>
					<Paper
						elevation={1}
						sx={{
							p: { xs: 3, sm: 5 },
							display: 'flex',
							flexDirection: 'column',
							borderRadius: 2,
							backgroundColor: theme.palette.background.paper,
							border: `1px solid ${theme.palette.divider}`,
							position: 'relative',
							overflow: 'hidden',
							'&::before': {
								content: '""',
								position: 'absolute',
								top: 0,
								left: 0,
								right: 0,
								height: 4,
								backgroundColor: theme.palette.primary.main,
							},
						}}
					>
						{success ? (
							<Box sx={{ textAlign: 'center', py: 2 }}>
								<CheckCircleIcon sx={{ fontSize: 72, color: theme.palette.success.main, mb: 3 }} />
								<Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.secondary.main, mb: 2 }}>
									Registration Success!
								</Typography>
								<Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
									{successMsg}
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
									Return to Login
								</Button>
							</Box>
						) : (
							<Box>
								<Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
									{steps.map((label) => (
										<Step key={label}>
											<StepLabel>{label}</StepLabel>
										</Step>
									))}
								</Stepper>

								{activeStep === 0 ? (
									<Box component="div">
										<Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
											<Box
												sx={{
													backgroundColor: `${theme.palette.primary.main}15`,
													p: 1,
													borderRadius: 1,
													display: 'flex',
												}}
											>
												<BusinessIcon sx={{ color: theme.palette.primary.main }} />
											</Box>
											<Typography variant="h6" sx={{ fontWeight: 600 }}>
												Organization Information
											</Typography>
										</Box>

										<Box sx={{ mb: 2.5 }}>
											<Typography variant="awsFieldLabel" sx={{ mb: 1 }}>
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
												sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
											/>
										</Box>

										<Box sx={{ mb: 4 }}>
											<Typography variant="awsFieldLabel" sx={{ mb: 1 }}>
												Location
											</Typography>
											<TextField
												fullWidth
												id="orgLocation"
												placeholder="e.g. New York, USA"
												size="small"
												value={orgLocation}
												onChange={(e) => setOrgLocation(e.target.value)}
												sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
											/>
										</Box>

										<Button
											variant="contained"
											fullWidth
											onClick={handleNext}
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
											Next
										</Button>
									</Box>
								) : (
									<Box component="form" onSubmit={handleSubmit}>
										<Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
											<Box
												sx={{
													backgroundColor: `${theme.palette.primary.main}15`,
													p: 1,
													borderRadius: 1,
													display: 'flex',
												}}
											>
												<PersonIcon sx={{ color: theme.palette.primary.main }} />
											</Box>
											<Typography variant="h6" sx={{ fontWeight: 600 }}>
												Administrator Profile
											</Typography>
										</Box>

										<Box sx={{ mb: 2 }}>
											<Typography variant="awsFieldLabel" sx={{ mb: 1 }}>
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
												sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
											/>
										</Box>

										<Box sx={{ mb: 2 }}>
											<Typography variant="awsFieldLabel" sx={{ mb: 1 }}>
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
												sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
											/>
										</Box>

										<Box sx={{ mb: 2 }}>
											<Typography variant="awsFieldLabel" sx={{ mb: 1 }}>
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
												sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
											/>
										</Box>

										<Box sx={{ mb: 3 }}>
											<Typography variant="awsFieldLabel" sx={{ mb: 1 }}>
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
												InputProps={{
													endAdornment: (
														<InputAdornment position="end">
															<IconButton
																aria-label={showPassword ? 'hide password' : 'show password'}
																onClick={() => setShowPassword(!showPassword)}
																edge="end"
																size="small"
															>
																{showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
															</IconButton>
														</InputAdornment>
													),
													sx: { borderRadius: 1 },
												}}
											/>
										</Box>

										<Box sx={{ display: 'flex', gap: 2 }}>
											<Button
												variant="outlined"
												fullWidth
												onClick={handleBack}
												sx={{
													py: 1.25,
													borderColor: theme.palette.divider,
													color: theme.palette.text.primary,
													textTransform: 'none',
													fontWeight: 600,
													borderRadius: 1,
													'&:hover': {
														borderColor: theme.palette.text.secondary,
														backgroundColor: 'rgba(0,0,0,0.02)',
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
												{loading ? <CircularProgress size={24} color="inherit" /> : 'Register'}
											</Button>
										</Box>
									</Box>
								)}
							</Box>
						)}
					</Paper>
				</Fade>

				{!success && (
					<Box sx={{ mt: 3, textAlign: 'center' }}>
						<Typography variant="body2" color="text.secondary">
							Already registered?{' '}
							<Link
								component={RouterLink}
								to="/login"
								sx={{
									color: theme.palette.primary.main,
									textDecoration: 'none',
									fontWeight: 600,
									'&:hover': { textDecoration: 'underline' },
								}}
							>
								Sign In
							</Link>
						</Typography>
					</Box>
				)}
			</Container>
		</Box>
	);
};

export default Register;
