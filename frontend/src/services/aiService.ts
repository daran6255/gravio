import api from './api';
import authService from './authService';
import type { AIChatSession, AIChatSessionDetail, AIStreamEvent } from '../models/aiChat';

const API_BASE = `${import.meta.env.VITE_API_URL}/api/v1`;

const aiService = {
	listSessions: async (): Promise<AIChatSession[]> => {
		const response = await api.get<AIChatSession[]>('/ai/chat/sessions');
		return response.data;
	},

	createSession: async (title?: string): Promise<AIChatSessionDetail> => {
		const response = await api.post<AIChatSessionDetail>('/ai/chat/sessions', {
			title: title || 'New AI Co-worker Chat',
		});
		return response.data;
	},

	getSession: async (sessionId: number): Promise<AIChatSessionDetail> => {
		const response = await api.get<AIChatSessionDetail>(`/ai/chat/sessions/${sessionId}`);
		return response.data;
	},

	deleteSession: async (sessionId: number): Promise<void> => {
		await api.delete(`/ai/chat/sessions/${sessionId}`);
	},

	/**
	 * Streams an assistant reply via SSE. Uses raw fetch (not the shared `api` axios instance)
	 * because this needs a POST body AND a bearer header on a streamed response — EventSource
	 * supports neither. Not routed through the axios interceptor's 401-refresh flow; a stream
	 * started with a token that expires mid-response will simply fail (rare, given how short a
	 * single chat turn is) rather than silently retry, which is an acceptable tradeoff here.
	 */
	streamMessage: async (
		sessionId: number,
		content: string,
		onEvent: (event: AIStreamEvent) => void,
		signal?: AbortSignal
	): Promise<void> => {
		const token = authService.getAccessToken();
		const response = await fetch(`${API_BASE}/ai/chat/sessions/${sessionId}/messages`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				...(token ? { Authorization: `Bearer ${token}` } : {}),
			},
			body: JSON.stringify({ role: 'user', content }),
			signal,
		});

		if (!response.ok || !response.body) {
			throw new Error(`ARIA request failed (${response.status})`);
		}

		const reader = response.body.getReader();
		const decoder = new TextDecoder();
		let buffer = '';

		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			buffer += decoder.decode(value, { stream: true });
			const events = buffer.split('\n\n');
			buffer = events.pop() ?? '';

			for (const rawEvent of events) {
				const dataLine = rawEvent.split('\n').find((line) => line.startsWith('data: '));
				if (!dataLine) continue;
				try {
					onEvent(JSON.parse(dataLine.slice(6)));
				} catch {
					// A malformed chunk shouldn't kill the rest of the stream.
				}
			}
		}
	},
};

export default aiService;
