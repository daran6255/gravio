import React from 'react';
import { Box, Container, Stack, Typography, alpha, keyframes } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
	AutoAwesome as AutoAwesomeIcon,
	Psychology as PsychologyIcon,
	Bolt as BoltIcon,
	FactCheck as FactCheckIcon,
	Visibility as VisibilityIcon,
	CheckCircle as CheckCircleIcon,
	Lock as LockIcon,
} from '@mui/icons-material';
import Reveal from './Reveal';

const CAPABILITIES = [
	{ icon: PsychologyIcon, title: 'Plans', description: 'Breaks a request into concrete steps using your live CRM, project, and HR data.' },
	{ icon: BoltIcon, title: 'Executes', description: 'Runs the steps itself — updating records, logging activity, drafting follow-ups.' },
	{ icon: FactCheckIcon, title: 'Asks first', description: 'Pauses for your approval before anything destructive, like cancelling a meeting.' },
	{ icon: VisibilityIcon, title: 'Logs everything', description: 'Every action is journaled, so you can see exactly what IRIS did and why.' },
];

const pulse = keyframes`
	0%, 80%, 100% { opacity: 0.25; transform: scale(0.85); }
	40% { opacity: 1; transform: scale(1); }
`;

const TypingDots: React.FC = () => {
	const theme = useTheme();
	return (
		<Stack direction="row" spacing={0.5}>
			{[0, 1, 2].map((i) => (
				<Box
					key={i}
					sx={{
						width: 6,
						height: 6,
						borderRadius: '50%',
						bgcolor: theme.palette.primary.main,
						animation: `${pulse} 1.4s ease-in-out ${i * 0.15}s infinite`,
						'@media (prefers-reduced-motion: reduce)': { animation: 'none', opacity: 0.6 },
					}}
				/>
			))}
		</Stack>
	);
};

const IRISSection: React.FC = () => {
	const theme = useTheme();

	return (
		<Box component="section" id="iris" sx={{ position: 'relative', overflow: 'hidden', bgcolor: theme.palette.background.paper, py: { xs: 9, md: 12 } }}>
			<Box
				sx={{
					position: 'absolute',
					top: '10%',
					left: '50%',
					transform: 'translateX(-50%)',
					width: 760,
					height: 760,
					borderRadius: '50%',
					background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.06)} 0%, transparent 70%)`,
					pointerEvents: 'none',
				}}
			/>

			<Container maxWidth="lg" sx={{ position: 'relative' }}>
				<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '0.95fr 1.05fr' }, gap: { xs: 6, md: 8 }, alignItems: 'center' }}>
					<Reveal>
						<Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
							<AutoAwesomeIcon sx={{ fontSize: 18, color: theme.palette.primary.main }} />
							<Typography sx={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: theme.palette.primary.main }}>
								Meet IRIS
							</Typography>
						</Stack>
						<Typography component="h2" variant="h2" sx={{ color: theme.palette.text.primary, mb: 2.5 }}>
							One AI agent that already knows your business
						</Typography>
						<Typography sx={{ color: theme.palette.text.secondary, fontSize: '1.05rem', lineHeight: 1.65, mb: 5 }}>
							Every other tool bolts AI onto its own silo. IRIS sits underneath all of Gravit's
							modules at once — CRM, projects, timesheets, HR — so one request can act across
							several of them, with you always in control of what actually executes.
						</Typography>

						<Stack spacing={3}>
							{CAPABILITIES.map((cap) => (
								<Stack key={cap.title} direction="row" spacing={2} alignItems="flex-start">
									<Box
										sx={{
											width: 40,
											height: 40,
											borderRadius: 1.5,
											flexShrink: 0,
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											bgcolor: alpha(theme.palette.primary.main, 0.1),
										}}
									>
										<cap.icon sx={{ fontSize: 20, color: theme.palette.primary.main }} />
									</Box>
									<Box>
										<Typography sx={{ fontWeight: 700, color: theme.palette.text.primary, mb: 0.25 }}>{cap.title}</Typography>
										<Typography sx={{ color: theme.palette.text.secondary, fontSize: '0.9rem', lineHeight: 1.6 }}>{cap.description}</Typography>
									</Box>
								</Stack>
							))}
						</Stack>
					</Reveal>

					<Reveal delay={120}>
						<Box
							sx={{
								borderRadius: theme.layout.radius.card,
								border: `1px solid ${theme.palette.divider}`,
								background: theme.gradients.card,
								backdropFilter: 'blur(20px)',
								boxShadow: '0 24px 60px -24px rgba(15, 23, 42, 0.2)',
								p: { xs: 2.5, sm: 3.5 },
							}}
						>
							{/* User message */}
							<Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
								<Box sx={{ maxWidth: '85%', bgcolor: alpha(theme.palette.primary.main, 0.12), borderRadius: '16px 16px 4px 16px', px: 2, py: 1.5 }}>
									<Typography sx={{ fontSize: '0.88rem', color: theme.palette.text.primary, lineHeight: 1.55 }}>
										Log this call as a CRM activity, create a follow-up task, and check if this client
										has any overdue invoices.
									</Typography>
								</Box>
							</Stack>

							{/* IRIS response */}
							<Stack direction="row" spacing={1.5} sx={{ mb: 1 }}>
								<Box
									sx={{
										flexShrink: 0,
										width: 28,
										height: 28,
										borderRadius: '50%',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										background: theme.gradients.brandDiagonal,
									}}
								>
									<AutoAwesomeIcon sx={{ fontSize: 15, color: '#ffffff' }} />
								</Box>
								<Box sx={{ maxWidth: '85%', bgcolor: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}`, borderRadius: '16px 16px 16px 4px', px: 2, py: 1.5, flex: 1 }}>
									<Box sx={{ mb: 1 }}>
										<TypingDots />
									</Box>
									<Typography sx={{ fontSize: '0.88rem', color: theme.palette.text.primary, lineHeight: 1.55, mb: 1.5 }}>
										Done — here's what I did:
									</Typography>
									<Stack spacing={1}>
										{[
											'Logged the call as a CRM activity',
											'Created a follow-up task for tomorrow',
											'Checked invoices — none overdue',
										].map((item) => (
											<Stack key={item} direction="row" spacing={1} alignItems="center">
												<CheckCircleIcon sx={{ fontSize: 16, color: theme.palette.success.main }} />
												<Typography sx={{ fontSize: '0.82rem', color: theme.palette.text.secondary }}>{item}</Typography>
											</Stack>
										))}
									</Stack>
								</Box>
							</Stack>

							<Stack
								direction="row"
								alignItems="center"
								spacing={1}
								sx={{ mt: 2.5, p: 1.5, borderRadius: theme.layout.radius.card, border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`, bgcolor: alpha(theme.palette.warning.main, 0.08) }}
							>
								<LockIcon sx={{ fontSize: 16, color: theme.palette.warning.dark }} />
								<Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: theme.palette.text.primary }}>
									Destructive actions — like cancelling a meeting — always pause here for your approval first.
								</Typography>
							</Stack>
						</Box>
					</Reveal>
				</Box>
			</Container>
		</Box>
	);
};

export default IRISSection;
