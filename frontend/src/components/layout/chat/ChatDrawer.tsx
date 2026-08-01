import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
	Drawer,
	Box,
	Stack,
	Typography,
	IconButton,
	Chip,
	TextField,
	Button,
	CircularProgress,
	Paper,
	useTheme,
	alpha,
	Tooltip,
	Fade,
	keyframes,
} from '@mui/material';
import {
	CloseOutlined,
	AutoAwesome,
	SendRounded,
	CheckOutlined,
	HistoryRounded,
	AddCircleOutlineRounded,
	DeleteOutlineRounded,
	ArrowBackRounded,
	WarningAmberRounded,
	KeyboardArrowDownRounded,
	OpenInFullRounded,
	CloseFullscreenRounded,
	CalendarMonthOutlined,
	TodayOutlined,
	GroupsOutlined,
	TrendingUpOutlined,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAIChat } from '../../../hooks/useAIChat';
import { useAppSelector } from '../../../store/hooks';
import EnterpriseAvatar from '../../common/avatar/Avatar';

dayjs.extend(relativeTime);

interface ChatDrawerProps {
	open: boolean;
	onClose: () => void;
}

const BRAND = '#8B7CF6';

// Matches the module-local check Reveal.tsx already uses for landing-page motion -- no
// shared hook exists yet, so this stays a small local copy rather than a premature export.
const prefersReducedMotion = () =>
	typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ── Animations ───────────────────────────────────────────────────────────────
const dotPulse = keyframes`
	0%, 80%, 100% { opacity: 0.25; transform: scale(0.7); }
	40% { opacity: 1; transform: scale(1); }
`;

const noMotion = { '@media (prefers-reduced-motion: reduce)': { animation: 'none' } } as const;

// ── Suggested starter prompts (empty state) ─────────────────────────────────
// Tapping fills-and-sends immediately, same "one click, no typing required" idea as
// IrisTaskPanel's QUICK_ACTIONS -- there's no preview step in this drawer's model (unlike
// IrisTaskPanel), so "send" is the direct equivalent of that pattern here.
const SUGGESTED_PROMPTS: { label: string; icon: React.ReactNode; prompt: string }[] = [
	{ label: "What's on my calendar this week?", icon: <CalendarMonthOutlined sx={{ fontSize: 15 }} />, prompt: "What's on my calendar this week?" },
	{ label: 'Log 2 hours on a project', icon: <TodayOutlined sx={{ fontSize: 15 }} />, prompt: 'Log 2 hours on a project for today.' },
	{ label: "Who's on leave today?", icon: <GroupsOutlined sx={{ fontSize: 15 }} />, prompt: "Who's on leave today?" },
	{ label: 'Show my open deals', icon: <TrendingUpOutlined sx={{ fontSize: 15 }} />, prompt: 'Show my open deals.' },
];

/** Three-dot "IRIS is working" pulse -- the AI-native pattern the design system calls for
 * instead of a generic spinner, reused both standalone (status row) and inline (a message
 * still streaming with no tokens yet). */
const TypingDots: React.FC<{ color?: string }> = ({ color = BRAND }) => (
	<Stack direction="row" spacing={0.5} alignItems="center" sx={{ px: 0.25, py: 0.5 }}>
		{[0, 1, 2].map((i) => (
			<Box
				key={i}
				sx={{
					width: 5,
					height: 5,
					borderRadius: '50%',
					bgcolor: color,
					animation: `${dotPulse} 1.2s ease-in-out infinite`,
					animationDelay: `${i * 0.16}s`,
					...noMotion,
				}}
			/>
		))}
	</Stack>
);

/** Crossfades statusLabel text on change (e.g. "Searching CRM…" -> "Creating task…") instead
 * of jump-cutting -- a single node whose opacity/translate is toggled around the text swap,
 * skipped entirely under reduced-motion. */
const StatusLabel: React.FC<{ label: string }> = ({ label }) => {
	const reduced = useRef(prefersReducedMotion());
	const [display, setDisplay] = useState(label);
	const [visible, setVisible] = useState(true);

	useEffect(() => {
		if (label === display) return;
		if (reduced.current) {
			setDisplay(label);
			return;
		}
		setVisible(false);
		const t = setTimeout(() => {
			setDisplay(label);
			setVisible(true);
		}, 140);
		return () => clearTimeout(t);
	}, [label, display]);

	return (
		<Typography
			variant="caption"
			sx={{
				color: 'text.secondary',
				fontWeight: 600,
				opacity: visible ? 1 : 0,
				transform: visible ? 'translateY(0)' : 'translateY(-3px)',
				transition: 'opacity 140ms ease, transform 140ms ease',
			}}
		>
			{display}
		</Typography>
	);
};

/** Renders an assistant message's markdown (bold/italic/lists/code/tables) with MUI-themed
 * elements -- user messages stay plain text (they're what the person literally typed). */
const MarkdownMessage: React.FC<{ content: string }> = ({ content }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';

	return (
		<Box sx={{ fontSize: '0.85rem', lineHeight: 1.65, '& > *:first-of-type': { mt: 0 }, '& > *:last-of-type': { mb: 0 } }}>
			<ReactMarkdown
				remarkPlugins={[remarkGfm]}
				components={{
					p: ({ children }) => (
						<Typography variant="body2" sx={{ fontSize: 'inherit', lineHeight: 'inherit', my: 0.75 }}>{children}</Typography>
					),
					strong: ({ children }) => <Box component="strong" sx={{ fontWeight: 700 }}>{children}</Box>,
					em: ({ children }) => <Box component="em" sx={{ fontStyle: 'italic' }}>{children}</Box>,
					ul: ({ children }) => (
						<Box component="ul" sx={{ pl: 2.25, my: 0.5, display: 'flex', flexDirection: 'column', gap: 0.35 }}>{children}</Box>
					),
					ol: ({ children }) => (
						<Box component="ol" sx={{ pl: 2.25, my: 0.5, display: 'flex', flexDirection: 'column', gap: 0.35 }}>{children}</Box>
					),
					li: ({ children }) => <Box component="li" sx={{ fontSize: '0.85rem' }}>{children}</Box>,
					a: ({ href, children }) => (
						<Box
							component="a"
							href={href}
							target="_blank"
							rel="noopener noreferrer"
							sx={{ color: BRAND, fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: '2px' }}
						>
							{children}
						</Box>
					),
					code: ({ className, children }) => {
						const isBlock = /language-/.test(className || '');
						if (isBlock) {
							return (
								<Box component="code" className={className} sx={{ fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace', fontSize: '0.78rem' }}>
									{children}
								</Box>
							);
						}
						return (
							<Box
								component="code"
								sx={{
									fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
									fontSize: '0.8em',
									bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
									px: 0.6,
									py: 0.15,
									borderRadius: '4px',
								}}
							>
								{children}
							</Box>
						);
					},
					pre: ({ children }) => (
						<Box
							component="pre"
							sx={{
								overflowX: 'auto',
								p: 1.25,
								my: 0.75,
								borderRadius: '8px',
								bgcolor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.04)',
								border: '1px solid',
								borderColor: 'divider',
							}}
						>
							{children}
						</Box>
					),
					table: ({ children }) => (
						<Box sx={{ overflowX: 'auto', my: 0.75 }}>
							<Box component="table" sx={{ borderCollapse: 'collapse', width: '100%', fontSize: '0.8rem' }}>{children}</Box>
						</Box>
					),
					th: ({ children }) => (
						<Box component="th" sx={{ textAlign: 'left', borderBottom: '2px solid', borderColor: 'divider', p: 0.6, fontWeight: 700 }}>{children}</Box>
					),
					td: ({ children }) => (
						<Box component="td" sx={{ borderBottom: '1px solid', borderColor: 'divider', p: 0.6 }}>{children}</Box>
					),
				}}
			>
				{content}
			</ReactMarkdown>
		</Box>
	);
};

/** Buckets sessions into Today / Yesterday / Earlier for the history view -- purely a
 * display grouping, doesn't touch the sessions array useAIChat hands back. */
const groupSessionsByRecency = <T extends { created_at: string }>(sessions: T[]) => {
	const today: T[] = [];
	const yesterday: T[] = [];
	const earlier: T[] = [];
	const now = dayjs();
	for (const s of sessions) {
		const d = dayjs(s.created_at);
		if (d.isSame(now, 'day')) today.push(s);
		else if (d.isSame(now.subtract(1, 'day'), 'day')) yesterday.push(s);
		else earlier.push(s);
	}
	return [
		{ label: 'Today', items: today },
		{ label: 'Yesterday', items: yesterday },
		{ label: 'Earlier', items: earlier },
	].filter((g) => g.items.length > 0);
};

export const ChatDrawer: React.FC<ChatDrawerProps> = ({ open, onClose }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const reducedMotion = useRef(prefersReducedMotion()).current;
	const currentUser = useAppSelector((state) => state.auth.user);

	const [input, setInput] = useState('');
	const [showSessions, setShowSessions] = useState(false);
	const [rejectReason, setRejectReason] = useState('');
	const [showRejectReason, setShowRejectReason] = useState(false);
	const [expanded, setExpanded] = useState(false);
	const [showScrollButton, setShowScrollButton] = useState(false);

	const scrollRef = useRef<HTMLDivElement | null>(null);
	const nearBottomRef = useRef(true);
	const forceScrollRef = useRef(false);

	const {
		sessions,
		loadingSessions,
		activeSessionId,
		messages,
		loadingMessages,
		sending,
		statusLabel,
		pendingApproval,
		deciding,
		openSession,
		startNewSession,
		removeSession,
		sendMessage,
		approve,
		reject,
	} = useAIChat(open);

	const scrollToBottom = useCallback((smooth = true) => {
		const el = scrollRef.current;
		if (!el) return;
		el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
		nearBottomRef.current = true;
		setShowScrollButton(false);
	}, []);

	// Auto-scrolls only when the user was already near the bottom (or just sent/opened
	// something, via forceScrollRef) -- someone scrolled up to reread history shouldn't get
	// yanked back down by a streaming token or status change.
	useEffect(() => {
		if (forceScrollRef.current || nearBottomRef.current) {
			scrollToBottom(true);
			forceScrollRef.current = false;
		}
	}, [messages, statusLabel, pendingApproval, scrollToBottom]);

	const handleScroll = () => {
		const el = scrollRef.current;
		if (!el) return;
		const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
		const atBottom = distanceFromBottom < 64;
		nearBottomRef.current = atBottom;
		setShowScrollButton(!atBottom && messages.length > 0);
	};

	const handleSend = (overrideText?: string) => {
		const text = (overrideText ?? input).trim();
		if (!text) return;
		setInput('');
		setShowSessions(false);
		forceScrollRef.current = true;
		sendMessage(text);
	};

	const handleReject = () => {
		reject(rejectReason.trim() || undefined);
		setRejectReason('');
		setShowRejectReason(false);
	};

	const activeSession = sessions.find((s) => s.id === activeSessionId);
	const groupedSessions = useMemo(() => groupSessionsByRecency(sessions), [sessions]);
	const userName = currentUser?.full_name || currentUser?.email || 'You';

	return (
		<Drawer
			anchor="right"
			open={open}
			onClose={onClose}
			PaperProps={{
				sx: {
					width: { xs: '100%', sm: expanded ? 560 : 420 },
					maxWidth: '100%',
					// The app's global MuiDrawer override hardcodes a dark paper background/text
					// color regardless of light/dark mode -- override back to real theme colors,
					// same as every other drawer in the app (IrisTaskPanel, ProjectTaskDetailDrawer).
					bgcolor: theme.palette.background.paper,
					color: theme.palette.text.primary,
					boxShadow: 'none',
					transition: reducedMotion ? 'none' : 'width 200ms ease',
				},
			}}
		>
			<Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
				{/* Header — soft brand wash behind a refined mark, not just a thin top bar */}
				<Box
					sx={{
						position: 'relative',
						background: isDark
							? `linear-gradient(180deg, ${alpha(BRAND, 0.16)} 0%, ${alpha(BRAND, 0)} 100%)`
							: `linear-gradient(180deg, ${alpha(BRAND, 0.09)} 0%, ${alpha(BRAND, 0)} 100%)`,
					}}
				>
					<Box sx={{ height: 2.5, background: theme.gradients?.brandDiagonal }} />
					<Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2.5, pt: 2, pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
						<Stack direction="row" alignItems="center" spacing={1.5} sx={{ minWidth: 0 }}>
							{showSessions ? (
								<IconButton size="small" onClick={() => setShowSessions(false)} sx={{ bgcolor: 'action.hover' }}>
									<ArrowBackRounded fontSize="small" />
								</IconButton>
							) : (
								<Box
									sx={{
										width: 42,
										height: 42,
										borderRadius: '12px',
										background: theme.gradients?.brandDiagonal,
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										flexShrink: 0,
										boxShadow: `0 4px 16px -4px ${alpha(BRAND, 0.55)}`,
									}}
								>
									<AutoAwesome sx={{ fontSize: 21, color: '#fff' }} />
								</Box>
							)}
							<Box sx={{ minWidth: 0 }}>
								<Stack direction="row" alignItems="center" spacing={0.9}>
									<Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.1, fontSize: '1.05rem' }}>
										{showSessions ? 'Conversations' : 'IRIS'}
									</Typography>
									{!showSessions && (
										<Chip
											label="AI co-worker"
											size="small"
											sx={{
												height: 19,
												fontSize: '0.62rem',
												fontWeight: 700,
												bgcolor: alpha(BRAND, 0.12),
												color: isDark ? '#C9BFFF' : '#6B54E8',
												border: '1px solid',
												borderColor: alpha(BRAND, 0.3),
												'& .MuiChip-label': { px: 0.85 },
											}}
										/>
									)}
								</Stack>
								{!showSessions && (
									<Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.25 }} noWrap>
										{activeSession?.title || 'New conversation'}
									</Typography>
								)}
							</Box>
						</Stack>

						<Stack direction="row" alignItems="center" spacing={0.75}>
							{!showSessions && (
								<>
									<Stack
										direction="row"
										alignItems="center"
										sx={{
											border: '1px solid',
											borderColor: 'divider',
											borderRadius: '10px',
											bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.025)',
											p: 0.25,
										}}
									>
										<Tooltip title="New chat">
											<IconButton size="small" onClick={startNewSession}>
												<AddCircleOutlineRounded fontSize="small" />
											</IconButton>
										</Tooltip>
										<Box sx={{ width: '1px', height: 16, bgcolor: 'divider' }} />
										<Tooltip title="Past conversations">
											<IconButton size="small" onClick={() => setShowSessions(true)}>
												<HistoryRounded fontSize="small" />
											</IconButton>
										</Tooltip>
									</Stack>
									<Tooltip title={expanded ? 'Narrow panel' : 'Widen panel'}>
										<IconButton size="small" onClick={() => setExpanded((v) => !v)} sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>
											{expanded ? <CloseFullscreenRounded sx={{ fontSize: 16 }} /> : <OpenInFullRounded sx={{ fontSize: 16 }} />}
										</IconButton>
									</Tooltip>
								</>
							)}
							<IconButton size="small" onClick={onClose}>
								<CloseOutlined fontSize="small" />
							</IconButton>
						</Stack>
					</Stack>
				</Box>

				{showSessions ? (
					<Box sx={{ flex: 1, overflowY: 'auto', p: 1.75 }}>
						{loadingSessions ? (
							<Stack alignItems="center" sx={{ py: 4 }}>
								<CircularProgress size={22} />
							</Stack>
						) : sessions.length === 0 ? (
							<Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
								No conversations yet -- send a message to start one.
							</Typography>
						) : (
							<Stack spacing={2}>
								{groupedSessions.map((group) => (
									<Box key={group.label}>
										<Typography
											variant="caption"
											sx={{ display: 'block', fontWeight: 700, color: 'text.disabled', textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.68rem', mb: 0.75, px: 0.5 }}
										>
											{group.label}
										</Typography>
										<Stack spacing={0.75}>
											{group.items.map((s) => (
												<Paper
													key={s.id}
													elevation={0}
													onClick={() => { forceScrollRef.current = true; openSession(s.id); setShowSessions(false); }}
													sx={{
														p: 1.5,
														borderRadius: '12px',
														border: '1px solid',
														borderColor: s.id === activeSessionId ? alpha(BRAND, 0.4) : 'divider',
														bgcolor: s.id === activeSessionId ? alpha(BRAND, 0.07) : 'transparent',
														cursor: 'pointer',
														display: 'flex',
														alignItems: 'center',
														justifyContent: 'space-between',
														gap: 1,
														transition: reducedMotion ? 'none' : 'background-color 150ms ease, border-color 150ms ease',
														'&:hover': {
															bgcolor: s.id === activeSessionId ? alpha(BRAND, 0.09) : (isDark ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.025)'),
															borderColor: alpha(BRAND, 0.3),
														},
														'&:hover .chat-session-delete': { opacity: 1 },
													}}
												>
													<Box sx={{ minWidth: 0 }}>
														<Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.86rem' }} noWrap>{s.title}</Typography>
														<Typography variant="caption" color="text.secondary">{dayjs(s.created_at).fromNow()}</Typography>
													</Box>
													<IconButton
														size="small"
														className="chat-session-delete"
														onClick={(e) => { e.stopPropagation(); removeSession(s.id); }}
														sx={{
															color: 'text.disabled',
															opacity: 0.4,
															transition: reducedMotion ? 'none' : 'opacity 150ms ease',
															'&:hover': { color: 'error.main', bgcolor: alpha(theme.palette.error.main, 0.08), opacity: 1 },
														}}
													>
														<DeleteOutlineRounded sx={{ fontSize: 16 }} />
													</IconButton>
												</Paper>
											))}
										</Stack>
									</Box>
								))}
							</Stack>
						)}
					</Box>
				) : (
					<>
						<Box sx={{ position: 'relative', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
							<Box ref={scrollRef} onScroll={handleScroll} sx={{ flex: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
								{loadingMessages ? (
									<Stack alignItems="center" sx={{ py: 4 }}>
										<CircularProgress size={22} />
									</Stack>
								) : messages.length === 0 ? (
									<Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', px: 1, py: 4, gap: 2.5 }}>
										<Box
											sx={{
												width: 56,
												height: 56,
												borderRadius: '16px',
												background: theme.gradients?.brandDiagonal,
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												boxShadow: `0 8px 24px -6px ${alpha(BRAND, 0.5)}`,
											}}
										>
											<AutoAwesome sx={{ fontSize: 26, color: '#fff' }} />
										</Box>
										<Box>
											<Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>Hi, I'm IRIS 👋</Typography>
											<Typography variant="body2" color="text.secondary" sx={{ maxWidth: 280, mx: 'auto' }}>
												Ask me to look something up or take action across your workspace — projects, CRM, timesheets, leave, meetings.
											</Typography>
										</Box>
										<Stack direction="row" flexWrap="wrap" justifyContent="center" gap={0.75} sx={{ maxWidth: 320 }}>
											{SUGGESTED_PROMPTS.map((p) => (
												<Chip
													key={p.label}
													icon={p.icon as any}
													label={p.label}
													size="small"
													onClick={() => handleSend(p.prompt)}
													sx={{
														fontSize: '0.72rem',
														fontWeight: 600,
														borderRadius: '8px',
														bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
														border: '1px solid',
														borderColor: 'divider',
														'& .MuiChip-icon': { color: BRAND, ml: 0.75 },
														'&:hover': { bgcolor: alpha(BRAND, 0.08), borderColor: alpha(BRAND, 0.3) },
													}}
												/>
											))}
										</Stack>
									</Box>
								) : (
									messages.map((m) => {
										const isUser = m.role === 'user';
										return (
											<Stack
												key={m.id}
												direction={isUser ? 'row-reverse' : 'row'}
												spacing={1}
												alignItems="flex-end"
												sx={{ alignSelf: isUser ? 'flex-end' : 'flex-start', maxWidth: '90%' }}
											>
												{isUser ? (
													<EnterpriseAvatar name={userName} size={26} sx={{ flexShrink: 0, mb: 0.25 }} />
												) : (
													<Box
														sx={{
															width: 26,
															height: 26,
															borderRadius: '8px',
															background: theme.gradients?.brandDiagonal,
															display: 'flex',
															alignItems: 'center',
															justifyContent: 'center',
															flexShrink: 0,
															mb: 0.25,
														}}
													>
														<AutoAwesome sx={{ fontSize: 14, color: '#fff' }} />
													</Box>
												)}
												<Paper
													elevation={0}
													sx={{
														p: 1.25,
														borderRadius: '14px',
														minWidth: 0,
														...(isUser
															? { background: theme.gradients?.brandDiagonal, boxShadow: `0 3px 10px -3px ${alpha(BRAND, 0.45)}` }
															: {
																bgcolor: isDark ? 'rgba(255,255,255,0.045)' : 'rgba(0,0,0,0.03)',
																border: '1px solid',
																borderColor: 'divider',
																boxShadow: isDark ? 'inset 0 1px 0 rgba(255,255,255,0.05)' : 'inset 0 1px 0 rgba(255,255,255,0.6)',
															}),
														color: isUser ? '#fff' : 'text.primary',
													}}
												>
													{isUser ? (
														<Typography variant="body2" sx={{ fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>
															{m.content}
														</Typography>
													) : m.streaming && !m.content ? (
														<TypingDots />
													) : (
														<MarkdownMessage content={m.content} />
													)}
												</Paper>
											</Stack>
										);
									})
								)}

								{statusLabel && (
									<Stack direction="row" spacing={1} alignItems="center" sx={{ alignSelf: 'flex-start', pl: 0.25 }}>
										<Box
											sx={{
												width: 26,
												height: 26,
												borderRadius: '8px',
												background: theme.gradients?.brandDiagonal,
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												flexShrink: 0,
												opacity: 0.85,
											}}
										>
											<AutoAwesome sx={{ fontSize: 14, color: '#fff' }} />
										</Box>
										<Stack
											direction="row"
											spacing={0.75}
											alignItems="center"
											sx={{ px: 1.25, py: 0.5, borderRadius: '10px', bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', border: '1px solid', borderColor: 'divider' }}
										>
											<TypingDots />
											<StatusLabel label={statusLabel} />
										</Stack>
									</Stack>
								)}

								{pendingApproval && (
									<Paper
										elevation={0}
										sx={{
											p: 2,
											borderRadius: '14px',
											border: '1px solid',
											borderColor: alpha(theme.palette.warning.main, 0.35),
											borderLeft: '4px solid',
											borderLeftColor: 'warning.main',
											background: isDark
												? `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.14)} 0%, ${alpha(theme.palette.warning.main, 0.04)} 100%)`
												: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.1)} 0%, ${alpha(theme.palette.warning.main, 0.02)} 100%)`,
											boxShadow: isDark ? '0 4px 16px -6px rgba(0,0,0,0.4)' : '0 4px 16px -6px rgba(0,0,0,0.1)',
											alignSelf: 'stretch',
										}}
									>
										<Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.75 }}>
											<Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: alpha(theme.palette.warning.main, 0.18), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
												<WarningAmberRounded sx={{ fontSize: 16, color: 'warning.main' }} />
											</Box>
											<Typography variant="caption" sx={{ fontWeight: 800, color: 'warning.main', textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.68rem' }}>
												Needs your approval
											</Typography>
										</Stack>

										{showRejectReason ? (
											<Stack spacing={1}>
												<TextField
													autoFocus
													size="small"
													placeholder="Optional reason for rejecting…"
													value={rejectReason}
													onChange={(e) => setRejectReason(e.target.value)}
													disabled={deciding}
													fullWidth
												/>
												<Stack direction="row" spacing={1}>
													<Button
														size="small"
														variant="contained"
														color="error"
														onClick={handleReject}
														disabled={deciding}
														startIcon={deciding ? <CircularProgress size={13} sx={{ color: '#fff' }} /> : undefined}
														sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px' }}
													>
														Confirm reject
													</Button>
													<Button size="small" variant="text" onClick={() => setShowRejectReason(false)} disabled={deciding} sx={{ textTransform: 'none', fontWeight: 600, color: 'text.secondary' }}>
														Back
													</Button>
												</Stack>
											</Stack>
										) : (
											<Stack direction="row" spacing={1.25}>
												<Button
													size="small"
													variant="contained"
													startIcon={deciding ? <CircularProgress size={13} sx={{ color: '#fff' }} /> : <CheckOutlined sx={{ fontSize: 15 }} />}
													onClick={() => approve()}
													disabled={deciding}
													sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px', bgcolor: BRAND, boxShadow: 'none', '&:hover': { bgcolor: '#7a6ae0', boxShadow: 'none' } }}
												>
													{deciding ? 'Working…' : 'Approve'}
												</Button>
												<Button
													size="small"
													variant="outlined"
													color="error"
													onClick={() => setShowRejectReason(true)}
													disabled={deciding}
													sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px' }}
												>
													Reject
												</Button>
											</Stack>
										)}
									</Paper>
								)}
							</Box>

							<Fade in={showScrollButton} timeout={reducedMotion ? 0 : 200}>
								<IconButton
									onClick={() => scrollToBottom(true)}
									sx={{
										position: 'absolute',
										bottom: 12,
										left: '50%',
										transform: 'translateX(-50%)',
										bgcolor: theme.palette.background.paper,
										border: '1px solid',
										borderColor: 'divider',
										boxShadow: 3,
										'&:hover': { bgcolor: 'action.hover' },
									}}
								>
									<KeyboardArrowDownRounded />
								</IconButton>
							</Fade>
						</Box>

						<Box sx={{ borderTop: '1px solid', borderColor: 'divider', p: 2 }}>
							<Paper
								elevation={0}
								sx={{
									display: 'flex',
									alignItems: 'flex-end',
									gap: 1,
									p: 0.75,
									pl: 1.75,
									borderRadius: '16px',
									border: '1px solid',
									borderColor: 'divider',
									bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
									transition: reducedMotion ? 'none' : 'border-color 150ms ease',
									'&:focus-within': { borderColor: alpha(BRAND, 0.5) },
								}}
							>
								<TextField
									fullWidth
									variant="standard"
									placeholder={pendingApproval ? 'Waiting for your decision above…' : 'Message IRIS…'}
									value={input}
									onChange={(e) => setInput(e.target.value)}
									onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
									disabled={sending || !!pendingApproval}
									multiline
									maxRows={4}
									InputProps={{ disableUnderline: true }}
									sx={{ '& .MuiInputBase-root': { fontSize: '0.875rem', py: 0.75 } }}
								/>
								<IconButton
									onClick={() => handleSend()}
									disabled={sending || !!pendingApproval || !input.trim()}
									sx={{
										bgcolor: input.trim() ? BRAND : 'action.disabledBackground',
										color: '#fff',
										mb: 0.25,
										'&:hover': { bgcolor: '#7a6ae0' },
										'&.Mui-disabled': { color: 'action.disabled' },
									}}
								>
									{sending ? <CircularProgress size={18} sx={{ color: 'inherit' }} /> : <SendRounded fontSize="small" />}
								</IconButton>
							</Paper>
						</Box>
					</>
				)}
			</Box>
		</Drawer>
	);
};

export default ChatDrawer;
