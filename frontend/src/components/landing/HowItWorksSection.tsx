import React from 'react';
import { Box, Container, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
	PersonAddAlt as PersonAddAltIcon,
	SettingsSuggest as SettingsSuggestIcon,
	AutoAwesome as AutoAwesomeIcon,
	Dashboard as DashboardIcon,
} from '@mui/icons-material';
import Reveal from './Reveal';

const STEPS = [
	{ icon: PersonAddAltIcon, title: 'Bring your team in', description: 'Create your workspace and invite the people who\'ll actually use it — no lengthy setup project.' },
	{ icon: SettingsSuggestIcon, title: 'Connect your workflows', description: 'Set up your pipelines, projects, and org structure the way your business already runs.' },
	{ icon: AutoAwesomeIcon, title: 'IRIS starts working', description: 'The AI agent picks up context across every module from day one — no separate training step.' },
	{ icon: DashboardIcon, title: 'See everything in one place', description: 'Sales, delivery, time, and people data — one dashboard instead of five logins.' },
];

const HowItWorksSection: React.FC = () => {
	const theme = useTheme();

	return (
		<Box component="section" id="how-it-works" sx={{ bgcolor: theme.palette.background.default, py: { xs: 9, md: 12 } }}>
			<Container maxWidth="lg">
				<Reveal>
					<Box sx={{ textAlign: 'center', maxWidth: 560, mx: 'auto', mb: { xs: 6, md: 7 } }}>
						<Typography sx={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: theme.palette.accent.dark, mb: 1.5 }}>
							How It Works
						</Typography>
						<Typography component="h2" variant="h2" sx={{ color: theme.palette.text.primary }}>
							Up and running in four steps
						</Typography>
					</Box>
				</Reveal>

				<Box
					sx={{
						position: 'relative',
						display: 'grid',
						gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
						gap: 3,
					}}
				>
					{/* Connecting line on desktop */}
					<Box
						sx={{
							display: { xs: 'none', md: 'block' },
							position: 'absolute',
							top: 28,
							left: '12.5%',
							right: '12.5%',
							height: '1px',
							bgcolor: theme.palette.divider,
						}}
					/>

					{STEPS.map((step, i) => (
						<Reveal key={step.title} delay={i * 80}>
							<Box sx={{ position: 'relative', textAlign: { xs: 'left', md: 'center' } }}>
								<Box
									sx={{
										position: 'relative',
										zIndex: 1,
										width: 56,
										height: 56,
										mx: { xs: 0, md: 'auto' },
										mb: 2.5,
										borderRadius: '50%',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										bgcolor: theme.palette.background.paper,
										border: `2px solid ${theme.palette.primary.main}`,
									}}
								>
									<step.icon sx={{ fontSize: 26, color: theme.palette.primary.main }} />
								</Box>
								<Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: theme.palette.primary.main, mb: 0.5 }}>
									STEP {i + 1}
								</Typography>
								<Typography sx={{ fontWeight: 700, fontSize: '1.05rem', color: theme.palette.text.primary, mb: 1 }}>
									{step.title}
								</Typography>
								<Typography sx={{ color: theme.palette.text.secondary, fontSize: '0.9rem', lineHeight: 1.6 }}>
									{step.description}
								</Typography>
							</Box>
						</Reveal>
					))}
				</Box>
			</Container>
		</Box>
	);
};

export default HowItWorksSection;
