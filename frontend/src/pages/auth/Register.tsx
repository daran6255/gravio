import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { HelpOutline as HelpOutlineIcon } from '@mui/icons-material';
import AuthNavbar from '../../components/layout/AuthNavbar';
import AuthFooter from '../../components/layout/AuthFooter';
import RegisterForm from '../../components/auth/RegisterForm';
import AntigravityBackground from '../../components/common/bg-anim/AntigravityBackground';

const Register: React.FC = () => {
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
			<AntigravityBackground />
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
					pb: { xs: 3, md: '76px' },
					px: 2,
					zIndex: 5,
				}}
			>
				{/* Refactored Onboarding Registration Form Component */}
				<Box sx={{ width: '100%', maxWidth: 480 }}>
					<RegisterForm />
				</Box>

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
