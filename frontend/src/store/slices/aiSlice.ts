import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import aiService from '../../services/aiService';
import type { AIChatMessage, AIChatSession, AIStreamEvent } from '../../models/aiChat';
import type { AppDispatch } from '../store';

function extractErrorMessage(error: any, fallback: string): string {
	const data = error?.response?.data;

	if (typeof data?.error?.message === 'string' && data.error.message) {
		return data.error.message;
	}

	if (Array.isArray(data?.detail)) {
		const messages = data.detail
			.map((item: any) => {
				if (typeof item === 'string') return item;
				const field = Array.isArray(item?.loc) ? item.loc[item.loc.length - 1] : undefined;
				if (!item?.msg) return null;
				return typeof field === 'string' ? `${field}: ${item.msg}` : item.msg;
			})
			.filter(Boolean);
		if (messages.length) return messages.join('; ');
	}

	if (typeof data?.detail === 'string' && data.detail) {
		return data.detail;
	}

	if (!error?.response && typeof error?.message === 'string' && error.message) {
		return error.message;
	}

	return fallback;
}

interface AiChatState {
	sessions: AIChatSession[];
	sessionsLoading: boolean;
	sessionsError: string | null;

	currentSessionId: number | null;
	messages: AIChatMessage[];
	messagesLoading: boolean;
	messagesError: string | null;

	streaming: boolean;
	streamingStatus: 'planning' | 'executing' | 'typing' | null;
	streamingStatusMessage: string | null;
	streamingText: string;
	sendError: string | null;
}

const initialState: AiChatState = {
	sessions: [],
	sessionsLoading: false,
	sessionsError: null,

	currentSessionId: null,
	messages: [],
	messagesLoading: false,
	messagesError: null,

	streaming: false,
	streamingStatus: null,
	streamingStatusMessage: null,
	streamingText: '',
	sendError: null,
};

// ==========================================
// ASYNC THUNKS
// ==========================================

export const fetchAriaSessions = createAsyncThunk(
	'ai/fetchSessions',
	async (_: void, { rejectWithValue }) => {
		try {
			return await aiService.listSessions();
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to load your ARIA conversations'));
		}
	}
);

export const startAriaSession = createAsyncThunk(
	'ai/startSession',
	async (title: string | undefined, { rejectWithValue }) => {
		try {
			return await aiService.createSession(title);
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to start a new ARIA conversation'));
		}
	}
);

export const loadAriaSession = createAsyncThunk(
	'ai/loadSession',
	async (sessionId: number, { rejectWithValue }) => {
		try {
			return await aiService.getSession(sessionId);
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to load that conversation'));
		}
	}
);

export const deleteAriaSession = createAsyncThunk(
	'ai/deleteSession',
	async (sessionId: number, { rejectWithValue }) => {
		try {
			await aiService.deleteSession(sessionId);
			return sessionId;
		} catch (error: any) {
			return rejectWithValue(extractErrorMessage(error, 'Failed to delete that conversation'));
		}
	}
);

export const sendAriaMessage = createAsyncThunk<
	void,
	{ sessionId: number; content: string },
	{ dispatch: AppDispatch }
>('ai/sendMessage', async ({ sessionId, content }, { dispatch, rejectWithValue }) => {
	dispatch(
		aiSlice.actions.userMessageSent({
			id: Date.now(),
			session_id: sessionId,
			role: 'user',
			content,
			task_log_id: null,
			created_at: new Date().toISOString(),
		})
	);
	dispatch(aiSlice.actions.streamStarted());

	try {
		await aiService.streamMessage(sessionId, content, (event: AIStreamEvent) => {
			if ('token' in event) {
				dispatch(aiSlice.actions.streamToken(event.token));
			} else if ('error' in event) {
				dispatch(aiSlice.actions.streamFailed(event.error));
			} else if ('summary' in event) {
				dispatch(aiSlice.actions.streamCompleted({ summary: event.summary, task_db_id: event.task_db_id }));
			} else if ('session_title_update' in event) {
				dispatch(
					aiSlice.actions.sessionTitleUpdated({
						sessionId: event.session_id,
						title: event.session_title_update,
					})
				);
			} else if ('status' in event) {
				dispatch(aiSlice.actions.streamStatusChanged({ status: event.status, message: (event as any).message }));
			}
		});
	} catch (error: any) {
		const message = extractErrorMessage(error, 'ARIA is temporarily unavailable. Please try again.');
		dispatch(aiSlice.actions.streamFailed(message));
		return rejectWithValue(message);
	}
});

// ==========================================
// SLICE
// ==========================================

const aiSlice = createSlice({
	name: 'ai',
	initialState,
	reducers: {
		userMessageSent: (state, action: PayloadAction<AIChatMessage>) => {
			state.messages.push(action.payload);
			state.sendError = null;
		},
		streamStarted: (state) => {
			state.streaming = true;
			state.streamingStatus = 'planning';
			state.streamingStatusMessage = null;
			state.streamingText = '';
		},
		streamStatusChanged: (state, action: PayloadAction<{ status: 'planning' | 'executing' | 'typing'; message?: string }>) => {
			state.streamingStatus = action.payload.status;
			state.streamingStatusMessage = action.payload.message ?? null;
		},
		streamToken: (state, action: PayloadAction<string>) => {
			state.streamingText += action.payload;
		},
		streamCompleted: (state, action: PayloadAction<{ summary: string; task_db_id: number | null }>) => {
			state.messages.push({
				id: Date.now(),
				session_id: state.currentSessionId ?? 0,
				role: 'assistant',
				content: action.payload.summary,
				task_log_id: action.payload.task_db_id,
				created_at: new Date().toISOString(),
			});
			state.streaming = false;
			state.streamingStatus = null;
			state.streamingStatusMessage = null;
			state.streamingText = '';
		},
		streamFailed: (state, action: PayloadAction<string>) => {
			state.streaming = false;
			state.streamingStatus = null;
			state.streamingStatusMessage = null;
			state.streamingText = '';
			state.sendError = action.payload;
		},
		sessionTitleUpdated: (state, action: PayloadAction<{ sessionId: number; title: string }>) => {
			const session = state.sessions.find((s) => s.id === action.payload.sessionId);
			if (session) session.title = action.payload.title;
		},
		ariaChatReset: () => initialState,
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchAriaSessions.pending, (state) => {
				state.sessionsLoading = true;
				state.sessionsError = null;
			})
			.addCase(fetchAriaSessions.fulfilled, (state, action) => {
				state.sessionsLoading = false;
				state.sessions = action.payload;
			})
			.addCase(fetchAriaSessions.rejected, (state, action) => {
				state.sessionsLoading = false;
				state.sessionsError = action.payload as string;
			})

			.addCase(startAriaSession.pending, (state) => {
				state.messagesLoading = true;
				state.messagesError = null;
			})
			.addCase(startAriaSession.fulfilled, (state, action) => {
				state.messagesLoading = false;
				state.currentSessionId = action.payload.id;
				state.messages = action.payload.messages;
				state.sessions.unshift(action.payload);
			})
			.addCase(startAriaSession.rejected, (state, action) => {
				state.messagesLoading = false;
				state.messagesError = action.payload as string;
			})

			.addCase(loadAriaSession.pending, (state) => {
				state.messagesLoading = true;
				state.messagesError = null;
			})
			.addCase(loadAriaSession.fulfilled, (state, action) => {
				state.messagesLoading = false;
				state.currentSessionId = action.payload.id;
				state.messages = action.payload.messages;
			})
			.addCase(loadAriaSession.rejected, (state, action) => {
				state.messagesLoading = false;
				state.messagesError = action.payload as string;
			})

			.addCase(deleteAriaSession.fulfilled, (state, action) => {
				state.sessions = state.sessions.filter((s) => s.id !== action.payload);
				if (state.currentSessionId === action.payload) {
					state.currentSessionId = null;
					state.messages = [];
				}
			});
	},
});

export const { ariaChatReset } = aiSlice.actions;
export default aiSlice.reducer;
