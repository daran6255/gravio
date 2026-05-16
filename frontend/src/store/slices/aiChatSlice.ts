import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';
import type { AIChatSession, AIChatMessage } from '../../models/ai';

interface AIChatState {
  sessions: AIChatSession[];
  activeSession: AIChatSession | null;
  messages: AIChatMessage[];
  loading: boolean;
  sending: boolean;
  sessionsFetched: boolean;  // Cache flag: prevents re-fetching on every widget open
  streamingStatus: 'idle' | 'planning' | 'executing' | 'typing' | 'completed';
  streamingMessage: string;
  error: string | null;
  isOpen: boolean;
}

const initialState: AIChatState = {
  sessions: [],
  activeSession: null,
  messages: [],
  loading: false,
  sending: false,
  sessionsFetched: false,
  streamingStatus: 'idle',
  streamingMessage: '',
  error: null,
  isOpen: false,
};

// ── Async Thunks ────────────────────────────────────────────────────────────

export const fetchSessions = createAsyncThunk(
  'aiChat/fetchSessions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/ai/chat/sessions');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch chat history');
    }
  }
);

export const createSession = createAsyncThunk(
  'aiChat/createSession',
  async (title: string, { rejectWithValue }) => {
    try {
      const response = await api.post('/ai/chat/sessions', { title });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to start chat');
    }
  }
);

export const fetchSessionDetails = createAsyncThunk(
  'aiChat/fetchSessionDetails',
  async (sessionId: number, { rejectWithValue }) => {
    try {
      const response = await api.get(`/ai/chat/sessions/${sessionId}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to load conversation');
    }
  }
);

export const sendMessage = createAsyncThunk(
  'aiChat/sendMessage',
  async ({ sessionId, content }: { sessionId: number; content: string }, { dispatch, rejectWithValue }) => {
    try {
      // @ts-ignore
      const token = localStorage.getItem('access_token'); 
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/ai/chat/sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content })
      });

      if (!response.ok) throw new Error('Failed to send message');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';

      if (reader) {
        // Add a placeholder assistant message
        dispatch(addLocalMessage({
          id: Date.now(),
          session_id: sessionId,
          role: 'assistant',
          content: '',
          task_log_id: null,
          created_at: new Date().toISOString()
        }));

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.status) {
                  dispatch(setStreamingStatus(data.status));
                  if (data.message) {
                    dispatch(addTokenToLastMessage(`\n*${data.message}*\n`));
                  }
                }
                if (data.token) {
                  assistantMessage += data.token;
                  dispatch(addTokenToLastMessage(data.token));
                }
                if (data.status === 'completed') {
                  dispatch(setStreamingStatus('completed'));
                }
                if (data.session_title_update && data.session_id) {
                  dispatch(updateSessionTitle({ id: data.session_id, title: data.session_title_update }));
                }
              } catch (e) {
                // Ignore parse errors for partial chunks
              }
            }
          }
        }
      }

      return { success: true };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to send message');
    }
  }
);

export const deleteSession = createAsyncThunk(
  'aiChat/deleteSession',
  async (sessionId: number, { rejectWithValue }) => {
    try {
      await api.delete(`/ai/chat/sessions/${sessionId}`);
      return sessionId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to delete conversation');
    }
  }
);

// ── Slice ───────────────────────────────────────────────────────────────────

const aiChatSlice = createSlice({
  name: 'aiChat',
  initialState,
  reducers: {
    toggleChat: (state) => {
      state.isOpen = !state.isOpen;
    },
    openChat: (state) => {
      state.isOpen = true;
    },
    closeChat: (state) => {
      state.isOpen = false;
    },
    clearError: (state) => {
      state.error = null;
    },
    setActiveSession: (state, action: PayloadAction<AIChatSession | null>) => {
      state.activeSession = action.payload;
      if (!action.payload) {
        state.messages = [];
      }
    },
    addLocalMessage: (state, action: PayloadAction<AIChatMessage>) => {
      state.messages.push(action.payload);
    },
    addTokenToLastMessage: (state, action: PayloadAction<string>) => {
      const lastMsg = state.messages[state.messages.length - 1];
      if (lastMsg && lastMsg.role === 'assistant') {
        lastMsg.content += action.payload;
      }
    },
    setStreamingStatus: (state, action: PayloadAction<AIChatState['streamingStatus']>) => {
      state.streamingStatus = action.payload;
    },
    updateSessionTitle: (state, action: PayloadAction<{ id: number; title: string }>) => {
      const session = state.sessions.find(s => s.id === action.payload.id);
      if (session) session.title = action.payload.title;
      if (state.activeSession?.id === action.payload.id) {
        state.activeSession.title = action.payload.title;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Sessions
      .addCase(fetchSessions.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchSessions.fulfilled, (state, action) => {
        state.loading = false;
        state.sessions = action.payload;
        state.sessionsFetched = true;
      })
      .addCase(fetchSessions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create Session
      .addCase(createSession.fulfilled, (state, action) => {
        state.sessions.unshift(action.payload);
        state.activeSession = action.payload;
        state.messages = action.payload.messages || []; // Load the initial greeting
      })
      // Fetch Details
      .addCase(fetchSessionDetails.fulfilled, (state, action) => {
        state.activeSession = action.payload;
        state.messages = action.payload.messages || [];
      })
      // Send Message
      .addCase(sendMessage.pending, (state) => {
        state.sending = true;
      })
      .addCase(sendMessage.fulfilled, (state) => {
        state.sending = false;
        state.streamingStatus = 'completed';
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.sending = false;
        state.error = action.payload as string;
      })
      // Delete Session
      .addCase(deleteSession.fulfilled, (state, action) => {
        const deletedId = action.payload;
        state.sessions = state.sessions.filter(s => s.id !== deletedId);
        if (state.activeSession?.id === deletedId) {
          state.activeSession = null;
          state.messages = [];
        }
      });
  },
});

export const { 
  toggleChat, openChat, closeChat, clearError, setActiveSession, 
  addLocalMessage, addTokenToLastMessage, setStreamingStatus, updateSessionTitle
} = aiChatSlice.actions;
export default aiChatSlice.reducer;
