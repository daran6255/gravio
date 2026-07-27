import React, { useEffect, useRef, useState } from 'react';
import { Box, Container, Stack, Typography, alpha, keyframes, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area } from 'recharts';
import {
	Menu as MenuIcon,
	HomeOutlined as HomeIcon,
	Groups as GroupsIcon,
	AccountTree as AccountTreeIcon,
	Schedule as ScheduleIcon,
	EventAvailable as EventAvailableIcon,
	VideocamOutlined as VideocamIcon,
	BusinessCenter as BusinessCenterIcon,
	Leaderboard as LeaderboardIcon,
	Handshake as HandshakeIcon,
	Assignment as AssignmentIcon,
	Badge as BadgeIcon,
	Apartment as ApartmentIcon,
	WorkOutline as WorkOutlineIcon,
	Search as SearchIcon,
	Bolt as BoltIcon,
	AccessTime as AccessTimeIcon,
	Lock as LockIcon,
	VerifiedUser as VerifiedUserIcon,
	DarkModeOutlined as DarkModeIcon,
	NotificationsNoneOutlined as NotificationsIcon,
	HeadsetMic as HeadsetMicIcon,
	ChevronRight as ChevronRightIcon,
	PeopleAlt as PeopleAltIcon,
	TrendingUp as TrendingUpIcon,
	TrendingDown as TrendingDownIcon,
	AccountBalanceWallet as WalletIcon,
	PersonAddAlt1 as PersonAddAlt1Icon,
	CreateNewFolder as CreateNewFolderIcon,
	GroupAdd as GroupAddIcon,
	FactCheck as FactCheckIcon,
	Settings as SettingsIcon,
	AutoAwesome as AutoAwesomeIcon,
	CheckCircle as CheckCircleIcon,
	NearMe as CursorIcon,
} from '@mui/icons-material';
import Reveal from './Reveal';
import { getThemeByMode } from '../../theme/theme';

const prefersReducedMotion = () =>
	typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// The real product is a dark-mode workspace regardless of the marketing site's
// light theme (same "fixed look, independent of app mode" precedent the auth
// pages and Sidebar already use — see theme.ts). Computed once at module scope,
// same pattern LandingPage.tsx uses for its own fixed light theme.
const appTheme = getThemeByMode('dark');

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

// Mirrors the real app's sidebar structure (Workspace / CRM / HR Administration)
// closely enough to read as the actual product, not a generic dashboard template.
const NAV_GROUPS = [
	{
		label: 'Workspace',
		items: [
			{ label: 'Home', icon: HomeIcon, active: true },
			{ label: 'Team', icon: GroupsIcon },
			{ label: 'Projects', icon: AccountTreeIcon },
			{ label: 'Timesheets', icon: ScheduleIcon },
			{ label: 'Leaves', icon: EventAvailableIcon },
			{ label: 'Meetings', icon: VideocamIcon },
		],
	},
	{
		label: 'CRM',
		items: [
			{ label: 'Companies', icon: BusinessCenterIcon },
			{ label: 'Leads', icon: LeaderboardIcon },
			{ label: 'Deals', icon: HandshakeIcon },
			{ label: 'Tasks', icon: AssignmentIcon },
		],
	},
	{
		label: 'HR Administration',
		items: [
			{ label: 'Employees', icon: BadgeIcon },
			{ label: 'Departments', icon: ApartmentIcon },
			{ label: 'Designations', icon: WorkOutlineIcon },
		],
	},
];

const STATS = [
	{ label: 'Total Users', value: 128, trend: '+12 this month', icon: GroupsIcon, color: '#8B7CF6' },
	{ label: 'Active Users', value: 96, trend: '75% active rate', icon: PeopleAltIcon, color: '#10b981' },
	{ label: 'Leads Converted', value: 34, trend: '+8 this week', icon: TrendingUpIcon, color: '#4EA8FF' },
	{ label: 'Projects Value', value: 182, trend: 'From converted deals', icon: WalletIcon, color: '#f59e0b', prefix: '₹', suffix: 'k' },
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

// Copy lifted straight from the real Quick Actions tile subtext.
const QUICK_ACTIONS = [
	{ icon: PersonAddAlt1Icon, label: 'Invite Member', sub: 'Add new team member', color: '#8B7CF6' },
	{ icon: CreateNewFolderIcon, label: 'Create Project', sub: 'Start a new project', color: '#4EA8FF' },
	{ icon: GroupAddIcon, label: 'Add Lead', sub: 'Add CRM sales lead', color: '#10b981' },
	{ icon: FactCheckIcon, label: 'Review Logs', sub: 'Check team timesheets', color: '#f59e0b' },
	{ icon: EventAvailableIcon, label: 'Leave Approvals', sub: 'Review leave requests', color: '#ef4444' },
	{ icon: SettingsIcon, label: 'Settings', sub: 'Workspace config', color: '#64748b' },
];

const PRIORITY_COLOR: Record<string, string> = { High: '#ef4444', Medium: '#4EA8FF', Low: '#10b981' };

const TABS = [
	{
		label: 'Active Leads', icon: LeaderboardIcon, rows: [
			{ title: 'Meridian Consulting', priority: 'Medium', status: 'New', value: '—' },
			{ title: 'Anchorpoint IT', priority: 'High', status: 'Contacted', value: '—' },
		],
	},
	{
		label: 'Active Deals', icon: HandshakeIcon, rows: [
			{ title: 'Northline — Q3 Retainer', priority: 'High', status: 'Negotiation', value: '₹4.8L' },
			{ title: 'Vantage — Staffing', priority: 'Medium', status: 'Proposal', value: '₹3.2L' },
		],
	},
	{
		label: 'Active Projects', icon: AssignmentIcon, rows: [
			{ title: 'Website Redesign', priority: 'Medium', status: 'On Track', value: '68%' },
			{ title: 'Q3 Proposal Build', priority: 'High', status: 'At Risk', value: '32%' },
		],
	},
];

const BILLING_ROWS = [
	{ label: 'Current Period', value: 'July 2026' },
	{ label: 'Plan & Fee', value: 'Growth ($49/mo)' },
	{ label: 'Next Renewal', value: 'Aug 1, 2026' },
];

const float = keyframes`
	0%, 100% { transform: translateY(0); }
	50% { transform: translateY(-8px); }
`;

const spin = keyframes`
	from { transform: rotate(0deg); }
	to { transform: rotate(360deg); }
`;

const irisFloat = keyframes`
	0%, 100% { transform: translateY(0); }
	50% { transform: translateY(-6px); }
`;

const glowPulse = keyframes`
	0% { box-shadow: 0 20px 45px -18px rgba(139, 124, 246, 0.3), 0 0 0 0px rgba(139, 124, 246, 0.2); }
	50% { box-shadow: 0 20px 45px -18px rgba(139, 124, 246, 0.4), 0 0 0 6px rgba(139, 124, 246, 0); }
	100% { box-shadow: 0 20px 45px -18px rgba(139, 124, 246, 0.3), 0 0 0 0px rgba(139, 124, 246, 0); }
`;

const slideInRight = keyframes`
	from { opacity: 0; transform: translateX(20px); }
	to { opacity: 1; transform: translateX(0); }
`;

const clickRipple = keyframes`
	0% { transform: scale(0.4); opacity: 0.9; }
	100% { transform: scale(2.4); opacity: 0; }
`;

// Small "Manage >" / "Details >" style header link, repeated across widget cards
// in the real app.
const CardLink: React.FC<{ label: string; linkRef?: (el: HTMLElement | null) => void }> = ({ label, linkRef }) => (
	<Stack ref={linkRef} direction="row" alignItems="center" spacing={0.1} sx={{ cursor: 'pointer' }}>
		<Typography sx={{ fontSize: '0.54rem', fontWeight: 700, color: appTheme.palette.primary.light }}>{label}</Typography>
		<ChevronRightIcon sx={{ fontSize: 11, color: appTheme.palette.primary.light }} />
	</Stack>
);

const CardShell: React.FC<{ title: string; link?: string; linkRef?: (el: HTMLElement | null) => void; gridColumn?: string; children: React.ReactNode }> = ({ title, link, linkRef, gridColumn, children }) => (
	<Box sx={{ gridColumn, borderRadius: appTheme.layout.radius.card, border: `1px solid ${appTheme.palette.divider}`, bgcolor: appTheme.palette.background.paper, p: 1.5, overflow: 'hidden' }}>
		<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.75 }}>
			<Typography sx={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.03em', color: appTheme.palette.text.secondary }}>{title.toUpperCase()}</Typography>
			{link && <CardLink label={link} linkRef={linkRef} />}
		</Stack>
		{children}
	</Box>
);

const StatCard: React.FC<{ stat: (typeof STATS)[number]; visible: boolean }> = ({ stat, visible }) => {
	const count = useCountUp(stat.value, visible);
	return (
		<Box sx={{ position: 'relative', borderRadius: appTheme.layout.radius.card, border: `1px solid ${appTheme.palette.divider}`, bgcolor: appTheme.palette.background.paper, p: 1.5, overflow: 'hidden' }}>
			<Box sx={{ position: 'absolute', top: 10, right: 10, width: 26, height: 26, borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${stat.color}, ${alpha(stat.color, 0.7)})`, boxShadow: `0 4px 12px -2px ${alpha(stat.color, 0.6)}` }}>
				<stat.icon sx={{ fontSize: 14, color: '#ffffff' }} />
			</Box>
			<Typography sx={{ fontSize: '0.56rem', fontWeight: 700, letterSpacing: '0.03em', color: appTheme.palette.text.secondary, mb: 0.6, pr: 3 }}>{stat.label.toUpperCase()}</Typography>
			<Typography sx={{ fontSize: '1.2rem', fontWeight: 800, color: appTheme.palette.text.primary, lineHeight: 1 }}>
				{stat.prefix ?? ''}{count.toLocaleString()}{stat.suffix ?? ''}
			</Typography>
			<Typography sx={{ fontSize: '0.58rem', color: appTheme.palette.text.secondary, mt: 0.4 }}>{stat.trend}</Typography>
		</Box>
	);
};

const TeamRolesCard: React.FC<{ manageRef?: (el: HTMLElement | null) => void }> = ({ manageRef }) => {
	const { ref, visible } = useOnceVisible<HTMLDivElement>();
	const total = ROLE_DATA.reduce((a, b) => a + b.value, 0);

	return (
		<Box ref={ref}>
			<CardShell title="Team Roles" link="Manage" linkRef={manageRef}>
				<Box sx={{ position: 'relative', height: 72 }}>
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
						<Typography sx={{ fontSize: '0.85rem', fontWeight: 800, color: appTheme.palette.text.primary, lineHeight: 1 }}>{total}</Typography>
						<Typography sx={{ fontSize: '0.48rem', color: appTheme.palette.text.secondary }}>total</Typography>
					</Box>
				</Box>
				<Stack spacing={0.6} sx={{ mt: 1 }}>
					{ROLE_DATA.map((role) => (
						<Box key={role.name}>
							<Stack direction="row" justifyContent="space-between">
								<Typography sx={{ fontSize: '0.58rem', color: appTheme.palette.text.secondary }}>{role.name}</Typography>
								<Typography sx={{ fontSize: '0.58rem', fontWeight: 700, color: appTheme.palette.text.primary }}>{role.value}%</Typography>
							</Stack>
							<Box sx={{ height: 4, borderRadius: 2, bgcolor: alpha(role.color, 0.15), mt: 0.25, overflow: 'hidden' }}>
								<Box sx={{ height: '100%', width: visible ? `${role.value}%` : 0, bgcolor: role.color, transition: 'width 700ms ease-out' }} />
							</Box>
						</Box>
					))}
				</Stack>
			</CardShell>
		</Box>
	);
};

const AiUsageCard: React.FC = () => {
	const { ref, visible } = useOnceVisible<HTMLDivElement>();

	return (
		<Box ref={ref} sx={{ gridColumn: 'span 2' }}>
			<CardShell title="AI Operations Usage" link="Limit: 5,000/mo" gridColumn="span 1">
				<Stack direction="row" spacing={2.5} sx={{ mb: 0.75 }}>
					<Box>
						<Typography sx={{ fontSize: '0.95rem', fontWeight: 800, color: appTheme.palette.text.primary, lineHeight: 1 }}>1,690</Typography>
						<Typography sx={{ fontSize: '0.55rem', color: appTheme.palette.text.secondary }}>consumed this week</Typography>
					</Box>
					<Box>
						<Typography sx={{ fontSize: '0.95rem', fontWeight: 800, color: appTheme.palette.text.primary, lineHeight: 1 }}>3,310</Typography>
						<Typography sx={{ fontSize: '0.55rem', color: appTheme.palette.text.secondary }}>remaining quota</Typography>
					</Box>
					<Stack direction="row" spacing={0.4} alignItems="center" sx={{ ml: 'auto', alignSelf: 'flex-start' }}>
						<TrendingDownIcon sx={{ fontSize: 12, color: appTheme.palette.success.main }} />
						<Typography sx={{ fontSize: '0.54rem', fontWeight: 700, color: appTheme.palette.success.main }}>Trending down</Typography>
					</Stack>
				</Stack>
				<Box sx={{ height: 56 }}>
					{visible && (
						<ResponsiveContainer width="100%" height="100%">
							<AreaChart data={USAGE_DATA} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
								<defs>
									<linearGradient id="usageFill" x1="0" y1="0" x2="0" y2="1">
										<stop offset="0%" stopColor={appTheme.palette.accent.main} stopOpacity={0.35} />
										<stop offset="100%" stopColor={appTheme.palette.accent.main} stopOpacity={0} />
									</linearGradient>
								</defs>
								<Area type="monotone" dataKey="usage" stroke={appTheme.palette.accent.main} strokeWidth={2} fill="url(#usageFill)" isAnimationActive={!prefersReducedMotion()} animationDuration={900} />
							</AreaChart>
						</ResponsiveContainer>
					)}
				</Box>
			</CardShell>
		</Box>
	);
};

const QuickActionsCard: React.FC<{ firstTileRef?: (el: HTMLElement | null) => void }> = ({ firstTileRef }) => (
	<CardShell title="Quick Actions">
		<Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0.6 }}>
			{QUICK_ACTIONS.map((action, i) => (
				<Stack
					key={action.label}
					ref={i === 0 ? firstTileRef : undefined}
					alignItems="flex-start"
					spacing={0.4}
					sx={{
						p: 0.65,
						borderRadius: 1.5,
						border: `1px solid ${appTheme.palette.divider}`,
						transition: 'transform 150ms ease-out, border-color 150ms ease-out',
						'&:hover': { transform: 'translateY(-2px)', borderColor: alpha(action.color, 0.6) },
					}}
				>
					<Box sx={{ width: 18, height: 18, borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: alpha(action.color, 0.18) }}>
						<action.icon sx={{ fontSize: 11, color: action.color }} />
					</Box>
					<Typography sx={{ fontSize: '0.47rem', fontWeight: 700, color: appTheme.palette.text.primary, textAlign: 'left', lineHeight: 1.15 }}>
						{action.label}
					</Typography>
					<Typography sx={{ fontSize: '0.41rem', color: appTheme.palette.text.secondary, textAlign: 'left', lineHeight: 1.15 }}>
						{action.sub}
					</Typography>
				</Stack>
			))}
		</Box>
	</CardShell>
);

const TabbedTableCard: React.FC<{
	activeTab: number;
	onTabChange: (i: number) => void;
	tabRef: (el: HTMLElement | null, i: number) => void;
}> = ({ activeTab, onTabChange, tabRef }) => {
	const active = TABS[activeTab];

	return (
		<Box sx={{ gridColumn: 'span 2' }}>
			<Box sx={{ borderRadius: appTheme.layout.radius.card, border: `1px solid ${appTheme.palette.divider}`, bgcolor: appTheme.palette.background.paper, p: 1.5, overflow: 'hidden' }}>
				<Stack direction="row" spacing={0.5} sx={{ mb: 1, borderBottom: `1px solid ${appTheme.palette.divider}`, pb: 0.75 }}>
					{TABS.map((t, i) => (
						<Stack
							key={t.label}
							ref={(el) => tabRef(el, i)}
							direction="row"
							alignItems="center"
							spacing={0.4}
							onClick={() => onTabChange(i)}
							sx={{
								px: 1,
								py: 0.35,
								borderRadius: appTheme.layout.radius.pill,
								cursor: 'pointer',
								bgcolor: activeTab === i ? alpha(appTheme.palette.primary.main, 0.18) : 'transparent',
							}}
						>
							<t.icon sx={{ fontSize: 12, color: activeTab === i ? appTheme.palette.primary.light : appTheme.palette.text.secondary }} />
							<Typography sx={{ fontSize: '0.58rem', fontWeight: 700, color: activeTab === i ? appTheme.palette.primary.light : appTheme.palette.text.secondary }}>
								{t.label}
							</Typography>
						</Stack>
					))}
				</Stack>
				<Stack direction="row" sx={{ px: 1, mb: 0.5 }}>
					{['Title', 'Priority', 'Status', 'Est. Value'].map((h, i) => (
						<Typography key={h} sx={{ flex: i === 0 ? 2 : 1, fontSize: '0.5rem', fontWeight: 700, letterSpacing: '0.03em', color: appTheme.palette.text.secondary, textAlign: i === 0 ? 'left' : 'right' }}>
							{h.toUpperCase()}
						</Typography>
					))}
				</Stack>
				<Stack spacing={0.6}>
					{active.rows.map((row) => (
						<Stack key={row.title} direction="row" alignItems="center" sx={{ px: 1, py: 0.6, borderRadius: 1, bgcolor: appTheme.palette.background.default }}>
							<Typography sx={{ flex: 2, fontSize: '0.58rem', fontWeight: 600, color: appTheme.palette.text.primary }} noWrap>{row.title}</Typography>
							<Box sx={{ flex: 1, textAlign: 'right' }}>
								<Box component="span" sx={{ display: 'inline-block', fontSize: '0.52rem', fontWeight: 700, color: PRIORITY_COLOR[row.priority], px: 0.6, py: 0.1, borderRadius: 1, bgcolor: alpha(PRIORITY_COLOR[row.priority], 0.15) }}>
									{row.priority}
								</Box>
							</Box>
							<Typography sx={{ flex: 1, fontSize: '0.56rem', color: appTheme.palette.text.secondary, textAlign: 'right' }} noWrap>{row.status}</Typography>
							<Typography sx={{ flex: 1, fontSize: '0.58rem', fontWeight: 700, color: appTheme.palette.text.primary, textAlign: 'right' }}>{row.value}</Typography>
						</Stack>
					))}
				</Stack>
			</Box>
		</Box>
	);
};

const WhoOnLeaveCard: React.FC = () => {
	const people = [
		{ initials: 'PN', name: 'Priya N.', dates: 'Jul 28–30' },
		{ initials: 'RK', name: 'Rahul K.', dates: 'Aug 2' },
	];
	return (
		<CardShell title="Who's On Leave" link="Leaves Calendar">
			<Stack spacing={0.75}>
				{people.map((p) => (
					<Stack key={p.name} direction="row" spacing={0.75} alignItems="center">
						<Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: alpha(appTheme.palette.primary.main, 0.2), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
							<Typography sx={{ fontSize: '0.5rem', fontWeight: 700, color: appTheme.palette.primary.light }}>{p.initials}</Typography>
						</Box>
						<Box sx={{ minWidth: 0 }}>
							<Typography sx={{ fontSize: '0.6rem', fontWeight: 600, color: appTheme.palette.text.primary }} noWrap>{p.name}</Typography>
							<Typography sx={{ fontSize: '0.55rem', color: appTheme.palette.text.secondary }}>{p.dates}</Typography>
						</Box>
					</Stack>
				))}
			</Stack>
		</CardShell>
	);
};

const BillingStatusCard: React.FC = () => (
	<CardShell title="Billing Status" link="Details">
		<Stack spacing={0.55}>
			{BILLING_ROWS.map((row) => (
				<Stack key={row.label} direction="row" justifyContent="space-between">
					<Typography sx={{ fontSize: '0.56rem', color: appTheme.palette.text.secondary }}>{row.label}</Typography>
					<Typography sx={{ fontSize: '0.56rem', fontWeight: 700, color: appTheme.palette.text.primary }}>{row.value}</Typography>
				</Stack>
			))}
			<Stack direction="row" justifyContent="space-between" alignItems="center">
				<Typography sx={{ fontSize: '0.56rem', color: appTheme.palette.text.secondary }}>Status</Typography>
				<Box sx={{ px: 0.75, py: 0.15, borderRadius: 1, bgcolor: alpha(appTheme.palette.success.main, 0.18) }}>
					<Typography sx={{ fontSize: '0.5rem', fontWeight: 700, color: appTheme.palette.success.main }}>ACTIVE</Typography>
				</Box>
			</Stack>
			<Stack direction="row" alignItems="center" spacing={0.4} sx={{ pt: 0.25 }}>
				<VerifiedUserIcon sx={{ fontSize: 11, color: appTheme.palette.text.secondary }} />
				<Typography sx={{ fontSize: '0.5rem', color: appTheme.palette.text.secondary }}>Secured payments</Typography>
			</Stack>
		</Stack>
	</CardShell>
);

// Target keys the simulated cursor visits, in order, on an infinite loop.
type CursorTargetKey = 'search' | 'tabDeals' | 'tabProjects' | 'quickAction' | 'manageLink' | 'tabLeads';

const DashboardPreviewSection: React.FC = () => {
	const theme = useTheme();
	const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
	const { ref: statsRef, visible: statsVisible } = useOnceVisible<HTMLDivElement>();
	const [irisMsgIndex, setIrisMsgIndex] = useState(0);

	useEffect(() => {
		const interval = setInterval(() => {
			setIrisMsgIndex((prev) => (prev + 1) % 3);
		}, 4200);
		return () => clearInterval(interval);
	}, []);

	const irisMessages = [
		'Moved 3 tasks to Done and notified the team.',
		'Updated active leads value to ₹182k.',
		'Sent weekly project summary to Northline IT.',
	];

	// A quiet "this is alive" touch, mirroring the real dashboard's own greeting —
	// not meant to imply live data, just a believable, current-feeling mockup.
	const now = new Date();
	const hour = now.getHours();
	const timeOfDay = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
	const formattedDate = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

	// Simulated cursor: makes the static mockup read like a silent screen
	// recording of someone actually using the product, instead of a frozen
	// screenshot — it walks between real measured DOM targets, "clicks" (which
	// drives the same tab state a real click would), pauses, and loops.
	const frameRef = useRef<HTMLDivElement | null>(null);
	const searchRef = useRef<HTMLDivElement | null>(null);
	const tabRefs = useRef<Record<number, HTMLElement | null>>({});
	const quickActionRef = useRef<HTMLElement | null>(null);
	const manageRef = useRef<HTMLElement | null>(null);

	const [activeTab, setActiveTab] = useState(0);
	const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
	const [cursorClicking, setCursorClicking] = useState(false);

	useEffect(() => {
		// Skip the loop entirely below desktop widths or when the user has asked
		// for reduced motion — cursorPos just stays null and nothing renders.
		if (!isDesktop || prefersReducedMotion()) return;

		const targets: Record<CursorTargetKey, () => HTMLElement | null> = {
			search: () => searchRef.current,
			tabDeals: () => tabRefs.current[1] ?? null,
			tabProjects: () => tabRefs.current[2] ?? null,
			tabLeads: () => tabRefs.current[0] ?? null,
			quickAction: () => quickActionRef.current,
			manageLink: () => manageRef.current,
		};

		const steps: { key: CursorTargetKey; travelMs: number; dwellMs: number; onArrive?: () => void }[] = [
			{ key: 'search', travelMs: 700, dwellMs: 1000 },
			{ key: 'tabDeals', travelMs: 900, dwellMs: 1300, onArrive: () => setActiveTab(1) },
			{ key: 'tabProjects', travelMs: 700, dwellMs: 1300, onArrive: () => setActiveTab(2) },
			{ key: 'quickAction', travelMs: 800, dwellMs: 1100 },
			{ key: 'manageLink', travelMs: 800, dwellMs: 1100 },
			{ key: 'tabLeads', travelMs: 900, dwellMs: 1300, onArrive: () => setActiveTab(0) },
		];

		let stepIndex = 0;
		let cancelled = false;
		let timeoutId: ReturnType<typeof setTimeout>;

		const runStep = () => {
			if (cancelled) return;
			const step = steps[stepIndex];
			const frame = frameRef.current;
			const target = targets[step.key]();

			if (!frame || !target) {
				timeoutId = setTimeout(runStep, 300);
				return;
			}

			const frameRect = frame.getBoundingClientRect();
			const targetRect = target.getBoundingClientRect();
			setCursorPos({
				x: targetRect.left + targetRect.width / 2 - frameRect.left,
				y: targetRect.top + targetRect.height / 2 - frameRect.top,
			});
			setCursorClicking(false);

			timeoutId = setTimeout(() => {
				if (cancelled) return;
				setCursorClicking(true);
				step.onArrive?.();
				timeoutId = setTimeout(() => {
					if (cancelled) return;
					setCursorClicking(false);
					stepIndex = (stepIndex + 1) % steps.length;
					runStep();
				}, step.dwellMs);
			}, step.travelMs);
		};

		// Give the frame a moment to finish laying out before the first measurement.
		timeoutId = setTimeout(runStep, 700);

		return () => {
			cancelled = true;
			clearTimeout(timeoutId);
			setCursorPos(null);
		};
	}, [isDesktop]);

	return (
		<Box component="section" id="preview" sx={{ bgcolor: theme.palette.background.paper, py: { xs: 9, md: 12 }, overflow: 'hidden' }}>
			<Container maxWidth="lg">
				<Reveal>
					<Box sx={{ textAlign: 'center', maxWidth: 620, mx: 'auto', mb: { xs: 8, md: 10 } }}>
						<Typography sx={{ fontSize: theme.typography.chipLabel.fontSize, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: theme.palette.accent.dark, mb: 1.5 }}>
							See It In Action
						</Typography>
						<Typography component="h2" variant="h2" sx={{ color: theme.palette.text.primary, mb: 2 }}>
							See your whole business in one screen
						</Typography>
						<Typography sx={{ color: theme.palette.text.secondary, fontSize: theme.typography.body1.fontSize, lineHeight: 1.65 }}>
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

						{/* Browser-chrome-framed app mockup — the frame itself sits on the light
						    landing theme, but everything inside it renders in the product's actual
						    fixed-dark workspace look (appTheme), not the ambient landing theme. */}
						<Box
							ref={frameRef}
							sx={{
								position: 'relative',
								borderRadius: '18px',
								overflow: 'hidden',
								border: `1px solid ${theme.palette.divider}`,
								boxShadow: '0 50px 100px -30px rgba(15, 23, 42, 0.4)',
								bgcolor: appTheme.palette.background.default,
								transform: 'perspective(1800px) rotateX(3deg) rotateY(-4deg)',
								animation: `${float} 7s ease-in-out infinite`,
								transition: 'transform 400ms ease-out',
								'&:hover': { transform: 'perspective(1800px) rotateX(0deg) rotateY(0deg) scale(1.015)' },
								'@media (prefers-reduced-motion: reduce)': { animation: 'none', transform: 'none', '&:hover': { transform: 'none' } },
							}}
						>
							{/* Browser chrome bar */}
							<Stack direction="row" alignItems="center" spacing={1.5} sx={{ px: 2, py: 1.1, bgcolor: '#05060a', borderBottom: `1px solid ${appTheme.palette.divider}` }}>
								<Stack direction="row" spacing={0.75}>
									{['#ef4444', '#f59e0b', '#10b981'].map((c) => (
										<Box key={c} sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: c }} />
									))}
								</Stack>
								<Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
									<Stack direction="row" alignItems="center" spacing={0.6} sx={{ px: 2, py: 0.35, borderRadius: appTheme.layout.radius.pill, bgcolor: appTheme.palette.background.paper, border: `1px solid ${appTheme.palette.divider}` }}>
										<LockIcon sx={{ fontSize: 11, color: appTheme.palette.success.main }} />
										<Typography sx={{ fontSize: '0.68rem', color: appTheme.palette.text.secondary }}>gravit.taydens.com/dashboard</Typography>
									</Stack>
								</Box>
							</Stack>

							{/* In-app top bar */}
							<Stack direction="row" alignItems="center" spacing={1.25} sx={{ px: 2, py: 1, bgcolor: appTheme.palette.background.paper, borderBottom: `1px solid ${appTheme.palette.divider}` }}>
								<MenuIcon sx={{ fontSize: 16, color: appTheme.palette.text.secondary, display: { xs: 'none', sm: 'block' } }} />
								<Stack ref={searchRef} direction="row" alignItems="center" spacing={0.6} sx={{ flex: 1, maxWidth: 220, px: 1.25, py: 0.5, borderRadius: appTheme.layout.radius.pill, bgcolor: appTheme.palette.background.default }}>
									<SearchIcon sx={{ fontSize: 13, color: appTheme.palette.text.secondary }} />
									<Typography sx={{ fontSize: '0.6rem', color: appTheme.palette.text.secondary, flex: 1 }} noWrap>Search services, features</Typography>
									<Box sx={{ display: { xs: 'none', md: 'block' }, px: 0.5, py: 0.05, borderRadius: 0.5, border: `1px solid ${appTheme.palette.divider}` }}>
										<Typography sx={{ fontSize: '0.48rem', fontWeight: 700, color: appTheme.palette.text.secondary }}>Alt+S</Typography>
									</Box>
								</Stack>
								<Box sx={{ flex: 1 }} />
								<Stack direction="row" alignItems="center" spacing={0.4} sx={{ display: { xs: 'none', sm: 'flex' }, px: 1, py: 0.3, borderRadius: appTheme.layout.radius.badge, border: `1px solid ${alpha(appTheme.palette.warning.main, 0.4)}` }}>
									<AccessTimeIcon sx={{ fontSize: 11, color: appTheme.palette.warning.main }} />
									<Typography sx={{ fontSize: '0.56rem', fontWeight: 700, color: appTheme.palette.warning.main }}>20 days left</Typography>
								</Stack>
								<Stack direction="row" alignItems="center" spacing={0.4} sx={{ display: { xs: 'none', sm: 'flex' }, px: 1, py: 0.3, borderRadius: appTheme.layout.radius.badge, border: `1px solid ${alpha(appTheme.palette.accent.main, 0.4)}` }}>
									<BoltIcon sx={{ fontSize: 11, color: appTheme.palette.accent.main }} />
									<Typography sx={{ fontSize: '0.56rem', fontWeight: 700, color: appTheme.palette.accent.main }}>44 credits</Typography>
								</Stack>
								<Box sx={{ display: { xs: 'none', md: 'block' }, px: 1, py: 0.3, borderRadius: appTheme.layout.radius.badge, border: `1px solid ${appTheme.palette.divider}` }}>
									<Typography sx={{ fontSize: '0.56rem', fontWeight: 700, color: appTheme.palette.text.secondary }}>₹ INR</Typography>
								</Box>
								<Stack direction="row" spacing={0.25}>
									{[DarkModeIcon, NotificationsIcon].map((Icon, i) => (
										<Box key={i} sx={{ width: 22, height: 22, borderRadius: '50%', display: { xs: 'none', sm: 'flex' }, alignItems: 'center', justifyContent: 'center' }}>
											<Icon sx={{ fontSize: 13, color: appTheme.palette.text.secondary }} />
										</Box>
									))}
								</Stack>
								<Stack direction="row" alignItems="center" spacing={0.4} sx={{ px: 1, py: 0.4, borderRadius: appTheme.layout.radius.button, background: appTheme.gradients.brandDiagonal }}>
									<HeadsetMicIcon sx={{ fontSize: 12, color: '#ffffff' }} />
									<Typography sx={{ fontSize: '0.54rem', fontWeight: 700, color: '#ffffff', display: { xs: 'none', md: 'block' } }}>Help & Support</Typography>
								</Stack>
							</Stack>

							{/* App body */}
							<Stack direction="row">
								{/* Sidebar */}
								<Stack sx={{ display: { xs: 'none', sm: 'flex' }, width: 176, flexShrink: 0, bgcolor: theme.layout.sidebar.background, borderRight: `1px solid ${theme.layout.sidebar.divider}`, p: 2 }}>
									<Box
										component="img"
										src="/assets/img/logo/gravit-light.svg"
										alt="Gravit"
										sx={{ height: 18, mb: 2.25, display: 'block' }}
									/>
									<Stack spacing={1.25} sx={{ flex: 1, overflow: 'hidden' }}>
										{NAV_GROUPS.map((group) => (
											<Box key={group.label}>
												<Typography sx={{ fontSize: '0.5rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: theme.layout.sidebar.textMuted, mb: 0.4, px: 1 }}>
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
															<Typography sx={{ fontSize: '0.6rem', fontWeight: item.active ? 700 : 500, color: item.active ? theme.layout.sidebar.textHover : alpha(theme.layout.sidebar.text, 0.55) }} noWrap>
																{item.label}
															</Typography>
														</Stack>
													))}
												</Stack>
											</Box>
										))}
									</Stack>

									{/* Signed-in user, pinned to the sidebar base */}
									<Stack direction="row" alignItems="center" spacing={0.85} sx={{ pt: 1.5, mt: 1, borderTop: `1px solid ${theme.layout.sidebar.divider}` }}>
										<Box sx={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: theme.gradients.brandDiagonal }}>
											<Typography sx={{ fontSize: '0.55rem', fontWeight: 800, color: theme.palette.common.white }}>AM</Typography>
										</Box>
										<Box sx={{ minWidth: 0 }}>
											<Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: theme.layout.sidebar.textHover }} noWrap>Alex Morgan</Typography>
											<Typography sx={{ fontSize: '0.52rem', color: theme.layout.sidebar.textMuted }} noWrap>Admin Role</Typography>
										</Box>
									</Stack>
								</Stack>

								{/* Main content widgets */}
								<Stack ref={statsRef} sx={{ flex: 1, minWidth: 0 }}>
									<Box sx={{ p: { xs: 1.5, sm: 2 }, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
										{/* Greeting */}
										<Box sx={{ mb: 0.25 }}>
											<Typography sx={{ fontSize: '0.85rem', fontWeight: 800, color: appTheme.palette.text.primary, lineHeight: 1.2 }}>
												Good {timeOfDay}, Alex 👋
											</Typography>
											<Typography sx={{ fontSize: '0.56rem', color: appTheme.palette.text.secondary, mt: 0.25 }}>
												Here's how your team is doing today · {formattedDate}
											</Typography>
										</Box>

										{/* Row 1: stat cards */}
										<Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1.25 }}>
											{STATS.map((stat) => (
												<StatCard key={stat.label} stat={stat} visible={statsVisible} />
											))}
										</Box>

										{/* Row 2: donut + AI usage + quick actions */}
										<Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1.25 }}>
											<TeamRolesCard manageRef={(el) => { manageRef.current = el; }} />
											<AiUsageCard />
											<QuickActionsCard firstTileRef={(el) => { quickActionRef.current = el; }} />
										</Box>

										{/* Row 3: tabbed table + who's on leave + billing */}
										<Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1.25 }}>
											<TabbedTableCard
												activeTab={activeTab}
												onTabChange={setActiveTab}
												tabRef={(el, i) => { tabRefs.current[i] = el; }}
											/>
											<WhoOnLeaveCard />
											<BillingStatusCard />
										</Box>
									</Box>

									{/* Footer bar — links kept short and few since this is a fixed-width
									    mockup frame, not the real (full-width) app footer. */}
									<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: { xs: 1.5, sm: 2 }, py: 1, borderTop: `1px solid ${appTheme.palette.divider}` }}>
										<Typography sx={{ fontSize: '0.48rem', color: appTheme.palette.text.secondary }} noWrap>
											© {now.getFullYear()} Gravit. All rights reserved.
										</Typography>
										<Stack direction="row" spacing={1}>
											{['Terms', 'Privacy', 'Security'].map((link) => (
												<Typography key={link} sx={{ fontSize: '0.48rem', color: appTheme.palette.text.secondary }} noWrap>
													{link}
												</Typography>
											))}
										</Stack>
									</Stack>
								</Stack>
							</Stack>

							{/* Simulated cursor — walks between the refs above, "clicks" (whic drives the same activeTab state a real click would), and loops. */}
							{cursorPos && (
								<Box
									sx={{
										position: 'absolute',
										top: 0,
										left: 0,
										zIndex: 5,
										pointerEvents: 'none',
										transform: `translate(${cursorPos.x - 3}px, ${cursorPos.y - 2}px)`,
										transition: 'transform 750ms cubic-bezier(0.22, 1, 0.36, 1)',
									}}
								>
									<CursorIcon
										sx={{
											fontSize: 18,
											color: '#ffffff',
											transform: 'rotate(-15deg)',
											filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.55))',
										}}
									/>
									{cursorClicking && (
										<Box
											sx={{
												position: 'absolute',
												top: 2,
												left: 2,
												width: 12,
												height: 12,
												borderRadius: '50%',
												border: `2px solid ${appTheme.palette.primary.light}`,
												animation: `${clickRipple} 550ms ease-out`,
											}}
										/>
									)}
								</Box>
							)}
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
								border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
								bgcolor: alpha(theme.palette.background.paper, 0.8),
								backdropFilter: 'blur(16px)',
								boxShadow: '0 20px 45px -18px rgba(15, 23, 42, 0.3)',
								p: 1.75,
								zIndex: 2,
								animation: `${irisFloat} 6s ease-in-out infinite, ${glowPulse} 4s ease-in-out infinite`,
							}}
						>
							<Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 1 }}>
								<Box
									sx={{
										width: 20,
										height: 20,
										borderRadius: '50%',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										background: theme.gradients.brandDiagonal,
										boxShadow: `0 0 10px ${alpha(theme.palette.primary.main, 0.5)}`,
									}}
								>
									<AutoAwesomeIcon sx={{ fontSize: 11, color: theme.palette.common.white, animation: `${spin} 8s linear infinite` }} />
								</Box>
								<Typography sx={{ fontSize: theme.typography.caption.fontSize, fontWeight: 700, color: theme.palette.text.primary, letterSpacing: '0.02em' }}>IRIS AI</Typography>
							</Stack>
							<Box sx={{ overflow: 'hidden', minHeight: 40 }}>
								<Stack key={irisMsgIndex} direction="row" spacing={0.6} alignItems="flex-start" sx={{ animation: `${slideInRight} 300ms ease-out` }}>
									<CheckCircleIcon sx={{ fontSize: 13, color: theme.palette.success.main, mt: 0.2, flexShrink: 0 }} />
									<Typography sx={{ fontSize: theme.typography.caption.fontSize, color: theme.palette.text.secondary, lineHeight: 1.4 }}>
										{irisMessages[irisMsgIndex]}
									</Typography>
								</Stack>
							</Box>
						</Box>

					</Box>
				</Reveal>
			</Container>
		</Box>
	);
};

export default DashboardPreviewSection;
