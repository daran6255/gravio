import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Fade } from '@mui/material';
import { CheckCircleOutline as CheckCircleIcon } from '@mui/icons-material';
import AuthBrandPanel from '../../../components/layout/AuthBrandPanel';
import AuthRightFooter from '../../../components/layout/AuthRightFooter';
import EmailOtpForm from '../../../components/auth/EmailOtpForm';

const VerifyEmail: React.FC = () => {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const prefillEmail = searchParams.get('email') || '';

	const [verified, setVerified] = useState(false);

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
			}}
		>
			{/* Main Content Area: a single split card — brand panel (left) + form (right) */}
			<Box
				sx={{
					flex: 1,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					px: { xs: 2, md: 4 },
					py: { xs: 4, md: 6 },
				}}
			>
				<Fade in={true} timeout={600}>
					<Box
						sx={{
							position: 'relative',
							display: 'flex',
							flexDirection: { xs: 'column', md: 'row' },
							width: '100%',
							maxWidth: 1080,
							minHeight: { md: 620 },
							borderRadius: 4,
							overflow: 'hidden',
							border: '1px solid rgba(255, 255, 255, 0.07)',
							boxShadow: '0 30px 80px -20px rgba(0, 0, 0, 0.55)',
							bgcolor: '#0d0f18',
						}}
					>
						<AuthBrandPanel variant="success" activeStepIndex={verified ? 2 : undefined} />

						<Box
							sx={{
								flex: { md: '0 0 50%' },
								display: 'flex',
								flexDirection: 'column',
							}}
						>
							<Box
								sx={{
									flex: 1,
									display: 'flex',
									flexDirection: 'column',
									alignItems: 'center',
									justifyContent: 'center',
									px: { xs: 4, sm: 6, md: 7 },
									py: { xs: 6, md: 5 },
								}}
							>
								<Box sx={{ width: '100%', maxWidth: 380 }}>
									{/* Logo shown here only on mobile, where the brand panel is hidden */}
									<Box
										component="img"
										src="/assets/img/logo/gravit-dark.svg"
										alt="Gravit"
										sx={{ display: { xs: 'block', md: 'none' }, height: 36, mx: 'auto', mb: 4 }}
									/>

									{verified ? (
										<Box sx={{ textAlign: 'center' }}>
											<CheckCircleIcon sx={{ fontSize: 72, color: '#10b981', mb: 2 }} />
											<Typography variant="h5" sx={{ fontWeight: 700, color: '#F4F5F7', mb: 2 }}>
												Email Verified!
											</Typography>
											<Typography variant="body1" sx={{ color: '#94A3B8', mb: 4 }}>
												Your account is ready. You can log in now.
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
									) : (
										<EmailOtpForm
											email={prefillEmail}
											editableEmail
											onVerified={() => setVerified(true)}
										/>
									)}
								</Box>
							</Box>

							<AuthRightFooter />
						</Box>
					</Box>
				</Fade>
			</Box>
		</Box>
	);
};

export default VerifyEmail;
