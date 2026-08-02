import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dayjs from 'dayjs';
import { useAIChat } from '../../../hooks/useAIChat';
import { useAppSelector } from '../../../store/hooks';
import { prefersReducedMotion } from './motion';

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

/** Wraps useAIChat with every piece of *UI-only* state a full IRIS chat surface needs --
 * session-list toggle, the input box, reject-reason flow, panel-width toggle, and scroll
 * tracking -- so IrisContextPanel (full Drawer) and IrisTaskPanel (embeds just the body next
 * to its own Insights/Estimate sections) share one identical state machine instead of two
 * independently drifting copies. Pass `contextModule`/`contextEntityId` to scope this panel to
 * a single per-module IRIS panel's own conversations; omit both for the global chat drawer. */
export const useIrisChatPanel = (
	open: boolean, contextModule?: string, contextEntityId?: string, onActionCompleted?: () => void,
) => {
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

	const chat = useAIChat(open, contextModule, contextEntityId);
	const {
		sessions, activeSessionId, messages, statusLabel, pendingApproval,
		openSession, startNewSession, sendMessage, approve, reject,
	} = chat;

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

	const handleScroll = useCallback(() => {
		const el = scrollRef.current;
		if (!el) return;
		const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
		const atBottom = distanceFromBottom < 64;
		nearBottomRef.current = atBottom;
		setShowScrollButton(!atBottom && messages.length > 0);
	}, [messages.length]);

	const handleSend = useCallback(async (overrideText?: string) => {
		const text = (overrideText ?? input).trim();
		if (!text) return;
		setInput('');
		setShowSessions(false);
		forceScrollRef.current = true;
		await sendMessage(text);
		onActionCompleted?.();
	}, [input, sendMessage, onActionCompleted]);

	const handleApprove = useCallback(async () => {
		await approve();
		onActionCompleted?.();
	}, [approve, onActionCompleted]);

	const handleReject = useCallback(async () => {
		await reject(rejectReason.trim() || undefined);
		setRejectReason('');
		setShowRejectReason(false);
		onActionCompleted?.();
	}, [reject, rejectReason, onActionCompleted]);

	const handleNewChat = useCallback(() => {
		startNewSession();
		setShowSessions(false);
	}, [startNewSession]);

	const handleOpenSession = useCallback((sessionId: number) => {
		forceScrollRef.current = true;
		openSession(sessionId);
		setShowSessions(false);
	}, [openSession]);

	const activeSession = sessions.find((s) => s.id === activeSessionId);
	const groupedSessions = useMemo(() => groupSessionsByRecency(sessions), [sessions]);
	const userName = currentUser?.full_name || currentUser?.email || 'You';

	return {
		...chat,
		reducedMotion,
		userName,
		activeSession,
		groupedSessions,
		input, setInput,
		showSessions, setShowSessions,
		rejectReason, setRejectReason,
		showRejectReason, setShowRejectReason,
		expanded, setExpanded,
		showScrollButton,
		scrollRef,
		scrollToBottom,
		handleScroll,
		handleSend,
		handleApprove,
		handleReject,
		handleNewChat,
		handleOpenSession,
	};
};

export type IrisChatPanel = ReturnType<typeof useIrisChatPanel>;

export default useIrisChatPanel;
