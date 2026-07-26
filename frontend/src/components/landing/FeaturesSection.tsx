import React from 'react';
import { Box, Container, Typography, alpha } from '@mui/material';
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
// then Timesheets+HR&Payroll+Booking (1+2+1).
const MODULES = [
	{
		icon: GroupsIcon,
		title: 'CRM',
		description: 'Track leads, deals, and companies through one pipeline — with every call and email logged as an activity IRIS can reference later.',
		color: '#8B7CF6',
		colSpan: { xs: 1, sm: 2, md: 2 },
	},
	{
		icon: AccountTreeIcon,
		title: 'Project Management',
		description: 'Boards, tasks, and timelines for client delivery work, with shareable read-only status links so clients stay updated without a login.',
		color: '#4EA8FF',
		colSpan: { xs: 1, sm: 2, md: 2 },
	},
	{
		icon: ScheduleIcon,
		title: 'Timesheets & Billing',
		description: 'Log billable hours against real projects and clients — no spreadsheets, no separate time-tracking subscription.',
		color: '#f59e0b',
		colSpan: { xs: 1, sm: 2, md: 1 },
	},
	{
		icon: BadgeIcon,
		title: 'HR & Payroll',
		description: 'Employee records, leave, payslips, and salary structures — running the people side of the business alongside client delivery, not in a separate tool.',
		color: '#10b981',
		colSpan: { xs: 1, sm: 2, md: 2 },
	},
	{
		icon: CalendarMonthIcon,
		title: 'Meeting Booking',
		description: 'Publish a booking page for prospects and clients — reschedule and cancel without email back-and-forth.',
		color: '#ef4444',
		colSpan: { xs: 1, sm: 2, md: 1 },
	},
];

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
							Five tools' worth of capability, one system to manage
						</Typography>
						<Typography sx={{ color: theme.palette.text.secondary, fontSize: '1.05rem', lineHeight: 1.65 }}>
							Every module shares the same data, the same permissions, and the same AI layer.
						</Typography>
					</Box>
				</Reveal>

				<Box
					sx={{
						display: 'grid',
						gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
						gap: 2.5,
					}}
				>
					{MODULES.map((module, i) => (
						<Reveal key={module.title} delay={i * 60} sx={{ gridColumn: { xs: `span ${module.colSpan.xs}`, sm: `span ${module.colSpan.sm}`, md: `span ${module.colSpan.md}` } }}>
							<Box
								sx={{
									height: '100%',
									p: 3.5,
									borderRadius: bentoRadius,
									border: `1px solid ${theme.palette.divider}`,
									bgcolor: theme.palette.background.paper,
									boxShadow: '0 4px 16px -8px rgba(15, 23, 42, 0.06)',
									transition: 'transform 200ms ease-out, box-shadow 200ms ease-out',
									'&:hover': {
										transform: 'scale(1.015)',
										boxShadow: '0 12px 28px -12px rgba(15, 23, 42, 0.14)',
									},
								}}
							>
								<Box
									sx={{
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
								<Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: theme.palette.text.primary, mb: 1 }}>
									{module.title}
								</Typography>
								<Typography sx={{ color: theme.palette.text.secondary, fontSize: '0.92rem', lineHeight: 1.6 }}>
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
