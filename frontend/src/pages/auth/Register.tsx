import React from 'react';
import { Box, Typography, Link, Fade } from '@mui/material';
import RegisterForm from '../../components/auth/RegisterForm';
import AuthBrandPanel from '../../components/layout/AuthBrandPanel';

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
						<AuthBrandPanel />

						<Box
							sx={{
								flex: { md: '0 0 50%' },
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
								justifyContent: 'center',
								px: { xs: 4, sm: 6, md: 7 },
								py: { xs: 6, md: 5 },
							}}
						>
							<Box sx={{ width: '100%', maxWidth: 400 }}>
								{/* Logo shown here only on mobile, where the brand panel is hidden */}
								<Box
									component="img"
									src="/assets/img/logo/gravit-dark.svg"
									alt="Gravit"
									sx={{ display: { xs: 'block', md: 'none' }, height: 36, mx: 'auto', mb: 4 }}
								/>

								<RegisterForm />

								{/* Support link */}
								<Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 3, color: '#64748b' }}>
									Need help?{' '}
									<Link href="#" sx={{ color: '#8B7CF6', fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
										Contact our 24/7 support team
									</Link>
								</Typography>
							</Box>
						</Box>
					</Box>
				</Fade>
			</Box>
		</Box>
	);
};

export default Register;
