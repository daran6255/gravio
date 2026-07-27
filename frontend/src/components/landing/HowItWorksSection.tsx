import React, { useEffect, useRef, useState } from 'react';
import { Box, Container, Typography, keyframes } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
	PersonAddAlt as PersonAddAltIcon,
	SettingsSuggest as SettingsSuggestIcon,
	AutoAwesome as AutoAwesomeIcon,
	Dashboard as DashboardIcon,
	CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import Reveal from './Reveal';

const prefersReducedMotion = () =>
	typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const useOnceVisible = <T extends HTMLElement>() => {
	const ref = useRef<T | null>(null);
	const [visible, setVisible] = useState(prefersReducedMotion());
	useEffect(() => {
		if (visible) return;
		const node = ref.current;
		if (!node) return;
		const observer = new IntersectionObserver(([entry]) => {
			if (entry.isIntersecting) {
				setVisible(true);
				observer.disconnect();
			}
		}, { threshold: 0.35 });
		observer.observe(node);
		return () => observer.disconnect();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);
	return { ref, visible };
};

const STEPS = [
	{ icon: PersonAddAltIcon, title: 'Bring your team in', description: 'Create your workspace and invite the people who\'ll actually use it — no lengthy setup project.' },
	{ icon: SettingsSuggestIcon, title: 'Connect your workflows', description: 'Set up your pipelines, projects, and org structure the way your business already runs.' },
	{ icon: AutoAwesomeIcon, title: 'IRIS starts working', description: 'The AI agent picks up context across every module from day one — no separate training step.' },
	{ icon: DashboardIcon, title: 'See everything in one place', description: 'Sales, delivery, time, and people data — one dashboard instead of five logins.' },
];

const popIn = keyframes`
	0% { transform: scale(0.5); opacity: 0; }
	60% { transform: scale(1.15); opacity: 1; }
	100% { transform: scale(1); opacity: 1; }
`;

const activePulse = keyframes`
	0%, 100% { box-shadow: 0 0 0 0 rgba(139, 124, 246, 0.35); }
	50% { box-shadow: 0 0 0 8px rgba(139, 124, 246, 0); }
`;

const HowItWorksSection: React.FC = () => {
	const theme = useTheme();
	const { ref, visible } = useOnceVisible<HTMLDivElement>();

	// Plays once, the moment the steps scroll into view: each circle lights up
	// (active pulse), then flips to a green check before the next one starts —
	// reads as the steps completing one by one, not a static checklist.
	const [doneCount, setDoneCount] = useState(prefersReducedMotion() ? STEPS.length : 0);
	const [activeIndex, setActiveIndex] = useState<number | null>(null);

	useEffect(() => {
		if (!visible || prefersReducedMotion()) return;
		let cancelled = false;
		let timeoutId: ReturnType<typeof setTimeout>;

		const runStep = (i: number) => {
			if (cancelled) return;
			// Activate this step (pulse + scale)
			setActiveIndex(i);
			setDoneCount(i); // steps before i are green; i is active

			timeoutId = setTimeout(() => {
				if (cancelled) return;
				// Mark it done (green check)
				setDoneCount(i + 1);
				setActiveIndex(null);

				timeoutId = setTimeout(() => {
					if (i + 1 < STEPS.length) {
						// Move to the next step
						runStep(i + 1);
					} else {
						// All done — pause briefly then restart from zero
						timeoutId = setTimeout(() => {
							if (cancelled) return;
							setDoneCount(0);
							setActiveIndex(null);
							timeoutId = setTimeout(() => runStep(0), 300);
						}, 1200);
					}
				}, 280);
			}, 650);
		};

		timeoutId = setTimeout(() => runStep(0), 500);
		return () => {
			cancelled = true;
			clearTimeout(timeoutId);
		};
	}, [visible]);

	const segments = STEPS.length - 1;
	const progressPercent = segments > 0 ? (Math.min(doneCount, segments) / segments) * 100 : 0;

	return (
		<Box component="section" id="how-it-works" sx={{ bgcolor: theme.palette.background.default, py: { xs: 9, md: 12 } }}>
			<Container maxWidth="lg">
				<Reveal>
					<Box sx={{ textAlign: 'center', maxWidth: 560, mx: 'auto', mb: { xs: 6, md: 7 } }}>
						<Typography sx={{ fontSize: theme.typography.chipLabel.fontSize, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: theme.palette.accent.dark, mb: 1.5 }}>
							How It Works
						</Typography>
						<Typography component="h2" variant="h2" sx={{ color: theme.palette.text.primary }}>
							Up and running in four steps
						</Typography>
					</Box>
				</Reveal>

				<Box
					ref={ref}
					sx={{
						position: 'relative',
						display: 'grid',
						gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
						gap: 3,
					}}
				>
					{/* Connecting line on desktop — gray track plus an animated green fill
					    that catches up to whichever step just completed. */}
					<Box
						sx={{
							display: { xs: 'none', md: 'block' },
							position: 'absolute',
							top: 28,
							left: '12.5%',
							right: '12.5%',
							height: '1px',
							bgcolor: theme.palette.divider,
							overflow: 'hidden',
						}}
					>
						<Box
							sx={{
								height: '100%',
								width: `${progressPercent}%`,
								bgcolor: theme.palette.success.main,
								transition: 'width 500ms ease-out',
							}}
						/>
					</Box>

					{STEPS.map((step, i) => {
						const isDone = i < doneCount;
						const isActive = i === activeIndex;

						return (
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
											bgcolor: isDone ? theme.palette.success.main : theme.palette.background.paper,
											border: `2px solid ${isDone ? theme.palette.success.main : theme.palette.primary.main}`,
											transform: isActive ? 'scale(1.08)' : 'scale(1)',
											transition: 'background-color 320ms ease-out, border-color 320ms ease-out, transform 320ms ease-out',
											animation: isActive ? `${activePulse} 1s ease-out infinite` : 'none',
											'@media (prefers-reduced-motion: reduce)': { animation: 'none', transform: 'none' },
										}}
									>
										{isDone ? (
											<CheckCircleIcon
												sx={{
													fontSize: 28,
													color: theme.palette.common.white,
													animation: `${popIn} 420ms cubic-bezier(0.34, 1.56, 0.64, 1)`,
													'@media (prefers-reduced-motion: reduce)': { animation: 'none' },
												}}
											/>
										) : (
											<step.icon sx={{ fontSize: 26, color: theme.palette.primary.main }} />
										)}
									</Box>
									<Typography
										sx={{
											fontSize: theme.typography.caption.fontSize,
											fontWeight: 700,
											color: isDone ? theme.palette.success.main : theme.palette.primary.main,
											mb: 0.5,
											transition: 'color 320ms ease-out',
										}}
									>
										STEP {i + 1}
									</Typography>
									<Typography sx={{ fontWeight: 700, fontSize: theme.typography.h6.fontSize, color: theme.palette.text.primary, mb: 1 }}>
										{step.title}
									</Typography>
									<Typography sx={{ color: theme.palette.text.secondary, fontSize: theme.typography.body2.fontSize, lineHeight: 1.6 }}>
										{step.description}
									</Typography>
								</Box>
							</Reveal>
						);
					})}
				</Box>
			</Container>
		</Box>
	);
};

export default HowItWorksSection;
