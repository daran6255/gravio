import React from 'react';
import { Box, Button, Container, Stack, Typography, alpha } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { ArrowForward as ArrowForwardIcon, AutoAwesome as AutoAwesomeIcon } from '@mui/icons-material';
import Reveal from './Reveal';

const HeroSection: React.FC = () => {
	const theme = useTheme();
	const navigate = useNavigate();

	return (
		<Box component="section" sx={{ position: 'relative', overflow: 'hidden', pt: { xs: 8, md: 11 }, pb: { xs: 9, md: 12 }, bgcolor: theme.palette.background.paper }}>
			{/* Soft ambient brand glow — subtle, not loud */}
			<Box
				sx={{
					position: 'absolute',
					top: '-20%',
					right: '-10%',
					width: 640,
					height: 640,
					borderRadius: '50%',
					background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.08)} 0%, transparent 70%)`,
					pointerEvents: 'none',
				}}
			/>
			<Box
				sx={{
					position: 'absolute',
					bottom: '-10%',
					left: '-15%',
					width: 520,
					height: 520,
					borderRadius: '50%',
					background: `radial-gradient(circle, ${alpha(theme.palette.accent.main, 0.07)} 0%, transparent 70%)`,
					pointerEvents: 'none',
				}}
			/>

			<Container maxWidth="lg" sx={{ position: 'relative' }}>
				<Reveal>
					<Box sx={{ textAlign: 'center', maxWidth: 780, mx: 'auto', mb: { xs: 6, md: 7 } }}>
						<Box
							sx={{
								display: 'inline-flex',
								alignItems: 'center',
								gap: 1,
								px: 2,
								py: 0.75,
								borderRadius: theme.layout.radius.pill,
								border: `1px solid ${alpha(theme.palette.primary.main, 0.25)}`,
								bgcolor: alpha(theme.palette.primary.main, 0.06),
								mb: 3.5,
							}}
						>
							<AutoAwesomeIcon sx={{ fontSize: 16, color: theme.palette.primary.main }} />
							<Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: theme.palette.text.primary }}>
								One system, one AI — not five separate subscriptions
							</Typography>
						</Box>

						<Typography
							component="h1"
							variant="h1"
							sx={{ color: theme.palette.text.primary, mb: 3, fontSize: { xs: '2.25rem', sm: '2.75rem', md: '3.35rem' } }}
						>
							Run your service business on one platform,{' '}
							<Box component="span" sx={{ color: theme.palette.primary.main }}>
								not five
							</Box>
						</Typography>

						<Typography sx={{ color: theme.palette.text.secondary, fontSize: '1.15rem', lineHeight: 1.65, maxWidth: 620, mx: 'auto', mb: 5 }}>
							Gravit replaces your CRM, project management, timesheets, HR & payroll, and meeting
							scheduling tools with one system — tied together by IRIS, an AI agent that works across
							all of it, so you stop paying every tool extra for its own bolted-on AI.
						</Typography>

						<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
							<Button
								size="large"
								variant="contained"
								endIcon={<ArrowForwardIcon />}
								onClick={() => navigate('/auth/register')}
								sx={{
									bgcolor: theme.palette.primary.main,
									color: '#ffffff',
									fontWeight: 700,
									fontSize: '1rem',
									px: 3.5,
									py: 1.4,
									borderRadius: theme.layout.radius.button,
									'&:hover': { bgcolor: theme.palette.primary.dark },
								}}
							>
								Start Free Trial
							</Button>
							<Button
								size="large"
								variant="outlined"
								onClick={() => document.querySelector('#how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
								sx={{
									color: theme.palette.text.primary,
									borderColor: theme.palette.divider,
									fontWeight: 700,
									fontSize: '1rem',
									px: 3.5,
									py: 1.4,
									borderRadius: theme.layout.radius.button,
									'&:hover': { borderColor: theme.palette.text.secondary, bgcolor: alpha(theme.palette.text.primary, 0.03) },
								}}
							>
								See How It Works
							</Button>
						</Stack>
					</Box>
				</Reveal>
			</Container>
		</Box>
	);
};

export default HeroSection;
