import React from 'react';
import { Box, Container, Stack, Typography, alpha } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
	Groups as GroupsIcon,
	AccountTree as AccountTreeIcon,
	Schedule as ScheduleIcon,
	Badge as BadgeIcon,
	CalendarMonth as CalendarMonthIcon,
} from '@mui/icons-material';
import Reveal from './Reveal';

// Bento-grid spans on a 4-column desktop grid (sum to 4 per row): CRM+Projects (2+2),
// then Timesheets+HR&Payroll+Booking (1+2+1). The two larger cards carry a small
// illustrative visual; the smaller ones lean on a subtle color wash instead.
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
	},
	{
		icon: BadgeIcon,
		lead: 'Run payroll without a second system.',
		description: 'Employee records, leave, payslips, and salary structures, right alongside the client work your team bills for.',
		color: '#10b981',
		colSpan: { xs: 1, sm: 2, md: 2 },
	},
	{
		icon: CalendarMonthIcon,
		lead: 'Stop the back-and-forth over scheduling.',
		description: 'Publish a booking page for prospects and clients — reschedule or cancel without another email thread.',
		color: '#ef4444',
		colSpan: { xs: 1, sm: 2, md: 1 },
	},
];

const PipelineVisual: React.FC<{ color: string }> = ({ color }) => (
	<Stack spacing={1} sx={{ mb: 2.5 }}>
		<Stack direction="row" spacing={-0.75}>
			{[0, 1, 2, 3].map((i) => (
				<Box
					key={i}
					sx={{
						width: 26,
						height: 26,
						borderRadius: '50%',
						border: '2px solid',
						borderColor: 'background.paper',
						bgcolor: alpha(color, 0.35 + i * 0.12),
						ml: i === 0 ? 0 : -0.75,
					}}
				/>
			))}
		</Stack>
		<Stack direction="row" spacing={0.5} sx={{ height: 6, borderRadius: 3, overflow: 'hidden' }}>
			<Box sx={{ flex: 3, bgcolor: alpha(color, 0.25) }} />
			<Box sx={{ flex: 2, bgcolor: alpha(color, 0.5) }} />
			<Box sx={{ flex: 1, bgcolor: color }} />
		</Stack>
	</Stack>
);

const BoardVisual: React.FC<{ color: string }> = ({ color }) => (
	<Stack direction="row" spacing={1} alignItems="flex-end" sx={{ height: 40, mb: 2.5 }}>
		{[0.5, 1, 0.7, 0.3].map((h, i) => (
			<Box key={i} sx={{ flex: 1, height: `${h * 100}%`, borderRadius: 1, bgcolor: alpha(color, 0.2 + i * 0.15) }} />
		))}
	</Stack>
);

const FeaturesSection: React.FC = () => {
	const theme = useTheme();
	const bentoRadius = '20px';

	return (
		<Box component="section" id="platform" sx={{ bgcolor: theme.palette.background.default, py: { xs: 9, md: 12 } }}>
			<Container maxWidth="lg">
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

				<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2.5 }}>
					{MODULES.map((module, i) => (
						<Reveal
							key={module.lead}
							delay={i * 60}
							sx={{ gridColumn: { xs: `span ${module.colSpan.xs}`, sm: `span ${module.colSpan.sm}`, md: `span ${module.colSpan.md}` } }}
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
									p: 3.5,
									borderRadius: bentoRadius,
									border: `1px solid ${theme.palette.divider}`,
									bgcolor: theme.palette.background.paper,
									boxShadow: '0 4px 16px -8px rgba(15, 23, 42, 0.06)',
									overflow: 'hidden',
									transition: 'transform 200ms ease-out, box-shadow 200ms ease-out, border-color 200ms ease-out',
									'&::before': {
										content: '""',
										position: 'absolute',
										inset: 0,
										borderRadius: 'inherit',
										background: `radial-gradient(280px circle at var(--x, 50%) var(--y, 50%), ${alpha(module.color, 0.16)}, transparent 70%)`,
										opacity: 0,
										transition: 'opacity 250ms ease-out',
										pointerEvents: 'none',
									},
									'&:hover': {
										transform: 'translateY(-3px)',
										borderColor: alpha(module.color, 0.45),
										boxShadow: `0 16px 36px -16px ${alpha(module.color, 0.4)}`,
									},
									'&:hover::before': { opacity: 1 },
									'@media (hover: none)': { '&::before': { display: 'none' } },
								}}
							>
								{module.visual === 'pipeline' && <PipelineVisual color={module.color} />}
								{module.visual === 'board' && <BoardVisual color={module.color} />}

								<Box
									sx={{
										position: 'relative',
										width: 46,
										height: 46,
										borderRadius: '14px',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										bgcolor: alpha(module.color, 0.12),
										mb: 2.5,
									}}
								>
									<module.icon sx={{ fontSize: 23, color: module.color }} />
								</Box>
								<Typography sx={{ position: 'relative', fontWeight: 700, fontSize: '1.1rem', color: theme.palette.text.primary, mb: 1, lineHeight: 1.35 }}>
									{module.lead}
								</Typography>
								<Typography sx={{ position: 'relative', color: theme.palette.text.secondary, fontSize: '0.9rem', lineHeight: 1.6 }}>
									{module.description}
								</Typography>
							</Box>
						</Reveal>
					))}
				</Box>
			</Container>
		</Box>
	);
};

export default FeaturesSection;
