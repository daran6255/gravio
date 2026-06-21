import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
	Box,
	Typography,
	Paper,
	Stepper,
	Step,
	StepLabel,
	Link,
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { onboardUser } from '../../../store/slices/authSlice';
import useToast from '../../../hooks/useToast';
import api from '../../../services/api';
import OrganizationStep from './OrganizationStep';
import AdminStep from './AdminStep';
import SuccessStep from './SuccessStep';

const steps = ['Organization Info', 'Admin Profile'];

interface PasswordStrengthInfo {
	score: number;
	label: 'Too Weak' | 'Weak' | 'Medium' | 'Strong';
	color: string;
	requirements: {
		length: boolean;
		uppercase: boolean;
		number: boolean;
		special: boolean;
	};
}

const RegisterForm: React.FC = () => {
	const navigate = useNavigate();
	const toast = useToast();
	const dispatch = useAppDispatch();
	const { loading } = useAppSelector((state) => state.auth);

	const [activeStep, setActiveStep] = useState(0);
	const [success, setSuccess] = useState(false);
	const [successMsg, setSuccessMsg] = useState('');

	// Form fields
	const [orgName, setOrgName] = useState('');
	const [orgLocation, setOrgLocation] = useState('');
	const [companySize, setCompanySize] = useState('');
	const [industry, setIndustry] = useState('');

	// On-Spot Org Verification State
	const [orgNameStatus, setOrgNameStatus] = useState<'idle' | 'validating' | 'available' | 'error'>('idle');
	const [orgNameMessage, setOrgNameMessage] = useState('');

	// Location geocoding state
	const [locationOptions, setLocationOptions] = useState<string[]>([]);
	const [locationLoading, setLocationLoading] = useState(false);
	const [locationInputValue, setLocationInputValue] = useState('');
	
	// Admin fields
	const [adminName, setAdminName] = useState('');
	const [adminUsername, setAdminUsername] = useState('');
	const [adminEmail, setAdminEmail] = useState('');
	const [adminPassword, setAdminPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);

	// On-Spot Admin Verification States
	const [usernameStatus, setUsernameStatus] = useState<'idle' | 'validating' | 'available' | 'error'>('idle');
	const [usernameMessage, setUsernameMessage] = useState('');
	const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);

	const [emailStatus, setEmailStatus] = useState<'idle' | 'validating' | 'available' | 'error'>('idle');
	const [emailMessage, setEmailMessage] = useState('');

	// Fetch dynamic locations based on search input
	useEffect(() => {
		if (locationInputValue.trim().length < 3) {
			setLocationOptions([]);
			return;
		}

		const fetchLocations = async () => {
			setLocationLoading(true);
			try {
				const response = await fetch(
					`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
						locationInputValue
					)}&format=json&addressdetails=1&limit=5&accept-language=en`,
					{
						headers: {
							'User-Agent': 'Gravit-Onboarding-App/1.0',
						},
					}
				);
				const data = await response.json();
				if (Array.isArray(data)) {
					const formattedLocations = data.map((item: any) => {
						const addr = item.address;
						const city = addr.city || addr.town || addr.municipality || addr.village || addr.suburb || addr.state_district || '';
						const state = addr.state || '';
						const country = addr.country || '';

						if (city && state) {
							return `${city}, ${state}`;
						} else if (city && country) {
							return `${city}, ${country}`;
						} else if (state && country) {
							return `${state}, ${country}`;
						}
						return item.display_name;
					});
					
					const uniqueLocations = Array.from(new Set(formattedLocations.filter(Boolean))) as string[];
					setLocationOptions(uniqueLocations);
				}
			} catch (error) {
				console.error('Failed to fetch locations:', error);
			} finally {
				setLocationLoading(false);
			}
		};

		const debounceTimer = setTimeout(() => {
			fetchLocations();
		}, 400);

		return () => clearTimeout(debounceTimer);
	}, [locationInputValue]);

	// Real-Time Organization Name Checker
	useEffect(() => {
		const trimmed = orgName.trim();
		if (!trimmed) {
			setOrgNameStatus('idle');
			setOrgNameMessage('');
			return;
		}

		setOrgNameStatus('validating');
		const timer = setTimeout(async () => {
			try {
				const response = await api.get(`/onboard/check-org?name=${encodeURIComponent(trimmed)}`);
				if (response.data.available) {
					setOrgNameStatus('available');
					setOrgNameMessage('Organization name is available.');
				} else {
					setOrgNameStatus('error');
					setOrgNameMessage(response.data.message || 'Organization name is not available.');
				}
			} catch (err: any) {
				setOrgNameStatus('error');
				setOrgNameMessage('Failed to verify organization name.');
			}
		}, 400);

		return () => clearTimeout(timer);
	}, [orgName]);

	// Real-Time Username Checker
	useEffect(() => {
		const trimmed = adminUsername.trim().toLowerCase();
		if (!trimmed) {
			setUsernameStatus('idle');
			setUsernameMessage('');
			setUsernameSuggestions([]);
			return;
		}

		if (!/^[a-z0-9_]{3,30}$/.test(trimmed)) {
			setUsernameStatus('error');
			setUsernameMessage('Username must be 3-30 characters long and contain only lowercase letters, numbers, and underscores.');
			setUsernameSuggestions([]);
			return;
		}

		setUsernameStatus('validating');
		const timer = setTimeout(async () => {
			try {
				const response = await api.get(`/onboard/check-username?username=${encodeURIComponent(trimmed)}`);
				if (response.data.available) {
					setUsernameStatus('available');
					setUsernameMessage('Username is available.');
					setUsernameSuggestions(response.data.suggestions || []);
				} else {
					setUsernameStatus('error');
					setUsernameMessage(response.data.message || 'Username is taken.');
					setUsernameSuggestions(response.data.suggestions || []);
				}
			} catch (err: any) {
				setUsernameStatus('error');
				setUsernameMessage('Failed to verify username.');
				setUsernameSuggestions([]);
			}
		}, 400);

		return () => clearTimeout(timer);
	}, [adminUsername]);

	// Real-Time Email Checker
	useEffect(() => {
		const trimmed = adminEmail.trim().toLowerCase();
		if (!trimmed) {
			setEmailStatus('idle');
			setEmailMessage('');
			return;
		}

		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
			setEmailStatus('error');
			setEmailMessage('Please enter a valid email address.');
			return;
		}

		setEmailStatus('validating');
		const timer = setTimeout(async () => {
			try {
				const response = await api.get(`/onboard/check-email?email=${encodeURIComponent(trimmed)}`);
				if (response.data.available) {
					setEmailStatus('available');
					setEmailMessage('Email address is available.');
				} else {
					setEmailStatus('error');
					setEmailMessage(response.data.message || 'Email address is not available.');
				}
			} catch (err: any) {
				setEmailStatus('error');
				setEmailMessage('Failed to verify email address.');
			}
		}, 400);

		return () => clearTimeout(timer);
	}, [adminEmail]);

	// Password Strength Indicator Calculation
	const getPasswordStrength = (password: string): PasswordStrengthInfo => {
		const requirements = {
			length: password.length >= 8,
			uppercase: /[A-Z]/.test(password),
			number: /\d/.test(password),
			special: /[\W_]/.test(password),
		};
		
		let score = 0;
		if (password.length > 0) {
			if (requirements.length) score += 1;
			if (requirements.uppercase) score += 1;
			if (requirements.number) score += 1;
			if (requirements.special) score += 1;
		}
		
		const labels = ['Too Weak', 'Weak', 'Medium', 'Strong'] as const;
		const colors = ['#ef4444', '#f97316', '#eab308', '#10b981'];
		
		return {
			score,
			label: labels[score - 1] || 'Too Weak',
			color: colors[score - 1] || '#ef4444',
			requirements,
		};
	};

	const passwordStrength = getPasswordStrength(adminPassword);

	const nextDisabled = 
		orgNameStatus !== 'available' ||
		!orgName.trim() ||
		!orgLocation.trim() ||
		!companySize ||
		!industry;

	const registerDisabled = 
		usernameStatus !== 'available' ||
		emailStatus !== 'available' ||
		passwordStrength.score !== 4 ||
		adminName.trim().length < 2;

	const handleNext = () => {
		if (activeStep === 0) {
			if (nextDisabled) {
				toast.error('Please resolve all validation errors and complete all fields.');
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
		if (registerDisabled) {
			toast.error('Please resolve all validation errors before registering.');
			return;
		}

		const payload = {
			organization: {
				name: orgName,
				location: orgLocation || undefined,
				metadata: {
					company_size: companySize,
					industry: industry,
				}
			},
			admin_user: {
				username: adminUsername.toLowerCase(),
				email: adminEmail,
				full_name: adminName,
				password: adminPassword,
			},
		};

		const resultAction = await dispatch(onboardUser(payload));
		if (onboardUser.fulfilled.match(resultAction)) {
			const response = resultAction.payload;
			setSuccess(true);
			setSuccessMsg(response.message || 'Organization registered successfully! Verification email sent.');
			toast.success('Registration successful!');
		} else {
			const errorDetail = (resultAction.payload as string) || '';
			toast.error(errorDetail || 'Registration failed. Please check your inputs.');
		}
	};

	return (
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
				<SuccessStep
					successMsg={successMsg}
					onReturnToLogin={() => navigate('/login')}
				/>
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
							'& .MStepLabel-label': { color: '#94A3B8', fontWeight: 500, fontSize: '0.75rem' },
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
						<OrganizationStep
							orgName={orgName}
							setOrgName={setOrgName}
							orgNameStatus={orgNameStatus}
							orgNameMessage={orgNameMessage}
							orgLocation={orgLocation}
							setOrgLocation={setOrgLocation}
							companySize={companySize}
							setCompanySize={setCompanySize}
							industry={industry}
							setIndustry={setIndustry}
							locationOptions={locationOptions}
							locationLoading={locationLoading}
							locationInputValue={locationInputValue}
							setLocationInputValue={setLocationInputValue}
							onNext={handleNext}
							nextDisabled={nextDisabled}
						/>
					) : (
						<AdminStep
							adminName={adminName}
							setAdminName={setAdminName}
							adminUsername={adminUsername}
							setAdminUsername={setAdminUsername}
							usernameStatus={usernameStatus}
							usernameMessage={usernameMessage}
							usernameSuggestions={usernameSuggestions}
							adminEmail={adminEmail}
							setAdminEmail={setAdminEmail}
							emailStatus={emailStatus}
							emailMessage={emailMessage}
							adminPassword={adminPassword}
							setAdminPassword={setAdminPassword}
							showPassword={showPassword}
							setShowPassword={setShowPassword}
							passwordStrength={passwordStrength}
							loading={loading}
							onBack={handleBack}
							onSubmit={handleSubmit}
							registerDisabled={registerDisabled}
						/>
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
	);
};

export default RegisterForm;
