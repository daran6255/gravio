import React, { useEffect, useRef, useState } from 'react';
import { Box, Container, Stack, Typography, alpha, keyframes } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area } from 'recharts';
import {
	HomeOutlined as HomeIcon,
	Groups as GroupsIcon,
	AccountTree as AccountTreeIcon,
	Schedule as ScheduleIcon,
	EventBusy as EventBusyIcon,
	CalendarMonth as CalendarMonthIcon,
	Business as BusinessIcon,
	Leaderboard as LeaderboardIcon,
	BusinessCenter as BusinessCenterIcon,
	Assignment as AssignmentIcon,
	Badge as BadgeIcon,
	Domain as DomainIcon,
	WorkOutline as WorkOutlineIcon,
	EventNote as EventNoteIcon,
	SupervisorAccount as SupervisorAccountIcon,
	Autorenew as AutorenewIcon,
	Description as DescriptionIcon,
	Search as SearchIcon,
	Lock as LockIcon,
	VerifiedUser as VerifiedUserIcon,
	DarkModeOutlined as DarkModeIcon,
	NotificationsNoneOutlined as NotificationsIcon,
	HelpOutlineOutlined as HelpIcon,
	PeopleAlt as PeopleAltIcon,
	TrendingUp as TrendingUpIcon,
	TrendingDown as TrendingDownIcon,
	AccountBalanceWallet as WalletIcon,
	PersonAddAlt1 as PersonAddAlt1Icon,
	CreateNewFolder as CreateNewFolderIcon,
	GroupAdd as GroupAddIcon,
	FactCheck as FactCheckIcon,
	EventAvailable as EventAvailableIcon,
	Settings as SettingsIcon,
	AutoAwesome as AutoAwesomeIcon,
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
		}, { threshold: 0.2 });
		observer.observe(node);
		return () => observer.disconnect();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);
	return { ref, visible };
};

const topAccent = (color: string) => ({
	position: 'relative' as const,
	'&::before': {
		content: '""',
		position: 'absolute' as const,
		top: 0,
		left: 14,
		right: 14,
		height: 3,
		borderRadius: '0 0 3px 3px',
		background: `linear-gradient(90deg, ${color}, ${alpha(color, 0.35)})`,
	},
});

const useCountUp = (target: number, visible: boolean, durationMs = 1100) => {
	const [value, setValue] = useState(prefersReducedMotion() ? target : 0);
	useEffect(() => {
		if (!visible || prefersReducedMotion()) return;
		let raf: number;
		let start: number | null = null;
		const step = (ts: number) => {
			if (start === null) start = ts;
			const progress = Math.min((ts - start) / durationMs, 1);
			const eased = 1 - Math.pow(1 - progress, 3);
			setValue(Math.round(target * eased));
			if (progress < 1) raf = requestAnimationFrame(step);
		};
		raf = requestAnimationFrame(step);
		return () => cancelAnimationFrame(raf);
	}, [visible, target, durationMs]);
	return value;
};

const NAV_GROUPS = [
	{
		label: 'Workspace',
		items: [
			{ label: 'Home', icon: HomeIcon, active: true },
			{ label: 'Team', icon: GroupsIcon },
			{ label: 'Projects', icon: AccountTreeIcon },
			{ label: 'Timesheets', icon: ScheduleIcon },
			{ label: 'Leaves', icon: EventBusyIcon },
			{ label: 'Meetings', icon: CalendarMonthIcon },
		],
	},
	{
		label: 'CRM',
		items: [
			{ label: 'Companies', icon: BusinessIcon },
			{ label: 'Leads', icon: LeaderboardIcon },
			{ label: 'Deals', icon: BusinessCenterIcon },
			{ label: 'Tasks', icon: AssignmentIcon },
		],
	},
	{
		label: 'HR Administration',
		items: [
			{ label: 'Employees', icon: BadgeIcon },
			{ label: 'Departments', icon: DomainIcon },
			{ label: 'Designations', icon: WorkOutlineIcon },
			{ label: 'Leave Types', icon: EventNoteIcon },
			{ label: 'Managers', icon: SupervisorAccountIcon },
			{ label: 'Lifecycle', icon: AutorenewIcon },
			{ label: 'Documents', icon: DescriptionIcon },
		],
	},
];

const STATS = [
	{ label: 'Total Users', value: 128, trend: '+12 this month', icon: GroupsIcon, color: '#8B7CF6' },
	{ label: 'Active Users', value: 96, trend: '75% of total', icon: PeopleAltIcon, color: '#4EA8FF' },
	{ label: 'Leads Converted', value: 34, trend: '+8 this week', icon: TrendingUpIcon, color: '#10b981' },
	{ label: 'Projects Value', value: 182, trend: '₹ thousands', icon: WalletIcon, color: '#f59e0b', prefix: '₹', suffix: 'k' },
];

const ROLE_DATA = [
	{ name: 'Developer', value: 52, color: '#8B7CF6' },
	{ name: 'Manager', value: 28, color: '#4EA8FF' },
	{ name: 'Admin', value: 20, color: '#10b981' },
];

const USAGE_DATA = [
	{ day: 'Mon', usage: 480 },
	{ day: 'Tue', usage: 410 },
	{ day: 'Wed', usage: 360 },
	{ day: 'Thu', usage: 300 },
	{ day: 'Fri', usage: 240 },
];

const QUICK_ACTIONS = [
	{ icon: PersonAddAlt1Icon, label: 'Invite Member' },
	{ icon: CreateNewFolderIcon, label: 'Create Project' },
	{ icon: GroupAddIcon, label: 'Add Lead' },
	{ icon: FactCheckIcon, label: 'Review Logs' },
	{ icon: EventAvailableIcon, label: 'Leave Approvals' },
	{ icon: SettingsIcon, label: 'Settings' },
];

const TABS = [
	{ label: 'Active Leads', icon: LeaderboardIcon, rows: [['Meridian Consulting', 'New', '₹2.1L'], ['Anchorpoint IT', 'Contacted', '₹1.4L']] },
	{ label: 'Active Deals', icon: BusinessCenterIcon, rows: [['Northline — Q3 Retainer', 'Negotiation', '₹4.8L'], ['Vantage — Staffing', 'Proposal', '₹3.2L']] },
	{ label: 'Active Projects', icon: AssignmentIcon, rows: [['Website Redesign', 'On Track', '68%'], ['Q3 Proposal Build', 'At Risk', '32%']] },
];

const float = keyframes`
	0%, 100% { transform: translateY(0); }
	50% { transform: translateY(-8px); }
`;

const livePulse = keyframes`
	0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.55); }
	70% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
	100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
`;

const StatCard: React.FC<{ stat: (typeof STATS)[number]; visible: boolean }> = ({ stat, visible }) => {
	const theme = useTheme();
	const count = useCountUp(stat.value, visible);
	return (
		<Box sx={{ borderRadius: theme.layout.radius.card, border: `1px solid ${theme.palette.divider}`, bgcolor: theme.palette.background.paper, p: 1.5, overflow: 'hidden', ...topAccent(stat.color) }}>
			<Box sx={{ position: 'absolute', top: 10, right: 10, width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: alpha(stat.color, 0.15) }}>
				<stat.icon sx={{ fontSize: 13, color: stat.color }} />
			</Box>
			<Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: theme.palette.text.secondary, mb: 0.5 }}>{stat.label.toUpperCase()}</Typography>
			<Typography sx={{ fontSize: '1.2rem', fontWeight: 800, color: theme.palette.text.primary, lineHeight: 1 }}>
				{stat.prefix ?? ''}{count.toLocaleString()}{stat.suffix ?? ''}
			</Typography>
			<Typography sx={{ fontSize: '0.6rem', color: theme.palette.text.secondary, mt: 0.4 }}>{stat.trend}</Typography>
		</Box>
	);
};

const TeamRolesCard: React.FC = () => {
	const theme = useTheme();
	const { ref, visible } = useOnceVisible<HTMLDivElement>();
	const total = ROLE_DATA.reduce((a, b) => a + b.value, 0);

	return (
		<Box ref={ref} sx={{ borderRadius: theme.layout.radius.card, border: `1px solid ${theme.palette.divider}`, bgcolor: theme.palette.background.paper, p: 1.5, overflow: 'hidden', ...topAccent('#8B7CF6') }}>
			<Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: theme.palette.text.secondary, mb: 0.5 }}>TEAM ROLES</Typography>
			<Box sx={{ position: 'relative', height: 76 }}>
				{visible && (
					<ResponsiveContainer width="100%" height="100%">
						<PieChart>
							<Pie data={ROLE_DATA} dataKey="value" innerRadius={22} outerRadius={34} paddingAngle={3} isAnimationActive={!prefersReducedMotion()} animationDuration={800}>
								{ROLE_DATA.map((entry) => (
									<Cell key={entry.name} fill={entry.color} stroke="none" />
								))}
							</Pie>
						</PieChart>
					</ResponsiveContainer>
				)}
				<Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', pointerEvents: 'none' }}>
					<Typography sx={{ fontSize: '0.85rem', fontWeight: 800, color: theme.palette.text.primary, lineHeight: 1 }}>{total}</Typography>
					<Typography sx={{ fontSize: '0.5rem', color: theme.palette.text.secondary }}>people</Typography>
				</Box>
			</Box>
			<Stack spacing={0.6} sx={{ mt: 1 }}>
				{ROLE_DATA.map((role) => (
					<Box key={role.name}>
						<Stack direction="row" justifyContent="space-between">
							<Typography sx={{ fontSize: '0.58rem', color: theme.palette.text.secondary }}>{role.name}</Typography>
							<Typography sx={{ fontSize: '0.58rem', fontWeight: 700, color: theme.palette.text.primary }}>{role.value}%</Typography>
						</Stack>
						<Box sx={{ height: 4, borderRadius: 2, bgcolor: alpha(role.color, 0.15), mt: 0.25, overflow: 'hidden' }}>
							<Box sx={{ height: '100%', width: visible ? `${role.value}%` : 0, bgcolor: role.color, transition: 'width 700ms ease-out' }} />
						</Box>
					</Box>
				))}
			</Stack>
		</Box>
	);
};

const AiUsageCard: React.FC = () => {
	const theme = useTheme();
	const { ref, visible } = useOnceVisible<HTMLDivElement>();

	return (
		<Box ref={ref} sx={{ gridColumn: 'span 2', borderRadius: theme.layout.radius.card, border: `1px solid ${theme.palette.divider}`, bgcolor: theme.palette.background.paper, p: 1.5, overflow: 'hidden', ...topAccent(theme.palette.accent.main) }}>
			<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.75 }}>
				<Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: theme.palette.text.secondary }}>AI OPERATIONS USAGE</Typography>
				<Stack direction="row" spacing={0.5} alignItems="center">
					<TrendingDownIcon sx={{ fontSize: 12, color: theme.palette.success.main }} />
					<Typography sx={{ fontSize: '0.58rem', fontWeight: 700, color: theme.palette.success.main }}>Trending down</Typography>
				</Stack>
			</Stack>
			<Stack direction="row" spacing={2.5} sx={{ mb: 0.75 }}>
				<Box>
					<Typography sx={{ fontSize: '0.95rem', fontWeight: 800, color: theme.palette.text.primary, lineHeight: 1 }}>1,690</Typography>
					<Typography sx={{ fontSize: '0.55rem', color: theme.palette.text.secondary }}>consumed this week</Typography>
				</Box>
				<Box>
					<Typography sx={{ fontSize: '0.95rem', fontWeight: 800, color: theme.palette.text.primary, lineHeight: 1 }}>3,310</Typography>
					<Typography sx={{ fontSize: '0.55rem', color: theme.palette.text.secondary }}>remaining quota</Typography>
				</Box>
			</Stack>
			<Box sx={{ height: 56 }}>
				{visible && (
					<ResponsiveContainer width="100%" height="100%">
						<AreaChart data={USAGE_DATA} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
							<defs>
								<linearGradient id="usageFill" x1="0" y1="0" x2="0" y2="1">
									<stop offset="0%" stopColor={theme.palette.accent.main} stopOpacity={0.35} />
									<stop offset="100%" stopColor={theme.palette.accent.main} stopOpacity={0} />
								</linearGradient>
							</defs>
							<Area type="monotone" dataKey="usage" stroke={theme.palette.accent.main} strokeWidth={2} fill="url(#usageFill)" isAnimationActive={!prefersReducedMotion()} animationDuration={900} />
						</AreaChart>
					</ResponsiveContainer>
				)}
			</Box>
		</Box>
	);
};

const QuickActionsCard: React.FC = () => {
	const theme = useTheme();
	return (
		<Box sx={{ borderRadius: theme.layout.radius.card, border: `1px solid ${theme.palette.divider}`, bgcolor: theme.palette.background.paper, p: 1.5, overflow: 'hidden', ...topAccent(theme.palette.primary.main) }}>
			<Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: theme.palette.text.secondary, mb: 0.75 }}>QUICK ACTIONS</Typography>
			<Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0.6 }}>
				{QUICK_ACTIONS.map((action) => (
					<Stack
						key={action.label}
						alignItems="center"
						spacing={0.4}
						sx={{
							p: 0.6,
							borderRadius: 1.5,
							border: `1px solid ${theme.palette.divider}`,
							transition: 'transform 150ms ease-out, border-color 150ms ease-out',
							'&:hover': { transform: 'translateY(-2px)', borderColor: theme.palette.primary.main },
						}}
					>
						<action.icon sx={{ fontSize: 14, color: theme.palette.primary.main }} />
						<Typography sx={{ fontSize: '0.48rem', fontWeight: 600, color: theme.palette.text.secondary, textAlign: 'center', lineHeight: 1.1 }}>
							{action.label}
						</Typography>
					</Stack>
				))}
			</Box>
		</Box>
	);
};

const TabbedTableCard: React.FC = () => {
	const theme = useTheme();
	const [tab, setTab] = useState(0);
	const active = TABS[tab];

	return (
		<Box sx={{ gridColumn: 'span 2', borderRadius: theme.layout.radius.card, border: `1px solid ${theme.palette.divider}`, bgcolor: theme.palette.background.paper, p: 1.5, overflow: 'hidden', ...topAccent(theme.palette.primary.main) }}>
			<Stack direction="row" spacing={0.5} sx={{ mb: 1, borderBottom: `1px solid ${theme.palette.divider}`, pb: 0.75 }}>
				{TABS.map((t, i) => (
					<Stack
						key={t.label}
						direction="row"
						alignItems="center"
						spacing={0.4}
						onClick={() => setTab(i)}
						sx={{
							px: 1,
							py: 0.35,
							borderRadius: theme.layout.radius.pill,
							cursor: 'pointer',
							bgcolor: tab === i ? alpha(theme.palette.primary.main, 0.12) : 'transparent',
						}}
					>
						<t.icon sx={{ fontSize: 12, color: tab === i ? theme.palette.primary.main : theme.palette.text.secondary }} />
						<Typography sx={{ fontSize: '0.58rem', fontWeight: 700, color: tab === i ? theme.palette.primary.main : theme.palette.text.secondary }}>
							{t.label}
						</Typography>
					</Stack>
				))}
			</Stack>
			<Stack spacing={0.6}>
				{active.rows.map((row) => (
					<Stack key={row[0]} direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 1, py: 0.6, borderRadius: 1, bgcolor: theme.palette.background.default }}>
						<Typography sx={{ fontSize: '0.6rem', fontWeight: 600, color: theme.palette.text.primary }} noWrap>{row[0]}</Typography>
						<Typography sx={{ fontSize: '0.56rem', color: theme.palette.text.secondary, px: 0.75, py: 0.15, borderRadius: 1, bgcolor: alpha(theme.palette.text.secondary, 0.1) }}>{row[1]}</Typography>
						<Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: theme.palette.text.primary }}>{row[2]}</Typography>
					</Stack>
				))}
			</Stack>
		</Box>
	);
};

const WhoOnLeaveCard: React.FC = () => {
	const theme = useTheme();
	const people = [
		{ initials: 'PN', name: 'Priya N.', dates: 'Jul 28–30' },
		{ initials: 'RK', name: 'Rahul K.', dates: 'Aug 2' },
	];
	return (
		<Box sx={{ borderRadius: theme.layout.radius.card, border: `1px solid ${theme.palette.divider}`, bgcolor: theme.palette.background.paper, p: 1.5, overflow: 'hidden', ...topAccent('#f59e0b') }}>
			<Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: theme.palette.text.secondary, mb: 0.75 }}>WHO'S ON LEAVE</Typography>
			<Stack spacing={0.75}>
				{people.map((p) => (
					<Stack key={p.name} direction="row" spacing={0.75} alignItems="center">
						<Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: alpha(theme.palette.primary.main, 0.15), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
							<Typography sx={{ fontSize: '0.5rem', fontWeight: 700, color: theme.palette.primary.main }}>{p.initials}</Typography>
						</Box>
						<Box sx={{ minWidth: 0 }}>
							<Typography sx={{ fontSize: '0.6rem', fontWeight: 600, color: theme.palette.text.primary }} noWrap>{p.name}</Typography>
							<Typography sx={{ fontSize: '0.55rem', color: theme.palette.text.secondary }}>{p.dates}</Typography>
						</Box>
					</Stack>
				))}
			</Stack>
		</Box>
	);
};

const BillingStatusCard: React.FC = () => {
	const theme = useTheme();
	return (
		<Box sx={{ borderRadius: theme.layout.radius.card, border: `1px solid ${theme.palette.divider}`, bgcolor: theme.palette.background.paper, p: 1.5, overflow: 'hidden', ...topAccent(theme.palette.success.main) }}>
			<Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: theme.palette.text.secondary, mb: 0.75 }}>BILLING STATUS</Typography>
			<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
				<Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: theme.palette.text.primary }}>Growth Plan</Typography>
				<Box sx={{ px: 0.75, py: 0.15, borderRadius: 1, bgcolor: alpha(theme.palette.success.main, 0.15) }}>
					<Typography sx={{ fontSize: '0.5rem', fontWeight: 700, color: theme.palette.success.main }}>ACTIVE</Typography>
				</Box>
			</Stack>
			<Typography sx={{ fontSize: '0.56rem', color: theme.palette.text.secondary, mb: 0.6 }}>Renews Aug 1, 2026</Typography>
			<Stack direction="row" alignItems="center" spacing={0.4}>
				<VerifiedUserIcon sx={{ fontSize: 11, color: theme.palette.text.secondary }} />
				<Typography sx={{ fontSize: '0.52rem', color: theme.palette.text.secondary }}>Secured payments</Typography>
			</Stack>
		</Box>
	);
};

const DashboardPreviewSection: React.FC = () => {
	const theme = useTheme();
	const { ref: statsRef, visible: statsVisible } = useOnceVisible<HTMLDivElement>();

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
					<Box sx={{ position: 'relative', maxWidth: 1040, mx: 'auto', px: { xs: 0, md: 6 }, pb: { xs: 8, md: 4 } }}>
						<Box
							sx={{
								position: 'absolute',
								top: '10%',
								left: '50%',
								transform: 'translateX(-50%)',
								width: '90%',
								height: '80%',
								borderRadius: '50%',
								background: `radial-gradient(ellipse, ${alpha(theme.palette.primary.main, 0.1)} 0%, transparent 65%)`,
								pointerEvents: 'none',
								zIndex: 0,
							}}
						/>

						{/* Browser-chrome-framed app mockup */}
						<Box
							sx={{
								position: 'relative',
								borderRadius: '18px',
								overflow: 'hidden',
								border: `1px solid ${theme.palette.divider}`,
								boxShadow: '0 50px 100px -30px rgba(15, 23, 42, 0.4)',
								bgcolor: theme.palette.background.paper,
								transform: 'perspective(1800px) rotateX(3deg) rotateY(-4deg)',
								animation: `${float} 7s ease-in-out infinite`,
								transition: 'transform 400ms ease-out',
								'&:hover': { transform: 'perspective(1800px) rotateX(0deg) rotateY(0deg) scale(1.015)' },
								'@media (prefers-reduced-motion: reduce)': { animation: 'none', transform: 'none', '&:hover': { transform: 'none' } },
							}}
						>
							{/* Browser chrome bar */}
							<Stack direction="row" alignItems="center" spacing={1.5} sx={{ px: 2, py: 1.1, bgcolor: theme.palette.background.default, borderBottom: `1px solid ${theme.palette.divider}` }}>
								<Stack direction="row" spacing={0.75}>
									{['#ef4444', '#f59e0b', '#10b981'].map((c) => (
										<Box key={c} sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: c }} />
									))}
								</Stack>
								<Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
									<Stack direction="row" alignItems="center" spacing={0.6} sx={{ px: 2, py: 0.35, borderRadius: theme.layout.radius.pill, bgcolor: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}` }}>
										<LockIcon sx={{ fontSize: 11, color: theme.palette.success.main }} />
										<Typography sx={{ fontSize: '0.68rem', color: theme.palette.text.secondary }}>gravit.taydens.com/dashboard</Typography>
									</Stack>
								</Box>
							</Stack>

							{/* In-app top bar */}
							<Stack direction="row" alignItems="center" spacing={1} sx={{ px: 2, py: 1, bgcolor: theme.palette.background.paper, borderBottom: `1px solid ${theme.palette.divider}` }}>
								<Stack direction="row" alignItems="center" spacing={0.5}>
									<Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: theme.palette.success.main, animation: `${livePulse} 2s ease-out infinite` }} />
									<Typography sx={{ fontSize: '0.56rem', fontWeight: 700, color: theme.palette.success.main, display: { xs: 'none', md: 'block' } }}>LIVE</Typography>
								</Stack>
								<Stack direction="row" alignItems="center" spacing={0.6} sx={{ flex: 1, maxWidth: 200, px: 1.25, py: 0.5, borderRadius: theme.layout.radius.pill, bgcolor: theme.palette.background.default }}>
									<SearchIcon sx={{ fontSize: 13, color: theme.palette.text.secondary }} />
									<Typography sx={{ fontSize: '0.6rem', color: theme.palette.text.secondary }}>Search services, features</Typography>
								</Stack>
								<Box sx={{ flex: 1 }} />
								{[
									{ label: '14 days left', color: theme.palette.warning.main },
									{ label: '3,310 credits', color: theme.palette.accent.main },
									{ label: 'INR ₹', color: theme.palette.text.secondary },
								].map((chip) => (
									<Box key={chip.label} sx={{ display: { xs: 'none', sm: 'block' }, px: 1, py: 0.3, borderRadius: theme.layout.radius.badge, border: `1px solid ${theme.palette.divider}` }}>
										<Typography sx={{ fontSize: '0.56rem', fontWeight: 700, color: chip.color }}>{chip.label}</Typography>
									</Box>
								))}
								<Stack direction="row" spacing={0.25}>
									{[DarkModeIcon, NotificationsIcon, HelpIcon].map((Icon, i) => (
										<Box key={i} sx={{ width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
											<Icon sx={{ fontSize: 13, color: theme.palette.text.secondary }} />
										</Box>
									))}
								</Stack>
							</Stack>

							{/* App body */}
							<Stack direction="row">
								{/* Sidebar */}
								<Box sx={{ display: { xs: 'none', sm: 'block' }, width: 176, flexShrink: 0, bgcolor: theme.layout.sidebar.background, borderRight: `1px solid ${theme.layout.sidebar.divider}`, p: 2 }}>
									<Box
										component="img"
										src={theme.palette.mode === 'dark' ? '/assets/img/logo/gravit-light.svg' : '/assets/img/logo/gravit-dark.svg'}
										alt="Gravit"
										sx={{ height: 18, mb: 2, display: 'block' }}
									/>
									<Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 2, p: 0.75, borderRadius: 1.5, bgcolor: theme.layout.sidebar.hoverBg }}>
										<Box sx={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: theme.gradients.brandDiagonal }}>
											<Typography sx={{ fontSize: '0.5rem', fontWeight: 800, color: theme.palette.common.white }}>NL</Typography>
										</Box>
										<Typography sx={{ fontSize: '0.58rem', fontWeight: 700, color: theme.layout.sidebar.text }} noWrap>
											Northline IT
										</Typography>
									</Stack>
									<Stack spacing={1.25}>
										{NAV_GROUPS.map((group) => (
											<Box key={group.label}>
												<Typography sx={{ fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: theme.layout.sidebar.textMuted, mb: 0.4, px: 1 }}>
													{group.label}
												</Typography>
												<Stack spacing={0.15}>
													{group.items.map((item) => (
														<Stack
															key={item.label}
															direction="row"
															alignItems="center"
															spacing={0.85}
															sx={{ px: 1, py: 0.4, borderRadius: 1, bgcolor: item.active ? alpha(theme.palette.primary.main, 0.18) : 'transparent' }}
														>
															<item.icon sx={{ fontSize: 12, color: item.active ? theme.palette.primary.light : alpha(theme.layout.sidebar.text, 0.55) }} />
															<Typography sx={{ fontSize: '0.62rem', fontWeight: item.active ? 700 : 500, color: item.active ? theme.layout.sidebar.textHover : alpha(theme.layout.sidebar.text, 0.55) }} noWrap>
																{item.label}
															</Typography>
														</Stack>
													))}
												</Stack>
											</Box>
										))}
									</Stack>
								</Box>

								{/* Main content widgets */}
								<Box ref={statsRef} sx={{ flex: 1, p: { xs: 1.5, sm: 2 }, bgcolor: theme.palette.background.default, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
									{/* Row 1: stat cards */}
									<Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1.25 }}>
										{STATS.map((stat) => (
											<StatCard key={stat.label} stat={stat} visible={statsVisible} />
										))}
									</Box>

									{/* Row 2: donut + AI usage + quick actions */}
									<Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1.25 }}>
										<TeamRolesCard />
										<AiUsageCard />
										<QuickActionsCard />
									</Box>

									{/* Row 3: tabbed table + who's on leave + billing */}
									<Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1.25 }}>
										<TabbedTableCard />
										<WhoOnLeaveCard />
										<BillingStatusCard />
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
						<Box sx={{ display: { xs: 'none', lg: 'block' }, position: 'absolute', top: '6%', left: 0, maxWidth: 190 }}>
							<Box sx={{ borderRadius: theme.layout.radius.card, border: `1px solid ${theme.palette.divider}`, bgcolor: theme.palette.background.paper, boxShadow: '0 12px 30px -14px rgba(15,23,42,0.25)', px: 1.75, py: 1.25 }}>
								<Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: theme.palette.text.primary, lineHeight: 1.4 }}>
									Ask IRIS to update three tasks at once — done in one sentence.
								</Typography>
							</Box>
						</Box>

						<Box sx={{ display: { xs: 'none', lg: 'block' }, position: 'absolute', top: '48%', right: 0, maxWidth: 190 }}>
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
