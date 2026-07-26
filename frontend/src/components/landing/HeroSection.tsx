import React from 'react';
import { Box, Button, Container, Stack, Typography, alpha } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import {
	ArrowForward as ArrowForwardIcon,
	AutoAwesome as AutoAwesomeIcon,
	Groups as GroupsIcon,
	AccountTree as AccountTreeIcon,
	Schedule as ScheduleIcon,
	Badge as BadgeIcon,
	CalendarMonth as CalendarMonthIcon,
	KeyboardDoubleArrowDown as ArrowDownIcon,
} from '@mui/icons-material';
import Reveal from './Reveal';

const SOURCE_MODULES = [
	{ label: 'CRM', icon: GroupsIcon },
	{ label: 'Projects', icon: AccountTreeIcon },
	{ label: 'Timesheets', icon: ScheduleIcon },
	{ label: 'HR & Payroll', icon: BadgeIcon },
	{ label: 'Booking', icon: CalendarMonthIcon },
];

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

				{/* Abstract flow visual: five tools converging into one AI layer */}
				<Reveal delay={120}>
					<Box
						sx={{
							maxWidth: 860,
							mx: 'auto',
							borderRadius: theme.layout.radius.card,
							border: `1px solid ${theme.palette.divider}`,
							background: theme.gradients.card,
							backdropFilter: 'blur(20px)',
							boxShadow: '0 24px 60px -24px rgba(15, 23, 42, 0.18)',
							p: { xs: 3, sm: 5 },
						}}
					>
						<Stack direction="row" flexWrap="wrap" justifyContent="center" gap={1.5} sx={{ mb: 3 }}>
							{SOURCE_MODULES.map((mod) => (
								<Stack
									key={mod.label}
									direction="row"
									alignItems="center"
									spacing={1}
									sx={{
										px: 2,
										py: 1,
										borderRadius: theme.layout.radius.pill,
										border: `1px solid ${theme.palette.divider}`,
										bgcolor: theme.palette.background.paper,
									}}
								>
									<mod.icon sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
									<Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: theme.palette.text.primary }}>
										{mod.label}
									</Typography>
								</Stack>
							))}
						</Stack>

						<Stack alignItems="center" spacing={0.5} sx={{ mb: 3 }}>
							<ArrowDownIcon sx={{ color: theme.palette.text.secondary, opacity: 0.5 }} />
							<Typography sx={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: theme.palette.text.secondary }}>
								Unified by
							</Typography>
						</Stack>

						<Stack
							direction="row"
							alignItems="center"
							justifyContent="center"
							spacing={1.5}
							sx={{
								mx: 'auto',
								maxWidth: 340,
								px: 3,
								py: 2,
								borderRadius: theme.layout.radius.card,
								background: theme.gradients.brandDiagonal,
								boxShadow: `0 12px 30px -10px ${alpha(theme.palette.primary.main, 0.5)}`,
							}}
						>
							<AutoAwesomeIcon sx={{ color: '#ffffff' }} />
							<Box>
								<Typography sx={{ fontWeight: 800, color: '#ffffff', lineHeight: 1.2 }}>IRIS</Typography>
								<Typography sx={{ fontSize: '0.75rem', color: alpha('#ffffff', 0.85) }}>
									One AI, full cross-module context
								</Typography>
							</Box>
						</Stack>
					</Box>
				</Reveal>
			</Container>
		</Box>
	);
};

export default HeroSection;
