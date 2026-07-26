import React, { useEffect, useRef, useState } from 'react';
import { Box, Container, Stack, Typography, alpha, keyframes } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
	AutoAwesome as AutoAwesomeIcon,
	Groups as GroupsIcon,
	AccountTree as AccountTreeIcon,
	Schedule as ScheduleIcon,
	Badge as BadgeIcon,
	CalendarMonth as CalendarMonthIcon,
	CheckCircle as CheckCircleIcon,
	Lock as LockIcon,
} from '@mui/icons-material';
import Reveal from './Reveal';

const prefersReducedMotion = () =>
	typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const CAPABILITIES = [
	{ title: 'It plans', description: 'Breaks a request into concrete steps using what\'s already in your CRM, projects, and HR.' },
	{ title: 'It gets to work', description: 'Runs the steps itself — updating records, logging activity, drafting follow-ups.' },
	{ title: 'It asks before anything risky', description: 'Pauses for your OK before anything destructive, like cancelling a meeting.' },
];

const ORBIT_ITEMS = [
	{ icon: GroupsIcon, color: '#8B7CF6', radius: 66, duration: 16, delay: 0, reverse: false },
	{ icon: ScheduleIcon, color: '#f59e0b', radius: 66, duration: 16, delay: -8, reverse: false },
	{ icon: AccountTreeIcon, color: '#4EA8FF', radius: 118, duration: 24, delay: 0, reverse: true },
	{ icon: BadgeIcon, color: '#10b981', radius: 118, duration: 24, delay: -8, reverse: true },
	{ icon: CalendarMonthIcon, color: '#ef4444', radius: 118, duration: 24, delay: -16, reverse: true },
];

const FEED_ITEMS = [
	'Logged the call with Meridian Consulting',
	'Created 3 follow-up tasks for the Q3 proposal',
	"Reminded Priya about her pending leave approval",
	"Rescheduled Thursday's client call to 3 PM",
	'Flagged an overdue invoice on the Anchorpoint account',
	"Summarized this week's project status for handoff",
];

const spin = keyframes`from { transform: rotate(0deg); } to { transform: rotate(360deg); }`;
const spinCounter = keyframes`from { transform: rotate(-0deg); } to { transform: rotate(-360deg); }`;
const spinReverse = keyframes`from { transform: rotate(360deg); } to { transform: rotate(0deg); }`;
const spinReverseCounter = keyframes`from { transform: rotate(-360deg); } to { transform: rotate(-0deg); }`;
const slideFadeIn = keyframes`from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); }`;

const OrbitingCircles: React.FC = () => {
	const theme = useTheme();
	const reduced = prefersReducedMotion();

	return (
		<Box sx={{ position: 'relative', width: 260, height: 260, mx: 'auto' }}>
			{/* Ring guides */}
			{[132, 236].map((size) => (
				<Box
					key={size}
					sx={{
						position: 'absolute',
						top: '50%',
						left: '50%',
						width: size,
						height: size,
						transform: 'translate(-50%, -50%)',
						borderRadius: '50%',
						border: `1px dashed ${theme.palette.divider}`,
					}}
				/>
			))}

			{/* IRIS core */}
			<Box
				sx={{
					position: 'absolute',
					top: '50%',
					left: '50%',
					transform: 'translate(-50%, -50%)',
					width: 76,
					height: 76,
					borderRadius: '50%',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					background: theme.gradients.brandDiagonal,
					boxShadow: `0 12px 30px -8px ${alpha(theme.palette.primary.main, 0.6)}`,
					zIndex: 2,
				}}
			>
				<AutoAwesomeIcon sx={{ fontSize: 30, color: '#ffffff' }} />
			</Box>

			{ORBIT_ITEMS.map((item, i) => (
				<Box
					key={i}
					sx={{
						position: 'absolute',
						top: '50%',
						left: '50%',
						width: 0,
						height: 0,
						animation: reduced ? 'none' : `${item.reverse ? spinReverse : spin} ${item.duration}s linear infinite`,
						animationDelay: `${item.delay}s`,
						transform: reduced ? `rotate(${(i * 360) / ORBIT_ITEMS.length}deg)` : undefined,
					}}
				>
					<Box
						sx={{
							position: 'absolute',
							top: 0,
							left: item.radius,
							transform: 'translate(-50%, -50%)',
							animation: reduced ? 'none' : `${item.reverse ? spinReverseCounter : spinCounter} ${item.duration}s linear infinite`,
							animationDelay: `${item.delay}s`,
						}}
					>
						<Box
							sx={{
								width: 40,
								height: 40,
								borderRadius: '50%',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								bgcolor: theme.palette.background.paper,
								border: `1px solid ${theme.palette.divider}`,
								boxShadow: '0 6px 16px -6px rgba(15, 23, 42, 0.2)',
							}}
						>
							<item.icon sx={{ fontSize: 19, color: item.color }} />
						</Box>
					</Box>
				</Box>
			))}
		</Box>
	);
};

const AnimatedFeed: React.FC = () => {
	const theme = useTheme();
	const nextIndexRef = useRef(3);
	const idRef = useRef(3);
	const [items, setItems] = useState(() => FEED_ITEMS.slice(0, 3).map((text, i) => ({ id: i, text })));

	useEffect(() => {
		if (prefersReducedMotion()) return;
		const interval = setInterval(() => {
			setItems((prev) => {
				const text = FEED_ITEMS[nextIndexRef.current % FEED_ITEMS.length];
				nextIndexRef.current += 1;
				const id = idRef.current++;
				return [...prev, { id, text }].slice(-4);
			});
		}, 2600);
		return () => clearInterval(interval);
	}, []);

	return (
		<Stack spacing={1}>
			{items.map((item) => (
				<Stack
					key={item.id}
					direction="row"
					spacing={1}
					alignItems="center"
					sx={{
						px: 1.5,
						py: 1,
						borderRadius: theme.layout.radius.card,
						border: `1px solid ${theme.palette.divider}`,
						bgcolor: theme.palette.background.paper,
						animation: `${slideFadeIn} 400ms ease-out`,
					}}
				>
					<CheckCircleIcon sx={{ fontSize: 14, color: theme.palette.success.main, flexShrink: 0 }} />
					<Typography sx={{ fontSize: '0.8rem', color: theme.palette.text.primary, lineHeight: 1.4 }}>{item.text}</Typography>
				</Stack>
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
				<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '0.9fr 1.1fr' }, gap: { xs: 6, md: 8 }, alignItems: 'center' }}>
					<Reveal>
						<Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
							<AutoAwesomeIcon sx={{ fontSize: 18, color: theme.palette.primary.main }} />
							<Typography sx={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: theme.palette.primary.main }}>
								Meet IRIS
							</Typography>
						</Stack>
						<Typography component="h2" variant="h2" sx={{ color: theme.palette.text.primary, mb: 2.5 }}>
							It's the one teammate who can see your whole business
						</Typography>
						<Typography sx={{ color: theme.palette.text.secondary, fontSize: '1.05rem', lineHeight: 1.65, mb: 5 }}>
							Every other tool gives you a chatbot bolted onto its own little corner. IRIS sits in
							the middle of everything — sales, delivery, time, people — and can actually do
							something about what it sees, with you always able to say no first.
						</Typography>

						<Stack spacing={3}>
							{CAPABILITIES.map((cap) => (
								<Box key={cap.title}>
									<Typography sx={{ fontWeight: 700, color: theme.palette.text.primary, mb: 0.25 }}>{cap.title}</Typography>
									<Typography sx={{ color: theme.palette.text.secondary, fontSize: '0.9rem', lineHeight: 1.6 }}>{cap.description}</Typography>
								</Box>
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
								p: { xs: 3, sm: 4 },
							}}
						>
							<OrbitingCircles />

							<Typography sx={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: theme.palette.text.secondary, mt: 3, mb: 2 }}>
								Working right now
							</Typography>

							<AnimatedFeed />

							<Stack
								direction="row"
								alignItems="center"
								spacing={1}
								sx={{ mt: 2.5, p: 1.5, borderRadius: theme.layout.radius.card, border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`, bgcolor: alpha(theme.palette.warning.main, 0.08) }}
							>
								<LockIcon sx={{ fontSize: 16, color: theme.palette.warning.dark }} />
								<Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: theme.palette.text.primary }}>
									Anything risky — like cancelling a meeting — always waits for your OK first.
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
