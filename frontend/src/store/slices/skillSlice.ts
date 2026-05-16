import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { skillService } from '../../services/skillService';

interface SkillState {
    aggregatedSkills: string[];
    loading: boolean;
    error: string | null;
}

const initialState: SkillState = {
    aggregatedSkills: [],
    loading: false,
    error: null,
};

export const fetchAggregatedSkills = createAsyncThunk(
    'skills/fetchAggregated',
    async (_, { rejectWithValue }) => {
        try {
            return await skillService.getAggregatedSkills();
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.detail || 'Failed to fetch aggregated skills');
        }
    }
);

export const createSkill = createAsyncThunk(
    'skills/create',
    async (skillData: { name: string; is_verified?: boolean }, { rejectWithValue }) => {
        try {
            return await skillService.createSkill(skillData);
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.detail || 'Failed to create skill');
        }
    }
);

const skillSlice = createSlice({
    name: 'skills',
    initialState,
    reducers: {
        clearSkillError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch Aggregated Skills
            .addCase(fetchAggregatedSkills.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAggregatedSkills.fulfilled, (state, action: PayloadAction<string[]>) => {
                state.loading = false;
                state.aggregatedSkills = action.payload;
            })
            .addCase(fetchAggregatedSkills.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // Create Skill
            .addCase(createSkill.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createSkill.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                if (!state.aggregatedSkills.includes(action.payload.name)) {
                    state.aggregatedSkills.push(action.payload.name);
                    state.aggregatedSkills.sort();
                }
            })
            .addCase(createSkill.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const { clearSkillError } = skillSlice.actions;
export default skillSlice.reducer;
