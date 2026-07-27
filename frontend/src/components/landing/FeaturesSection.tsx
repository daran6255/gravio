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
// then Timesheets+HR&Payroll+Booking (1+2+1). Every card carries a full-bleed animated
// visual matched to its subject, in the Magic UI bento-grid composition (visual behind,
// scrim + icon/title/description anchored at the base).
const MODULES = [
	{
		icon: GroupsIcon,
		lead: 'Never lose a lead in your inbox again.',
		description: 'Every call and email gets logged as an activity IRIS can reference later.',
		color: '#8B7CF6',
		colSpan: { xs: 1, sm: 2, md: 2 },
		visual: 'pipeline' as const,
	},
	{
		icon: AccountTreeIcon,
		lead: 'Know exactly where every project stands.',
		description: 'Boards, tasks, and timelines, plus a shareable status link for clients.',
		color: '#4EA8FF',
		colSpan: { xs: 1, sm: 2, md: 2 },
		visual: 'board' as const,
	},
	{
		icon: ScheduleIcon,
		lead: 'Get paid for every hour you work.',
		description: 'Log billable time against real projects and clients — no spreadsheets.',
		color: '#f59e0b',
		colSpan: { xs: 1, sm: 2, md: 1 },
		visual: 'timesheet' as const,
	},
	{
		icon: BadgeIcon,
		lead: 'Run payroll without a second system.',
		description: 'Employee records, leave, payslips, and salary structures — one place.',
		color: '#10b981',
		colSpan: { xs: 1, sm: 2, md: 2 },
		visual: 'hr' as const,
	},
	{
		icon: CalendarMonthIcon,
		lead: 'Stop the back-and-forth over scheduling.',
		description: 'Publish a booking page for prospects and clients to self-serve.',
		color: '#ef4444',
		colSpan: { xs: 1, sm: 2, md: 1 },
		visual: 'booking' as const,
	},
];

const pulse = keyframes`
	0%, 100% { opacity: 0.35; transform: scale(0.92); }
	50% { opacity: 1; transform: scale(1); }
`;

// Large avatar stack + flowing progress track, filling the card's upper/main area.
const PipelineVisual: React.FC<{ color: string }> = ({ color }) => {
	const theme = useTheme();
	const { ref, visible } = useOnceVisible<HTMLDivElement>();
	const segments = [
		{ width: 55, shade: 0.35 },
		{ width: 34, shade: 0.6 },
		{ width: 18, shade: 1 },
	];

	return (
		<Box ref={ref} sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', px: { xs: 5, sm: 7 }, pb: '28%' }}>
			<Stack direction="row" spacing={-1.75} sx={{ mb: 3.5 }}>
				{[0, 1, 2, 3, 4].map((i) => (
					<Box
						key={i}
						sx={{
							width: { xs: 44, sm: 54 },
							height: { xs: 44, sm: 54 },
							borderRadius: '50%',
							border: `3px solid ${theme.palette.background.default}`,
							background: `linear-gradient(135deg, ${alpha(color, 0.95 - i * 0.08)}, ${alpha(color, 0.5 - i * 0.05)})`,
							boxShadow: `0 10px 24px ${alpha(color, 0.4)}`,
							ml: i === 0 ? 0 : -1.75,
						}}
					/>
				))}
			</Stack>
			<Stack direction="row" spacing={1} sx={{ width: '100%', maxWidth: 320, height: { xs: 10, sm: 12 } }}>
				{segments.map((seg, i) => (
					<Box
						key={i}
						sx={{
							width: `${seg.width}%`,
							borderRadius: 6,
							bgcolor: alpha(color, seg.shade),
							boxShadow: i === segments.length - 1 ? `0 0 24px ${alpha(color, 0.65)}` : 'none',
							transform: visible ? 'scaleX(1)' : 'scaleX(0)',
							transformOrigin: 'left center',
							transition: `transform 700ms ease-out ${i * 150}ms`,
						}}
					/>
				))}
			</Stack>
		</Box>
	);
};

// Kanban-style bars, enlarged to read as the dominant shape in the card.
const BoardVisual: React.FC<{ color: string }> = ({ color }) => {
	const { ref, visible } = useOnceVisible<HTMLDivElement>();
	const heights = [0.42, 0.85, 1, 0.58, 0.32];

	return (
		<Stack ref={ref} direction="row" spacing={{ xs: 1.5, sm: 2 }} alignItems="flex-end" justifyContent="center" sx={{ position: 'absolute', inset: 0, px: { xs: 5, sm: 7 }, pb: '24%' }}>
			{heights.map((h, i) => (
				<Box
					key={i}
					sx={{
						width: { xs: 24, sm: 32 },
						height: visible ? `${h * 72}%` : '4%',
						borderRadius: '10px 10px 4px 4px',
						background: `linear-gradient(180deg, ${alpha(color, 0.95 - i * 0.08)}, ${alpha(color, 0.4 - i * 0.04)})`,
						boxShadow: `0 12px 26px -8px ${alpha(color, 0.5)}`,
						transition: `height 700ms ease-out ${i * 90}ms`,
					}}
				/>
			))}
		</Stack>
	);
};

// Large SVG progress ring standing in for "hours logged" — animates its sweep
// once on scroll-in via stroke-dashoffset (transform/opacity-adjacent, GPU friendly).
const TimesheetVisual: React.FC<{ color: string }> = ({ color }) => {
	const theme = useTheme();
	const { ref, visible } = useOnceVisible<HTMLDivElement>();
	const size = 168;
	const stroke = 11;
	const r = (size - stroke) / 2;
	const circumference = 2 * Math.PI * r;
	const progress = 0.72;

	return (
		<Box ref={ref} sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pb: '22%' }}>
			<Box sx={{ position: 'relative', width: { xs: 140, sm: size }, height: { xs: 140, sm: size } }}>
				<svg
					width="100%"
					height="100%"
					viewBox={`0 0 ${size} ${size}`}
					style={{ transform: 'rotate(-90deg)', filter: `drop-shadow(0 0 18px ${alpha(color, 0.45)})` }}
				>
					<circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={alpha(theme.palette.text.primary, 0.1)} strokeWidth={stroke} />
					<circle
						cx={size / 2}
						cy={size / 2}
						r={r}
						fill="none"
						stroke={color}
						strokeWidth={stroke}
						strokeLinecap="round"
						strokeDasharray={circumference}
						strokeDashoffset={visible ? circumference * (1 - progress) : circumference}
						style={{ transition: 'stroke-dashoffset 900ms ease-out' }}
					/>
				</svg>
				<Typography sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: { xs: '1.4rem', sm: '1.7rem' }, fontWeight: 800, color: theme.palette.common.white }}>
					72%
				</Typography>
			</Box>
		</Box>
	);
};

// Grid of pulsing avatars, enlarged into a near-full team roster shape.
const HRVisual: React.FC<{ color: string }> = ({ color }) => (
	<Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pb: '24%' }}>
		<Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: { xs: 1.5, sm: 2 }, width: { xs: 180, sm: 232 } }}>
			{Array.from({ length: 8 }).map((_, i) => (
				<Box
					key={i}
					sx={{
						width: { xs: 34, sm: 44 },
						height: { xs: 34, sm: 44 },
						borderRadius: '50%',
						background: `linear-gradient(135deg, ${alpha(color, 0.9)}, ${alpha(color, 0.4)})`,
						border: `1.5px solid ${alpha(color, 0.55)}`,
						boxShadow: `0 8px 18px -4px ${alpha(color, 0.45)}`,
						animation: `${pulse} 3s ease-in-out infinite`,
						animationDelay: `${i * 0.25}s`,
						'@media (prefers-reduced-motion: reduce)': { animation: 'none', opacity: 0.85 },
					}}
				/>
			))}
		</Box>
	</Box>
);

// Enlarged calendar grid with one highlighted, pulsing booked slot.
const BookingVisual: React.FC<{ color: string }> = ({ color }) => {
	const theme = useTheme();
	return (
		<Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pb: '24%' }}>
			<Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: { xs: 0.8, sm: 1 }, width: { xs: 196, sm: 234 } }}>
				{Array.from({ length: 21 }).map((_, i) => (
					<Box
						key={i}
						sx={{
							aspectRatio: '1',
							borderRadius: '6px',
							background: i === 15 ? `linear-gradient(135deg, ${color}, ${alpha(color, 0.7)})` : alpha(theme.palette.text.primary, 0.08),
							boxShadow: i === 15 ? `0 8px 20px ${alpha(color, 0.55)}` : 'none',
							animation: i === 15 ? `${pulse} 2.4s ease-in-out infinite` : 'none',
							'@media (prefers-reduced-motion: reduce)': { animation: 'none' },
						}}
					/>
				))}
			</Box>
		</Box>
	);
};

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
										minHeight: { xs: 300, sm: 340, md: 380 },
										borderRadius: bentoRadius,
										overflow: 'hidden',
										border: `1px solid ${theme.palette.divider}`,
										background: `radial-gradient(120% 90% at 50% 0%, ${alpha(module.color, 0.4)} 0%, ${alpha(module.color, 0.1)} 45%, ${theme.palette.background.default} 100%)`,
										boxShadow: `0 1px 2px rgba(15,23,42,0.04), 0 12px 28px -20px ${alpha(module.color, 0.4)}`,
										transition: 'transform 320ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 320ms ease-out, border-color 320ms ease-out',
										'&:hover': {
											transform: 'translateY(-8px)',
											borderColor: alpha(module.color, 0.6),
											boxShadow: `0 1px 2px rgba(15,23,42,0.04), 0 28px 56px -20px ${alpha(module.color, 0.55)}`,
										},
										'&:hover .bento-cursor-glow': { opacity: 1 },
										'&:hover .bento-visual-layer': { transform: 'scale(1.045)' },
										'&:hover .bento-icon-chip': { transform: 'scale(1.06)' },
										'&:hover .bento-learn-more': { opacity: 1, transform: 'translateY(0)' },
										'@media (hover: none)': { '& .bento-cursor-glow': { display: 'none' } },
										'@media (prefers-reduced-motion: reduce)': {
											transition: 'border-color 200ms ease-out, box-shadow 200ms ease-out',
											'&:hover': { transform: 'none' },
											'& .bento-visual-layer': { transition: 'none' },
											'&:hover .bento-visual-layer': { transform: 'none' },
										},
									}}
								>
									{/* Faint dot-grid texture beneath the visual, for depth */}
									<Box
										sx={{
											position: 'absolute',
											inset: 0,
											opacity: 0.5,
											backgroundImage: `radial-gradient(${alpha(theme.palette.text.primary, 0.14)} 1px, transparent 1px)`,
											backgroundSize: '18px 18px',
											maskImage: 'radial-gradient(ellipse at 50% 20%, black 0%, transparent 72%)',
											WebkitMaskImage: 'radial-gradient(ellipse at 50% 20%, black 0%, transparent 72%)',
										}}
									/>

									{/* Full-bleed visual, scaled up slightly on hover for a parallax-like depth effect */}
									<Box className="bento-visual-layer" sx={{ position: 'absolute', inset: 0, transition: 'transform 500ms cubic-bezier(0.22, 1, 0.36, 1)', willChange: 'transform' }}>
										{module.visual === 'pipeline' && <PipelineVisual color={module.color} />}
										{module.visual === 'board' && <BoardVisual color={module.color} />}
										{module.visual === 'timesheet' && <TimesheetVisual color={module.color} />}
										{module.visual === 'hr' && <HRVisual color={module.color} />}
										{module.visual === 'booking' && <BookingVisual color={module.color} />}
									</Box>

									{/* Cursor-follow glow */}
									<Box
										className="bento-cursor-glow"
										sx={{
											position: 'absolute',
											inset: 0,
											background: `radial-gradient(320px circle at var(--x, 50%) var(--y, 50%), ${alpha(theme.palette.text.primary, 0.08)}, transparent 70%)`,
											opacity: 0,
											transition: 'opacity 250ms ease-out',
											pointerEvents: 'none',
										}}
									/>

									{/* Bottom-to-top scrim so the content below stays readable over any visual */}
									<Box
										sx={{
											position: 'absolute',
											inset: 0,
											background: `linear-gradient(to top, ${alpha('#000000', 0.92)} 0%, ${alpha('#000000', 0.55)} 34%, transparent 64%)`,
											pointerEvents: 'none',
										}}
									/>

									{/* Icon + title + description, anchored to the card base on top of the scrim */}
									<Box sx={{ position: 'absolute', left: 0, right: 0, bottom: 0, p: { xs: 3, sm: 3.5 } }}>
										<Box
											className="bento-icon-chip"
											sx={{
												width: 44,
												height: 44,
												borderRadius: '14px',
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												bgcolor: alpha(theme.palette.text.primary, 0.12),
												border: `1px solid ${theme.palette.divider}`,
												backdropFilter: 'blur(8px)',
												transition: 'transform 320ms cubic-bezier(0.22, 1, 0.36, 1)',
												mb: 1.75,
											}}
										>
											<module.icon sx={{ fontSize: 22, color: module.color }} />
										</Box>
										<Typography
											sx={{
												fontWeight: 800,
												fontSize: isWide ? '1.25rem' : '1.1rem',
												color: theme.palette.common.white,
												mb: 0.75,
												lineHeight: 1.3,
												letterSpacing: '-0.01em',
											}}
										>
											{module.lead}
										</Typography>
										<Typography sx={{ color: alpha(theme.palette.common.white, 0.75), fontSize: '0.88rem', lineHeight: 1.55, maxWidth: isWide ? 440 : undefined }}>
											{module.description}
										</Typography>

										{/* Reserved-height row so the hover reveal never shifts layout */}
										<Box sx={{ height: 24, mt: 1 }}>
											<Stack
												className="bento-learn-more"
												direction="row"
												alignItems="center"
												spacing={0.5}
												onClick={scrollToPreview}
												sx={{
													cursor: 'pointer',
													opacity: 0,
													transform: 'translateY(6px)',
													transition: 'opacity 240ms ease-out, transform 240ms ease-out',
													'&:hover .bento-arrow': { transform: 'translateX(3px)' },
												}}
											>
												<Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: module.color }}>See it in the product</Typography>
												<ArrowForwardIcon className="bento-arrow" sx={{ fontSize: 14, color: module.color, transition: 'transform 200ms ease-out' }} />
											</Stack>
										</Box>
									</Box>
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
