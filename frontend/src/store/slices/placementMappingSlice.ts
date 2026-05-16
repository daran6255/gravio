import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import placementMappingService from '../../services/placementMappingService';
import type { CandidateMatchResult, PlacementMapping, PlacementMappingCreate } from '../../services/placementMappingService';

export type { CandidateMatchResult, PlacementMapping, PlacementMappingCreate };

interface PlacementMappingState {
    matches: CandidateMatchResult[];
    mappings: PlacementMapping[];
    loading: boolean;
    error: string | null;
}

const initialState: PlacementMappingState = {
    matches: [],
    mappings: [],
    loading: false,
    error: null,
};

export const fetchMatchesForJobRole = createAsyncThunk(
    'placementMapping/fetchMatches',
    async (jobRolePublicId: string, { rejectWithValue }) => {
        try {
            return await placementMappingService.getMatchesForJobRole(jobRolePublicId);
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.detail || 'Failed to fetch candidate matches');
        }
    }
);

export const mapCandidate = createAsyncThunk(
    'placementMapping/map',
    async (mapping: PlacementMappingCreate, { rejectWithValue }) => {
        try {
            return await placementMappingService.mapCandidate(mapping);
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.detail || 'Failed to map candidate to job role');
        }
    }
);

export const bulkMapCandidates = createAsyncThunk(
    'placementMapping/bulkMap',
    async (bulkData: { job_role_id: number; mappings: { candidate_id: number; match_score: number }[]; notes?: string }, { rejectWithValue }) => {
        try {
            return await placementMappingService.bulkMapCandidates(bulkData);
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.detail || 'Failed to bulk map candidates');
        }
    }
);

export const unmapCandidate = createAsyncThunk(
    'placementMapping/unmap',
    async ({ candidateId, jobRoleId }: { candidateId: number; jobRoleId: number }, { rejectWithValue }) => {
        try {
            await placementMappingService.unmapCandidate(candidateId, jobRoleId);
            return { candidateId, jobRoleId };
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.detail || 'Failed to unmap candidate');
        }
    }
);

export const fetchJobRoleMappings = createAsyncThunk(
    'placementMapping/fetchJobRoleMappings',
    async (jobRolePublicId: string, { rejectWithValue }) => {
        try {
            return await placementMappingService.getJobRoleMappings(jobRolePublicId);
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.detail || 'Failed to fetch mappings for job role');
        }
    }
);

export const updatePlacementStatus = createAsyncThunk(
    'placementMapping/updateStatus',
    async ({ mappingId, status, remarks }: { mappingId: number; status: string; remarks?: string }, { rejectWithValue }) => {
        try {
            return await placementMappingService.updateStatus(mappingId, status, remarks);
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.detail || 'Failed to update placement status');
        }
    }
);

export const uploadOfferLetter = createAsyncThunk(
    'placementMapping/uploadOfferLetter',
    async ({ mappingId, file, metadata }: { mappingId: number; file: File; metadata?: { offered_ctc?: number; joining_date?: string; offered_designation?: string; remarks?: string } }, { rejectWithValue }) => {
        try {
            return await placementMappingService.uploadOfferLetter(mappingId, file, metadata);
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.detail || 'Failed to upload offer letter');
        }
    }
);

const placementMappingSlice = createSlice({
    name: 'placementMapping',
    initialState,
    reducers: {
        clearPlacementError: (state) => {
            state.error = null;
        },
        clearMatches: (state) => {
            state.matches = [];
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch Matches
            .addCase(fetchMatchesForJobRole.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchMatchesForJobRole.fulfilled, (state, action: PayloadAction<CandidateMatchResult[]>) => {
                state.loading = false;
                state.matches = action.payload;
            })
            .addCase(fetchMatchesForJobRole.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // Map Candidate
            .addCase(mapCandidate.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(mapCandidate.fulfilled, (state, action: PayloadAction<PlacementMapping>) => {
                state.loading = false;
                state.mappings.unshift(action.payload);
                // Update match status in the matches list if present
                const matchIndex = state.matches.findIndex(m => m.candidate_id === action.payload.candidate_id);
                if (matchIndex !== -1) {
                    state.matches[matchIndex].is_already_mapped = true;
                    state.matches[matchIndex].status = action.payload.status || 'mapped';
                    state.matches[matchIndex].mapping_id = action.payload.id;
                }
            })
            .addCase(mapCandidate.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // Bulk Map Candidates
            .addCase(bulkMapCandidates.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(bulkMapCandidates.fulfilled, (state, action: PayloadAction<PlacementMapping[]>) => {
                state.loading = false;
                // Add all new mappings to the start of the list
                state.mappings = [...action.payload, ...state.mappings];
                
                // Update each match in the matches list
                action.payload.forEach(mapping => {
                    const matchIndex = state.matches.findIndex(m => m.candidate_id === mapping.candidate_id);
                    if (matchIndex !== -1) {
                        state.matches[matchIndex].is_already_mapped = true;
                        state.matches[matchIndex].status = mapping.status || 'mapped';
                        state.matches[matchIndex].mapping_id = mapping.id;
                    }
                });
            })
            .addCase(bulkMapCandidates.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // Unmap Candidate
            .addCase(unmapCandidate.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(unmapCandidate.fulfilled, (state, action) => {
                state.loading = false;
                state.mappings = state.mappings.filter(m => 
                    !(m.candidate_id === action.payload.candidateId && m.job_role_id === action.payload.jobRoleId)
                );
                // Update match status back to unmapped
                const matchIndex = state.matches.findIndex(m => m.candidate_id === action.payload.candidateId);
                if (matchIndex !== -1) {
                    state.matches[matchIndex].is_already_mapped = false;
                }
            })
            .addCase(unmapCandidate.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // Fetch Job Role Mappings
            .addCase(fetchJobRoleMappings.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchJobRoleMappings.fulfilled, (state, action: PayloadAction<PlacementMapping[]>) => {
                state.loading = false;
                state.mappings = action.payload;
            })
            .addCase(fetchJobRoleMappings.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // Update Placement Status
            .addCase(updatePlacementStatus.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updatePlacementStatus.fulfilled, (state, action: PayloadAction<PlacementMapping>) => {
                state.loading = false;
                // Update the mapping in the list
                const mappingIndex = state.mappings.findIndex(m => m.id === action.payload.id);
                if (mappingIndex !== -1) {
                    state.mappings[mappingIndex] = action.payload;
                }
                // Also update the match status in the matches list
                const matchIndex = state.matches.findIndex(m => m.candidate_id === action.payload.candidate_id);
                if (matchIndex !== -1) {
                    state.matches[matchIndex].status = action.payload.status;
                }
            })
            .addCase(updatePlacementStatus.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // Upload Offer Letter
            .addCase(uploadOfferLetter.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(uploadOfferLetter.fulfilled, (state, action) => {
                state.loading = false;
                // Since upload also moves status to offer_made, find and update match
                const matchIndex = state.matches.findIndex(m => m.mapping_id === action.payload.mapping_id);
                if (matchIndex !== -1) {
                    state.matches[matchIndex].status = 'offer_made';
                }
            })
            .addCase(uploadOfferLetter.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const { clearPlacementError, clearMatches } = placementMappingSlice.actions;
export default placementMappingSlice.reducer;
