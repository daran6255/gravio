import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
	Box,
	Typography,
	Paper,
	Stepper,
	Step,
	StepLabel,
	Link,
} from '@mui/material';
import { useRegisterForm, steps } from './hooks/useRegisterForm';
import { OrganizationStep, AdminStep, SuccessStep } from './steps';

const RegisterForm: React.FC = () => {
	const {
		loading,
		activeStep,
		success,
		successMsg,
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
		goToLogin,
	} = useRegisterForm();

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
					email={adminEmail}
					onReturnToLogin={goToLogin}
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
										<stop offset="0" stopColor="#8B7CF6"/>
										<stop offset="1" stopColor="#4EA8FF"/>
									</linearGradient>
								</defs>
								<g transform="translate(90,90) scale(0.92)">
									<path d="M 36 -54 A 65 65 0 1 0 65 12 L 18 12" fill="none" stroke="url(#lum-reg-icon)" strokeWidth="13" strokeLinecap="round"/>
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
									to="/auth/login"
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
