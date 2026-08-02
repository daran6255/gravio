import { useCallback, useEffect, useRef, useState } from 'react';
import aiChatService, {
	type AIChatMessage,
	type AIChatSession,
} from '../services/aiChatService';
import useToast from './useToast';

/** A message the whole panel worked from and pending approval info attached to it, once
 * present (an assistant message paused mid-task -- see `pendingApproval` below). */
export interface ChatDisplayMessage extends AIChatMessage {
	/** True only for the one assistant message currently in flight while streaming. */
	streaming?: boolean;
}

export interface PendingApproval {
	taskId: string;
	message: string;
}

let localMessageSeq = -1;
const nextLocalId = () => localMessageSeq--;

/** Drives the IRIS chat drawer: session list/switching, sending a message and consuming its
 * SSE reply, and the awaiting_approval pause/decide loop. Kept as a single hook (rather than
 * a redux slice) because none of this needs to survive a drawer close/reopen or be read from
 * outside the drawer -- same reasoning IrisTaskPanel uses for its own local state. */
/** `contextModule`/`contextEntityId` scope this hook's session list and newly-created sessions
 * to a single per-module "Ask IRIS" panel (e.g. "leave") instead of the global chat drawer's
 * unfiltered history -- pass neither for the global drawer. Pass plain string constants (not a
 * freshly-built object each render) since they're primitives in this hook's own dependency
 * arrays. */
export const useAIChat = (enabled: boolean, contextModule?: string, contextEntityId?: string) => {
	const toast = useToast();

	const [sessions, setSessions] = useState<AIChatSession[]>([]);
	const [loadingSessions, setLoadingSessions] = useState(false);
	const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
	const [messages, setMessages] = useState<ChatDisplayMessage[]>([]);
	const [loadingMessages, setLoadingMessages] = useState(false);

	const [sending, setSending] = useState(false);
	const [statusLabel, setStatusLabel] = useState<string | null>(null);
	const [pendingApproval, setPendingApproval] = useState<PendingApproval | null>(null);
	const [deciding, setDeciding] = useState(false);

	const streamAbortRef = useRef<AbortController | null>(null);
	const streamingMessageIdRef = useRef<number | null>(null);

	const loadSessions = useCallback(async () => {
		setLoadingSessions(true);
		try {
			const result = await aiChatService.listSessions(contextModule);
			setSessions(result);
			return result;
		} catch {
			toast.error('Could not load your IRIS conversations.');
			return [];
		} finally {
			setLoadingSessions(false);
		}
	}, [toast, contextModule]);

	useEffect(() => {
		if (!enabled) return;
		loadSessions();
		// Only (re)load the session list the moment the drawer becomes enabled, not on
		// every render while it stays open.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [enabled, contextModule]);

	const openSession = useCallback(async (sessionId: number) => {
		setPendingApproval(null);
		setStatusLabel(null);
		setLoadingMessages(true);
		try {
			const detail = await aiChatService.getSession(sessionId);
			setActiveSessionId(detail.id);
			setMessages(detail.messages);
		} catch {
			toast.error('Could not open that conversation.');
		} finally {
			setLoadingMessages(false);
		}
	}, [toast]);

	const startNewSession = useCallback(() => {
		setActiveSessionId(null);
		setMessages([]);
		setPendingApproval(null);
		setStatusLabel(null);
	}, []);

	const removeSession = useCallback(async (sessionId: number) => {
		try {
			await aiChatService.deleteSession(sessionId);
			setSessions((prev) => prev.filter((s) => s.id !== sessionId));
			if (activeSessionId === sessionId) {
				startNewSession();
			}
		} catch {
			toast.error('Could not delete that conversation.');
		}
	}, [activeSessionId, startNewSession, toast]);

	/** Ensures there's a session to send into, creating one lazily on first message so the
	 * user can start typing immediately without an explicit "New chat" step. */
	const ensureSession = useCallback(async (): Promise<number> => {
		if (activeSessionId != null) return activeSessionId;
		const created = await aiChatService.createSession(undefined, contextModule, contextEntityId);
		setSessions((prev) => [created, ...prev]);
		setActiveSessionId(created.id);
		// Skip the greeting-only history the panel doesn't need to show twice -- the user's
		// message about to be appended is the first real turn.
		setMessages([]);
		return created.id;
	}, [activeSessionId, contextModule, contextEntityId]);

	const sendMessage = useCallback(async (content: string) => {
		const text = content.trim();
		if (!text || sending) return;

		setSending(true);
		setPendingApproval(null);
		setStatusLabel('Thinking…');

		let sessionId: number;
		try {
			sessionId = await ensureSession();
		} catch {
			toast.error('Could not start a new IRIS conversation.');
			setSending(false);
			setStatusLabel(null);
			return;
		}

		const userMessage: ChatDisplayMessage = {
			id: nextLocalId(),
			session_id: sessionId,
			role: 'user',
			content: text,
			created_at: new Date().toISOString(),
		};
		const assistantMessageId = nextLocalId();
		streamingMessageIdRef.current = assistantMessageId;
		setMessages((prev) => [
			...prev,
			userMessage,
			{ id: assistantMessageId, session_id: sessionId, role: 'assistant', content: '', created_at: new Date().toISOString(), streaming: true },
		]);

		const controller = new AbortController();
		streamAbortRef.current = controller;

		const appendToStreaming = (chunk: string) => {
			setMessages((prev) => prev.map((m) => (
				m.id === assistantMessageId ? { ...m, content: m.content + chunk } : m
			)));
		};
		const finalizeStreaming = (content: string, extra?: Partial<ChatDisplayMessage>) => {
			setMessages((prev) => prev.map((m) => (
				m.id === assistantMessageId ? { ...m, content, streaming: false, ...extra } : m
			)));
		};

		try {
			await aiChatService.streamMessage(sessionId, text, (event) => {
				if ('token' in event) {
					setStatusLabel(null);
					appendToStreaming(event.token);
					return;
				}
				if ('session_title_update' in event) {
					setSessions((prev) => prev.map((s) => (s.id === event.session_id ? { ...s, title: event.session_title_update } : s)));
					return;
				}
				switch (event.status) {
					case 'planning':
					case 'executing':
						setStatusLabel(event.message);
						break;
					case 'typing':
						setStatusLabel(null);
						break;
					case 'awaiting_approval':
						finalizeStreaming(event.message, { task_log_id: null });
						setPendingApproval({ taskId: event.task_id, message: event.message });
						setStatusLabel(null);
						break;
					case 'completed':
						finalizeStreaming(event.summary);
						break;
					case 'failed':
						finalizeStreaming(event.error);
						break;
				}
			}, controller.signal);
		} catch (error: any) {
			if (error?.name !== 'AbortError') {
				finalizeStreaming('IRIS lost its train of thought — please try sending that again.');
				toast.error('Please try sending that again.');
			}
		} finally {
			setSending(false);
			streamAbortRef.current = null;
			streamingMessageIdRef.current = null;
		}
	}, [ensureSession, sending, toast]);

	const decideApproval = useCallback(async (approved: boolean, reason?: string) => {
		if (!pendingApproval) return;
		setDeciding(true);
		try {
			const result = approved
				? await aiChatService.approveTask(pendingApproval.taskId, reason)
				: await aiChatService.rejectTask(pendingApproval.taskId, reason);

			const replyText = result.summary || (approved ? 'Done.' : 'Cancelled.');
			setMessages((prev) => [...prev, {
				id: nextLocalId(),
				session_id: activeSessionId ?? 0,
				role: 'assistant',
				content: replyText,
				task_log_id: result.task_db_id,
				created_at: new Date().toISOString(),
			}]);

			if (approved && result.status === 'awaiting_approval') {
				// A later step in the resumed run hit its own approval gate -- stay in the
				// same paused state so the card re-renders for the next decision.
				setPendingApproval({ taskId: result.task_id, message: replyText });
			} else {
				setPendingApproval(null);
			}
		} catch (error: any) {
			toast.error(error?.response?.data?.error?.message || `Could not ${approved ? 'approve' : 'reject'} that action.`);
		} finally {
			setDeciding(false);
		}
	}, [activeSessionId, pendingApproval, toast]);

	return {
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
		approve: (reason?: string) => decideApproval(true, reason),
		reject: (reason?: string) => decideApproval(false, reason),
	};
};

export default useAIChat;
