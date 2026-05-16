import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import aiService from '../../services/aiService';
import type {
  AISettingsData,
  AIConnectionTestResult,
  AITasksResponse,
} from '../../models/ai';

interface AIState {
  settings: AISettingsData | null;
  tasks: AITasksResponse | null;
  loading: boolean;
  saving: boolean;
  testing: boolean;
  error: string | null;
  testResult: AIConnectionTestResult | null;
}

const initialState: AIState = {
  settings: null,
  tasks: null,
  loading: false,
  saving: false,
  testing: false,
  error: null,
  testResult: null,
};

// ── Async Thunks ─────────────────────────────────────────────────────────────

export const fetchAISettings = createAsyncThunk(
  'ai/fetchSettings',
  async (_, { rejectWithValue }) => {
    try {
      return await aiService.getSettings();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch AI settings');
    }
  }
);

export const updateAISettings = createAsyncThunk(
  'ai/updateSettings',
  async (data: Record<string, string>, { rejectWithValue }) => {
    try {
      return await aiService.saveSettings(data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to save AI settings');
    }
  }
);

export const testAIConnection = createAsyncThunk(
  'ai/testConnection',
  async ({ provider, apiKey }: { provider: string; apiKey?: string }, { rejectWithValue }) => {
    try {
      return await aiService.testConnection(provider, apiKey);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Connection test failed');
    }
  }
);

export const fetchAITasks = createAsyncThunk(
  'ai/fetchTasks',
  async ({ page, pageSize, status }: { page?: number; pageSize?: number; status?: string }, { rejectWithValue }) => {
    try {
      return await aiService.getTasks(page, pageSize, status);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch AI tasks');
    }
  }
);

export const extractCandidateData = createAsyncThunk(
  'ai/extractCandidate',
  async ({ resumeText, file, documentId }: { resumeText?: string; file?: File; documentId?: number }, { rejectWithValue }) => {
    try {
      return await aiService.extractCandidate(resumeText, file, documentId);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'AI Extraction failed');
    }
  }
);

export const getSkillRecommendations = createAsyncThunk(
  'ai/getSkillRecommendations',
  async (skills: string[], { rejectWithValue }) => {
    try {
      return await aiService.getSkillRecommendations(skills);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch recommendations');
    }
  }
);

// ── Slice ────────────────────────────────────────────────────────────────────

const aiSlice = createSlice({
  name: 'ai',
  initialState,
  reducers: {
    clearAIError: (state) => {
      state.error = null;
    },
    clearTestResult: (state) => {
      state.testResult = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Settings
      .addCase(fetchAISettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAISettings.fulfilled, (state, action: PayloadAction<AISettingsData>) => {
        state.loading = false;
        state.settings = action.payload;
      })
      .addCase(fetchAISettings.rejected, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update Settings
      .addCase(updateAISettings.pending, (state) => {
        state.saving = true;
      })
      .addCase(updateAISettings.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(updateAISettings.rejected, (state, action: PayloadAction<any>) => {
        state.saving = false;
        state.error = action.payload;
      })

      // Test Connection
      .addCase(testAIConnection.pending, (state) => {
        state.testing = true;
        state.testResult = null;
      })
      .addCase(testAIConnection.fulfilled, (state, action: PayloadAction<AIConnectionTestResult>) => {
        state.testing = false;
        state.testResult = action.payload;
      })
      .addCase(testAIConnection.rejected, (state, action: PayloadAction<any>) => {
        state.testing = false;
        state.error = action.payload;
      })

      // Fetch Tasks
      .addCase(fetchAITasks.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAITasks.fulfilled, (state, action: PayloadAction<AITasksResponse>) => {
        state.loading = false;
        state.tasks = action.payload;
      })
      .addCase(fetchAITasks.rejected, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearAIError, clearTestResult } = aiSlice.actions;
export default aiSlice.reducer;
