import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
	Box,
	Typography,
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
		<Box
			sx={{
				display: 'flex',
				flexDirection: 'column',
				width: '100%',
				position: 'relative',
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
		</Box>
	);
};

export default RegisterForm;
