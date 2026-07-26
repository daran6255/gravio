import React, { useEffect, useRef, useState } from 'react';
import { Box, Container, Stack, Typography, alpha, keyframes } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
	Groups as GroupsIcon,
	AccountTree as AccountTreeIcon,
	Schedule as ScheduleIcon,
	Badge as BadgeIcon,
	CalendarMonth as CalendarMonthIcon,
	ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import Reveal from './Reveal';

const prefersReducedMotion = () =>
	typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Fires once, true the moment the wrapped element first enters the viewport —
// used to trigger each card's "draw itself in" micro-animation on scroll.
const useOnceVisible = <T extends HTMLElement>() => {
	const ref = useRef<T | null>(null);
	const [visible, setVisible] = useState(prefersReducedMotion());

	useEffect(() => {
		if (visible) return;
		const node = ref.current;
		if (!node) return;
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					setVisible(true);
					observer.disconnect();
				}
			},
			{ threshold: 0.3 },
		);
		observer.observe(node);
		return () => observer.disconnect();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return { ref, visible };
};

// Bento-grid spans on a 4-column desktop grid (sum to 4 per row): CRM+Projects (2+2),
// then Timesheets+HR&Payroll+Booking (1+2+1). Every card carries its own small,
// always-on animated visual matched to its subject.
const MODULES = [
	{
		icon: GroupsIcon,
		lead: 'Never lose a lead in your inbox again.',
		description: 'Every call and email gets logged as an activity IRIS can reference later — nothing falls through the cracks.',
		color: '#8B7CF6',
		colSpan: { xs: 1, sm: 2, md: 2 },
		visual: 'pipeline' as const,
	},
	{
		icon: AccountTreeIcon,
		lead: 'Know exactly where every project stands.',
		description: 'Boards, tasks, and timelines for delivery work — plus a shareable status link so clients stay updated without a login.',
		color: '#4EA8FF',
		colSpan: { xs: 1, sm: 2, md: 2 },
		visual: 'board' as const,
	},
	{
		icon: ScheduleIcon,
		lead: 'Get paid for every hour you work.',
		description: 'Log billable time against real projects and clients — no spreadsheets, no separate subscription.',
		color: '#f59e0b',
		colSpan: { xs: 1, sm: 2, md: 1 },
		visual: 'timesheet' as const,
	},
	{
		icon: BadgeIcon,
		lead: 'Run payroll without a second system.',
		description: 'Employee records, leave, payslips, and salary structures, right alongside the client work your team bills for.',
		color: '#10b981',
		colSpan: { xs: 1, sm: 2, md: 2 },
		visual: 'hr' as const,
	},
	{
		icon: CalendarMonthIcon,
		lead: 'Stop the back-and-forth over scheduling.',
		description: 'Publish a booking page for prospects and clients — reschedule or cancel without another email thread.',
		color: '#ef4444',
		colSpan: { xs: 1, sm: 2, md: 1 },
		visual: 'booking' as const,
	},
];

const pulse = keyframes`
	0%, 100% { opacity: 0.35; transform: scale(0.92); }
	50% { opacity: 1; transform: scale(1); }
`;

const shimmer = keyframes`
	0% { transform: translateX(-100%); }
	100% { transform: translateX(320%); }
`;

const PipelineVisual: React.FC<{ color: string }> = ({ color }) => {
	const { ref, visible } = useOnceVisible<HTMLDivElement>();
	// Widths as a share of the bar's total track — each segment grows independently
	// left-to-right on scroll-in rather than being statically sized.
	const segments = [
		{ width: 50, shade: 0.25 },
		{ width: 33, shade: 0.5 },
		{ width: 17, shade: 1 },
	];

	return (
		<Stack ref={ref} spacing={1.25} sx={{ mb: 3 }}>
			<Stack direction="row" spacing={-0.75}>
				{[0, 1, 2, 3].map((i) => (
					<Box
						key={i}
						sx={{
							width: 28,
							height: 28,
							borderRadius: '50%',
							border: '2.5px solid',
							borderColor: 'background.paper',
							background: `linear-gradient(135deg, ${alpha(color, 0.5 + i * 0.1)}, ${alpha(color, 0.25 + i * 0.1)})`,
							boxShadow: `0 2px 6px ${alpha(color, 0.25)}`,
							ml: i === 0 ? 0 : -0.75,
						}}
					/>
				))}
			</Stack>
			<Stack direction="row" spacing={0.6} sx={{ height: 7 }}>
				{segments.map((seg, i) => (
					<Box
						key={i}
						sx={{
							width: `${seg.width}%`,
							borderRadius: 4,
							bgcolor: alpha(color, seg.shade),
							transform: visible ? 'scaleX(1)' : 'scaleX(0)',
							transformOrigin: 'left center',
							transition: `transform 600ms ease-out ${i * 150}ms`,
						}}
					/>
				))}
			</Stack>
		</Stack>
	);
};

const BoardVisual: React.FC<{ color: string }> = ({ color }) => {
	const { ref, visible } = useOnceVisible<HTMLDivElement>();
	const heights = [0.5, 1, 0.7, 0.3];

	return (
		<Stack ref={ref} direction="row" spacing={1.25} alignItems="flex-end" sx={{ height: 44, mb: 3 }}>
			{heights.map((h, i) => (
				<Box
					key={i}
					sx={{
						flex: 1,
						height: visible ? `${h * 100}%` : '4%',
						borderRadius: '6px 6px 2px 2px',
						background: `linear-gradient(180deg, ${alpha(color, 0.85 - i * 0.1)}, ${alpha(color, 0.35 - i * 0.05)})`,
						boxShadow: `0 4px 10px -4px ${alpha(color, 0.4)}`,
						transition: `height 600ms ease-out ${i * 100}ms`,
					}}
				/>
			))}
		</Stack>
	);
};

const TimesheetVisual: React.FC<{ color: string }> = ({ color }) => (
	<Box sx={{ mb: 3, height: 28, display: 'flex', alignItems: 'center' }}>
		<Box sx={{ position: 'relative', width: '100%', height: 7, borderRadius: 4, bgcolor: alpha(color, 0.15), overflow: 'hidden' }}>
			<Box
				sx={{
					position: 'absolute',
					inset: 0,
					width: '35%',
					borderRadius: 4,
					background: `linear-gradient(90deg, ${color} 0%, ${alpha(color, 0.6)} 100%)`,
					boxShadow: `0 0 12px ${alpha(color, 0.5)}`,
				}}
			/>
			<Box
				sx={{
					position: 'absolute',
					inset: 0,
					width: '30%',
					background: `linear-gradient(90deg, transparent, ${alpha('#ffffff', 0.7)}, transparent)`,
					animation: `${shimmer} 2.6s ease-in-out infinite`,
					'@media (prefers-reduced-motion: reduce)': { animation: 'none' },
				}}
			/>
		</Box>
	</Box>
);

const HRVisual: React.FC<{ color: string }> = ({ color }) => (
	<Stack direction="row" spacing={1.1} sx={{ mb: 3 }}>
		{[0, 1, 2, 3, 4].map((i) => (
			<Box
				key={i}
				sx={{
					width: 26,
					height: 26,
					borderRadius: '50%',
					background: `linear-gradient(135deg, ${alpha(color, 0.5)}, ${alpha(color, 0.2)})`,
					border: `1px solid ${alpha(color, 0.3)}`,
					animation: `${pulse} 3s ease-in-out infinite`,
					animationDelay: `${i * 0.4}s`,
					'@media (prefers-reduced-motion: reduce)': { animation: 'none', opacity: 0.6 },
				}}
			/>
		))}
	</Stack>
);

const BookingVisual: React.FC<{ color: string }> = ({ color }) => (
	<Box sx={{ mb: 3, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.6, maxWidth: 168 }}>
		{Array.from({ length: 14 }).map((_, i) => (
			<Box
				key={i}
				sx={{
					width: '100%',
					aspectRatio: '1',
					borderRadius: 1,
					background: i === 9 ? `linear-gradient(135deg, ${color}, ${alpha(color, 0.7)})` : alpha(color, 0.12),
					boxShadow: i === 9 ? `0 3px 10px ${alpha(color, 0.5)}` : 'none',
					animation: i === 9 ? `${pulse} 2.2s ease-in-out infinite` : 'none',
					'@media (prefers-reduced-motion: reduce)': { animation: 'none' },
				}}
			/>
		))}
	</Box>
);

const FeaturesSection: React.FC = () => {
	const theme = useTheme();
	const bentoRadius = '24px';

	const scrollToPreview = () => document.querySelector('#preview')?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });

	return (
		<Box component="section" id="platform" sx={{ position: 'relative', overflow: 'hidden', bgcolor: theme.palette.background.default, py: { xs: 9, md: 12 } }}>
			{/* Ambient background glows, matching the rest of the page's depth language */}
			<Box
				sx={{
					position: 'absolute',
					top: '-10%',
					right: '-8%',
					width: 480,
					height: 480,
					borderRadius: '50%',
					background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.06)} 0%, transparent 70%)`,
					pointerEvents: 'none',
				}}
			/>
			<Box
				sx={{
					position: 'absolute',
					bottom: '-15%',
					left: '-10%',
					width: 440,
					height: 440,
					borderRadius: '50%',
					background: `radial-gradient(circle, ${alpha(theme.palette.accent.main, 0.05)} 0%, transparent 70%)`,
					pointerEvents: 'none',
				}}
			/>

			<Container maxWidth="lg" sx={{ position: 'relative' }}>
				<Reveal>
					<Box sx={{ textAlign: 'center', maxWidth: 640, mx: 'auto', mb: { xs: 6, md: 7 } }}>
						<Typography sx={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: theme.palette.accent.dark, mb: 1.5 }}>
							The Platform
						</Typography>
						<Typography component="h2" variant="h2" sx={{ color: theme.palette.text.primary, mb: 2 }}>
							Everything your business runs on, in one place
						</Typography>
						<Typography sx={{ color: theme.palette.text.secondary, fontSize: '1.05rem', lineHeight: 1.65 }}>
							Every part of your day-to-day, sharing the same data and the same AI help.
						</Typography>
					</Box>
				</Reveal>

				<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3 }}>
					{MODULES.map((module, i) => {
						const isWide = module.colSpan.md === 2;
						return (
							<Reveal
								key={module.lead}
								delay={i * 60}
								sx={{ gridColumn: { xs: `span ${module.colSpan.xs}`, sm: `span ${module.colSpan.sm}`, md: `span ${module.colSpan.md}` }, height: '100%' }}
							>
								<Box
									onMouseMove={(e: React.MouseEvent<HTMLDivElement>) => {
										const rect = e.currentTarget.getBoundingClientRect();
										e.currentTarget.style.setProperty('--x', `${e.clientX - rect.left}px`);
										e.currentTarget.style.setProperty('--y', `${e.clientY - rect.top}px`);
									}}
									sx={{
										position: 'relative',
										height: '100%',
										p: { xs: 3, sm: 4 },
										pb: 5.5,
										borderRadius: bentoRadius,
										border: `1px solid ${theme.palette.divider}`,
										background: `linear-gradient(160deg, ${theme.palette.background.paper} 0%, ${alpha(module.color, 0.02)} 100%)`,
										boxShadow: `0 1px 2px rgba(15,23,42,0.04), 0 12px 28px -20px ${alpha(module.color, 0.35)}`,
										overflow: 'hidden',
										transition: 'transform 280ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 280ms ease-out, border-color 280ms ease-out',
										'&::after': {
											content: '""',
											position: 'absolute',
											top: -60,
											right: -60,
											width: 180,
											height: 180,
											borderRadius: '50%',
											background: `radial-gradient(circle, ${alpha(module.color, 0.16)} 0%, transparent 72%)`,
											pointerEvents: 'none',
											transition: 'opacity 280ms ease-out, transform 280ms ease-out',
										},
										'&::before': {
											content: '""',
											position: 'absolute',
											inset: 0,
											borderRadius: 'inherit',
											background: `radial-gradient(320px circle at var(--x, 50%) var(--y, 50%), ${alpha(module.color, 0.14)}, transparent 70%)`,
											opacity: 0,
											transition: 'opacity 250ms ease-out',
											pointerEvents: 'none',
										},
										'&:hover': {
											transform: 'translateY(-6px)',
											borderColor: alpha(module.color, 0.5),
											boxShadow: `0 1px 2px rgba(15,23,42,0.04), 0 24px 48px -20px ${alpha(module.color, 0.5)}`,
										},
										'&:hover::after': { transform: 'scale(1.15)' },
										'&:hover::before': { opacity: 1 },
										'&:hover .bento-icon-chip': { transform: 'rotate(-6deg) scale(1.06)' },
										'&:hover .bento-learn-more': { opacity: 1, transform: 'translateX(0)' },
										'@media (hover: none)': { '&::before': { display: 'none' } },
									}}
								>
									{module.visual === 'pipeline' && <PipelineVisual color={module.color} />}
									{module.visual === 'board' && <BoardVisual color={module.color} />}
									{module.visual === 'timesheet' && <TimesheetVisual color={module.color} />}
									{module.visual === 'hr' && <HRVisual color={module.color} />}
									{module.visual === 'booking' && <BookingVisual color={module.color} />}

									<Box
										className="bento-icon-chip"
										sx={{
											position: 'relative',
											width: 52,
											height: 52,
											borderRadius: '16px',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											background: `linear-gradient(135deg, ${alpha(module.color, 0.22)}, ${alpha(module.color, 0.06)})`,
											border: `1px solid ${alpha(module.color, 0.18)}`,
											boxShadow: `0 6px 16px -6px ${alpha(module.color, 0.4)}`,
											transition: 'transform 280ms cubic-bezier(0.22, 1, 0.36, 1)',
											mb: 2.75,
										}}
									>
										<module.icon sx={{ fontSize: 26, color: module.color }} />
									</Box>
									<Typography
										sx={{
											position: 'relative',
											fontWeight: 800,
											fontSize: isWide ? '1.3rem' : '1.15rem',
											color: theme.palette.text.primary,
											mb: 1.25,
											lineHeight: 1.3,
											letterSpacing: '-0.01em',
										}}
									>
										{module.lead}
									</Typography>
									<Typography sx={{ position: 'relative', color: theme.palette.text.secondary, fontSize: '0.92rem', lineHeight: 1.65, maxWidth: isWide ? 420 : undefined }}>
										{module.description}
									</Typography>

									<Stack
										className="bento-learn-more"
										direction="row"
										alignItems="center"
										spacing={0.5}
										onClick={scrollToPreview}
										sx={{
											position: 'absolute',
											left: { xs: 24, sm: 32 },
											bottom: 20,
											cursor: 'pointer',
											opacity: 0,
											transform: 'translateX(-6px)',
											transition: 'opacity 220ms ease-out, transform 220ms ease-out',
											'&:hover .bento-arrow': { transform: 'translateX(3px)' },
										}}
									>
										<Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: module.color }}>See it in the product</Typography>
										<ArrowForwardIcon className="bento-arrow" sx={{ fontSize: 14, color: module.color, transition: 'transform 200ms ease-out' }} />
									</Stack>
								</Box>
							</Reveal>
						);
					})}
				</Box>
			</Container>
		</Box>
	);
};

export default FeaturesSection;
