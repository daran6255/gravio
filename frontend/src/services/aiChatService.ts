import api from './api';
import authService from './authService';

/** Matches backend's AIChatMessageRead. */
export interface AIChatMessage {
	id: number;
	session_id: number;
	role: 'user' | 'assistant' | 'system';
	content: string;
	task_log_id?: number | null;
	created_at: string;
}

/** Matches backend's AIChatSessionRead. */
export interface AIChatSession {
	id: number;
	public_id: string;
	title: string;
	user_id: number;
	is_active: boolean;
	created_at: string;
}

/** Matches backend's AIChatSessionDetail. */
export interface AIChatSessionDetail extends AIChatSession {
	messages: AIChatMessage[];
}

/** Matches backend's AITaskRunResponse -- returned by the approve/reject endpoints. */
export interface AITaskRunResponse {
	task_id: string;
	task_db_id: number | null;
	status: string;
	task_name: string;
	steps_planned: number;
	steps_completed: number;
	steps_failed: number;
	records_affected: number;
	requires_approval: boolean;
	summary?: string | null;
	duration_ms?: number | null;
	error?: string | null;
}

/** One parsed `data: {...}` line from `stream_message`'s SSE body (chat_service.py). The
 * shape is ad-hoc per event rather than a single discriminated `type` field -- narrow on
 * `token` vs `session_title_update` vs `status` when consuming it. */
export type AIChatStreamEvent =
	| { status: 'planning' | 'executing'; message: string }
	| { status: 'typing' }
	| { status: 'awaiting_approval'; task_id: string; pending_tool: string; message: string }
	| { status: 'completed'; summary: string; task_db_id: number }
	| { status: 'failed'; error: string }
	| { token: string }
	| { session_title_update: string; session_id: number };

const aiChatService = {
	createSession: async (title?: string): Promise<AIChatSessionDetail> => {
		const response = await api.post<AIChatSessionDetail>('/ai/chat/sessions', title ? { title } : {});
		return response.data;
	},

	listSessions: async (): Promise<AIChatSession[]> => {
		const response = await api.get<AIChatSession[]>('/ai/chat/sessions');
		return response.data;
	},

	getSession: async (sessionId: number): Promise<AIChatSessionDetail> => {
		const response = await api.get<AIChatSessionDetail>(`/ai/chat/sessions/${sessionId}`);
		return response.data;
	},

	deleteSession: async (sessionId: number): Promise<void> => {
		await api.delete(`/ai/chat/sessions/${sessionId}`);
	},

	/** Sends a message and streams IRIS's response via SSE. This can't go through the shared
	 * `api` axios instance -- the endpoint is a POST returning `text/event-stream`, which
	 * `EventSource` (GET-only, no custom headers) can't open and axios can't incrementally
	 * read in the browser -- so this reads the fetch response body directly instead.
	 * `onEvent` fires once per parsed SSE line; the returned promise resolves once the
	 * stream ends. */
	streamMessage: async (
		sessionId: number,
		content: string,
		onEvent: (event: AIChatStreamEvent) => void,
		signal?: AbortSignal,
	): Promise<void> => {
		const token = authService.getAccessToken();
		const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/ai/chat/sessions/${sessionId}/messages`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				...(token ? { Authorization: `Bearer ${token}` } : {}),
			},
			body: JSON.stringify({ role: 'user', content }),
			signal,
		});

		if (!response.body) {
			throw new Error('This browser does not support streaming responses.');
		}
		if (!response.ok) {
			throw new Error(`IRIS chat request failed (${response.status}).`);
		}

		const reader = response.body.getReader();
		const decoder = new TextDecoder();
		let buffer = '';

		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			buffer += decoder.decode(value, { stream: true });

			const lines = buffer.split('\n\n');
			buffer = lines.pop() ?? '';
			for (const line of lines) {
				const trimmed = line.trim();
				if (!trimmed.startsWith('data:')) continue;
				const raw = trimmed.slice(5).trim();
				if (!raw) continue;
				try {
					onEvent(JSON.parse(raw) as AIChatStreamEvent);
				} catch {
					// Malformed line -- skip rather than aborting the whole stream over it.
				}
			}
		}
	},

	approveTask: async (taskPublicId: string, reason?: string): Promise<AITaskRunResponse> => {
		const response = await api.post<AITaskRunResponse>(`/ai/tasks/${taskPublicId}/approve`, { reason });
		return response.data;
	},

	rejectTask: async (taskPublicId: string, reason?: string): Promise<AITaskRunResponse> => {
		const response = await api.post<AITaskRunResponse>(`/ai/tasks/${taskPublicId}/reject`, { reason });
		return response.data;
	},
};

export default aiChatService;
