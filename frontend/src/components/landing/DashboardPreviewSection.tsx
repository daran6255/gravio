import React from 'react';
import { Box, Container, Stack, Typography, alpha, keyframes } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
	Dashboard as DashboardIcon,
	Groups as GroupsIcon,
	AccountTree as AccountTreeIcon,
	Schedule as ScheduleIcon,
	Badge as BadgeIcon,
	CalendarMonth as CalendarMonthIcon,
	TrendingUp as TrendingUpIcon,
	AutoAwesome as AutoAwesomeIcon,
	CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import Reveal from './Reveal';

const NAV_ITEMS = [
	{ label: 'Dashboard', icon: DashboardIcon, active: true },
	{ label: 'CRM', icon: GroupsIcon },
	{ label: 'Projects', icon: AccountTreeIcon },
	{ label: 'Timesheets', icon: ScheduleIcon },
	{ label: 'HR', icon: BadgeIcon },
	{ label: 'Booking', icon: CalendarMonthIcon },
];

const TASK_COLUMNS = [
	{ title: 'To Do', items: ['Kickoff call — Meridian'] },
	{ title: 'In Progress', items: ['Q3 proposal draft', 'Website redesign'] },
	{ title: 'Done', items: ['Onboarding checklist'] },
];

const float = keyframes`
	0%, 100% { transform: translateY(0); }
	50% { transform: translateY(-8px); }
`;

const DashboardPreviewSection: React.FC = () => {
	const theme = useTheme();

	return (
		<Box component="section" id="preview" sx={{ bgcolor: theme.palette.background.paper, py: { xs: 9, md: 12 }, overflow: 'hidden' }}>
			<Container maxWidth="lg">
				<Reveal>
					<Box sx={{ textAlign: 'center', maxWidth: 620, mx: 'auto', mb: { xs: 8, md: 10 } }}>
						<Typography sx={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: theme.palette.accent.dark, mb: 1.5 }}>
							See It In Action
						</Typography>
						<Typography component="h2" variant="h2" sx={{ color: theme.palette.text.primary, mb: 2 }}>
							See your whole business in one screen
						</Typography>
						<Typography sx={{ color: theme.palette.text.secondary, fontSize: '1.05rem', lineHeight: 1.65 }}>
							No tab-switching, no exporting spreadsheets to piece the picture together — everything
							that matters is already on one screen when you log in.
						</Typography>
					</Box>
				</Reveal>

				<Reveal delay={100}>
					<Box
						sx={{
							position: 'relative',
							maxWidth: 980,
							mx: 'auto',
							px: { xs: 0, md: 6 },
							pb: { xs: 8, md: 4 },
						}}
					>
						{/* Browser-chrome-framed app mockup */}
						<Box
							sx={{
								borderRadius: '18px',
								overflow: 'hidden',
								border: `1px solid ${theme.palette.divider}`,
								boxShadow: '0 40px 90px -30px rgba(15, 23, 42, 0.35)',
								bgcolor: theme.palette.background.paper,
								transform: 'perspective(1800px) rotateX(3deg) rotateY(-4deg)',
								animation: `${float} 7s ease-in-out infinite`,
								transition: 'transform 400ms ease-out',
								'&:hover': { transform: 'perspective(1800px) rotateX(0deg) rotateY(0deg)' },
								'@media (prefers-reduced-motion: reduce)': { animation: 'none', transform: 'none', '&:hover': { transform: 'none' } },
							}}
						>
							{/* Browser chrome bar */}
							<Stack direction="row" alignItems="center" spacing={1.5} sx={{ px: 2, py: 1.25, bgcolor: theme.palette.background.default, borderBottom: `1px solid ${theme.palette.divider}` }}>
								<Stack direction="row" spacing={0.75}>
									{['#ef4444', '#f59e0b', '#10b981'].map((c) => (
										<Box key={c} sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: c }} />
									))}
								</Stack>
								<Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
									<Box sx={{ px: 2, py: 0.4, borderRadius: theme.layout.radius.pill, bgcolor: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}` }}>
										<Typography sx={{ fontSize: '0.7rem', color: theme.palette.text.secondary }}>gravit.taydens.com/dashboard</Typography>
									</Box>
								</Box>
							</Stack>

							{/* App body */}
							<Stack direction="row" sx={{ minHeight: { xs: 'auto', sm: 380 } }}>
								{/* Sidebar */}
								<Box sx={{ display: { xs: 'none', sm: 'block' }, width: 168, flexShrink: 0, bgcolor: '#0B0D12', p: 2.25 }}>
									<Box component="img" src="/assets/img/logo/gravit-dark.svg" alt="Gravit" sx={{ height: 20, mb: 3, display: 'block' }} />
									<Stack spacing={0.5}>
										{NAV_ITEMS.map((item) => (
											<Stack
												key={item.label}
												direction="row"
												alignItems="center"
												spacing={1.25}
												sx={{
													px: 1.25,
													py: 0.85,
													borderRadius: 1.5,
													bgcolor: item.active ? alpha('#8B7CF6', 0.18) : 'transparent',
												}}
											>
												<item.icon sx={{ fontSize: 16, color: item.active ? '#B2A7FF' : alpha('#F4F5F7', 0.55) }} />
												<Typography sx={{ fontSize: '0.75rem', fontWeight: item.active ? 700 : 500, color: item.active ? '#F4F5F7' : alpha('#F4F5F7', 0.55) }}>
													{item.label}
												</Typography>
											</Stack>
										))}
									</Stack>
								</Box>

								{/* Main content widgets */}
								<Box sx={{ flex: 1, p: { xs: 2, sm: 2.5 }, bgcolor: theme.palette.background.default, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.75 }}>
									{/* Open deals stat */}
									<Box sx={{ borderRadius: theme.layout.radius.card, border: `1px solid ${theme.palette.divider}`, bgcolor: theme.palette.background.paper, p: 1.75 }}>
										<Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: theme.palette.text.secondary, mb: 1 }}>OPEN DEALS</Typography>
										<Stack direction="row" alignItems="baseline" spacing={0.75}>
											<Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: theme.palette.text.primary }}>18</Typography>
											<Stack direction="row" alignItems="center" spacing={0.25}>
												<TrendingUpIcon sx={{ fontSize: 13, color: theme.palette.success.main }} />
												<Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: theme.palette.success.main }}>+4</Typography>
											</Stack>
										</Stack>
									</Box>

									{/* Upcoming meetings */}
									<Box sx={{ borderRadius: theme.layout.radius.card, border: `1px solid ${theme.palette.divider}`, bgcolor: theme.palette.background.paper, p: 1.75 }}>
										<Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: theme.palette.text.secondary, mb: 1 }}>UPCOMING</Typography>
										<Stack spacing={0.6}>
											{['2:00 PM — Meridian Consulting', '3:30 PM — Team standup'].map((m) => (
												<Typography key={m} sx={{ fontSize: '0.68rem', color: theme.palette.text.primary, fontWeight: 500 }}>
													{m}
												</Typography>
											))}
										</Stack>
									</Box>

									{/* Task board snippet, spans both columns */}
									<Box sx={{ gridColumn: 'span 2', borderRadius: theme.layout.radius.card, border: `1px solid ${theme.palette.divider}`, bgcolor: theme.palette.background.paper, p: 1.75 }}>
										<Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: theme.palette.text.secondary, mb: 1 }}>PROJECT BOARD</Typography>
										<Stack direction="row" spacing={1.25}>
											{TASK_COLUMNS.map((col) => (
												<Box key={col.title} sx={{ flex: 1, minWidth: 0 }}>
													<Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: theme.palette.text.secondary, mb: 0.6 }}>{col.title}</Typography>
													<Stack spacing={0.5}>
														{col.items.map((item) => (
															<Box key={item} sx={{ borderRadius: 1, border: `1px solid ${theme.palette.divider}`, bgcolor: theme.palette.background.default, px: 0.85, py: 0.6 }}>
																<Typography sx={{ fontSize: '0.62rem', color: theme.palette.text.primary, lineHeight: 1.3 }} noWrap>
																	{item}
																</Typography>
															</Box>
														))}
													</Stack>
												</Box>
											))}
										</Stack>
									</Box>
								</Box>
							</Stack>
						</Box>

						{/* Floating IRIS chat panel, overlapping the bottom-right edge */}
						<Box
							sx={{
								position: 'absolute',
								bottom: { xs: -32, md: 8 },
								right: { xs: '50%', md: -8 },
								transform: { xs: 'translateX(50%)', md: 'none' },
								width: 240,
								borderRadius: theme.layout.radius.card,
								border: `1px solid ${theme.palette.divider}`,
								bgcolor: theme.palette.background.paper,
								boxShadow: '0 20px 45px -18px rgba(15, 23, 42, 0.3)',
								p: 1.75,
								zIndex: 2,
							}}
						>
							<Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 1 }}>
								<Box sx={{ width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: theme.gradients.brandDiagonal }}>
									<AutoAwesomeIcon sx={{ fontSize: 11, color: '#fff' }} />
								</Box>
								<Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: theme.palette.text.primary }}>IRIS</Typography>
							</Stack>
							<Stack direction="row" spacing={0.6} alignItems="flex-start">
								<CheckCircleIcon sx={{ fontSize: 13, color: theme.palette.success.main, mt: 0.2, flexShrink: 0 }} />
								<Typography sx={{ fontSize: '0.68rem', color: theme.palette.text.secondary, lineHeight: 1.4 }}>
									Moved 3 tasks to Done and notified the team.
								</Typography>
							</Stack>
						</Box>

						{/* Annotation callouts — desktop only, decorative */}
						<Box
							sx={{
								display: { xs: 'none', lg: 'block' },
								position: 'absolute',
								top: '8%',
								left: 0,
								maxWidth: 190,
							}}
						>
							<Box sx={{ borderRadius: theme.layout.radius.card, border: `1px solid ${theme.palette.divider}`, bgcolor: theme.palette.background.paper, boxShadow: '0 12px 30px -14px rgba(15,23,42,0.25)', px: 1.75, py: 1.25 }}>
								<Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: theme.palette.text.primary, lineHeight: 1.4 }}>
									Ask IRIS to update three tasks at once — done in one sentence.
								</Typography>
							</Box>
						</Box>

						<Box
							sx={{
								display: { xs: 'none', lg: 'block' },
								position: 'absolute',
								top: '42%',
								right: 0,
								maxWidth: 190,
							}}
						>
							<Box sx={{ borderRadius: theme.layout.radius.card, border: `1px solid ${theme.palette.divider}`, bgcolor: theme.palette.background.paper, boxShadow: '0 12px 30px -14px rgba(15,23,42,0.25)', px: 1.75, py: 1.25 }}>
								<Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: theme.palette.text.primary, lineHeight: 1.4 }}>
									See every deal, project, and meeting without opening a spreadsheet.
								</Typography>
							</Box>
						</Box>
					</Box>
				</Reveal>
			</Container>
		</Box>
	);
};

export default DashboardPreviewSection;
