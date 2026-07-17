import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { onboardUser } from '../../../../store/slices/authSlice';
import useToast from '../../../../hooks/useToast';
import useLocationSearch from '../../../../hooks/useLocationSearch';
import api from '../../../../services/api';

export const steps = ['Organization Info', 'Admin Profile'];

export type AccountType = 'organization' | 'individual';

export interface PasswordStrengthInfo {
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

export const useRegisterForm = () => {
	const toast = useToast();
	const dispatch = useAppDispatch();
	const { loading } = useAppSelector((state) => state.auth);

	const [activeStep, setActiveStep] = useState(0);
	const [success, setSuccess] = useState(false);
	const [successMsg, setSuccessMsg] = useState('');

	const [accountType, setAccountTypeState] = useState<AccountType>('individual');
	const setAccountType = (type: AccountType) => {
		setAccountTypeState(type);
		setActiveStep(0);
	};

	// Form fields
	const [orgName, setOrgName] = useState('');
	const [orgLocation, setOrgLocation] = useState('');
	const [companySize, setCompanySize] = useState('');
	const [industry, setIndustry] = useState('');

	// On-Spot Org Verification State
	const [orgNameStatus, setOrgNameStatus] = useState<'idle' | 'validating' | 'available' | 'error'>('idle');
	const [orgNameMessage, setOrgNameMessage] = useState('');

	// Location geocoding state
	const { locationOptions, locationLoading, locationInputValue, setLocationInputValue } = useLocationSearch();

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

	// Individual/freelancer signups still need a (unique) organization behind the
	// scenes since the backend models every account as org-scoped. Derive one from
	// their name instead of asking them to fill in company details.
	const resolveIndividualOrgName = async (): Promise<string> => {
		const base = `${adminName.trim() || adminUsername}'s Workspace`;
		for (let attempt = 0; attempt < 5; attempt++) {
			const candidate = attempt === 0 ? base : `${base} ${Math.floor(1000 + Math.random() * 9000)}`;
			try {
				const response = await api.get(`/onboard/check-org?name=${encodeURIComponent(candidate)}`);
				if (response.data.available) return candidate;
			} catch {
				// fall through and retry with a new suffix
			}
		}
		return `${base} ${Date.now().toString().slice(-6)}`;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (registerDisabled) {
			toast.error('Please resolve all validation errors before registering.');
			return;
		}

		const payload = {
			organization: accountType === 'individual'
				? { 
					name: await resolveIndividualOrgName(),
					metadata: {
						account_type: 'individual'
					}
				}
				: {
					name: orgName,
					location: orgLocation || undefined,
					metadata: {
						company_size: companySize,
						industry: industry,
						account_type: 'organization'
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
			setSuccessMsg(response.message || (accountType === 'individual'
				? 'Account created successfully! Verification email sent.'
				: 'Organization registered successfully! Verification email sent.'));
			toast.success('Registration successful!');
		} else {
			const errorDetail = (resultAction.payload as string) || '';
			toast.error(errorDetail || 'Registration failed. Please check your inputs.');
		}
	};

	return {
		loading,
		activeStep,
		success,
		successMsg,

		accountType,
		setAccountType,

		orgName,
		setOrgName,
		orgLocation,
		setOrgLocation,
		companySize,
		setCompanySize,
		industry,
		setIndustry,
		orgNameStatus,
		orgNameMessage,

		locationOptions,
		locationLoading,
		locationInputValue,
		setLocationInputValue,

		adminName,
		setAdminName,
		adminUsername,
		setAdminUsername,
		adminEmail,
		setAdminEmail,
		adminPassword,
		setAdminPassword,
		showPassword,
		setShowPassword,

		usernameStatus,
		usernameMessage,
		usernameSuggestions,
		emailStatus,
		emailMessage,

		passwordStrength,
		nextDisabled,
		registerDisabled,

		handleNext,
		handleBack,
		handleSubmit,
	};
};
