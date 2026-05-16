import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import placementMappingService from '../../services/placementMappingService';

interface PlacementDetailState {
    history: any[];
    offer: any | null;
    notes: any[];
    candidateDocuments: any[];
    loading: boolean;
    error: string | null;
}

const initialState: PlacementDetailState = {
    history: [],
    offer: null,
    notes: [],
    candidateDocuments: [],
    loading: false,
    error: null,
};

export const fetchPipelineHistory = createAsyncThunk(
    'placementDetail/fetchHistory',
    async (mappingId: number, { rejectWithValue }) => {
        try {
            return await placementMappingService.getPipelineHistory(mappingId);
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.detail || 'Failed to fetch history');
        }
    }
);

export const fetchOffer = createAsyncThunk(
    'placementDetail/fetchOffer',
    async (mappingId: number, { rejectWithValue }) => {
        try {
            return await placementMappingService.getOffer(mappingId);
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.detail || 'Failed to fetch offer');
        }
    }
);

export const fetchNotes = createAsyncThunk(
    'placementDetail/fetchNotes',
    async (mappingId: number, { rejectWithValue }) => {
        try {
            return await placementMappingService.getNotes(mappingId);
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.detail || 'Failed to fetch notes');
        }
    }
);

export const fetchCandidateDocuments = createAsyncThunk(
    'placementDetail/fetchDocuments',
    async (publicId: string, { rejectWithValue }) => {
        try {
            const { documentService } = await import('../../services/candidateService');
            return await documentService.getAll(publicId);
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.detail || 'Failed to fetch documents');
        }
    }
);

export const addPlacementNote = createAsyncThunk(
    'placementDetail/addNote',
    async (note: { mapping_id: number; content: string }, { rejectWithValue }) => {
        try {
            return await placementMappingService.addNote(note);
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.detail || 'Failed to add note');
        }
    }
);

export const recordOfferResponse = createAsyncThunk(
    'placementDetail/recordOfferResponse',
    async ({ offerId, response, remarks }: { offerId: number; response: 'accepted' | 'rejected' | 'pending'; remarks?: string }, { rejectWithValue }) => {
        try {
            return await placementMappingService.recordOfferResponse(offerId, response, remarks);
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.detail || 'Failed to record offer response');
        }
    }
);

export const recordJoiningStatus = createAsyncThunk(
    'placementDetail/recordJoiningStatus',
    async ({ offerId, status, joiningDate }: { offerId: number; status: 'joined' | 'not_joined' | 'pending'; joiningDate?: string }, { rejectWithValue }) => {
        try {
            return await placementMappingService.recordJoiningStatus(offerId, status, joiningDate);
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.detail || 'Failed to record joining status');
        }
    }
);

const placementDetailSlice = createSlice({
    name: 'placementDetail',
    initialState,
    reducers: {
        clearDetail: (state) => {
            state.history = [];
            state.offer = null;
            state.notes = [];
            state.candidateDocuments = [];
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // History
            .addCase(fetchPipelineHistory.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchPipelineHistory.fulfilled, (state, action: PayloadAction<any[]>) => {
                state.loading = false;
                state.history = action.payload;
            })
            .addCase(fetchPipelineHistory.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // Offer
            .addCase(fetchOffer.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchOffer.fulfilled, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.offer = action.payload;
            })
            .addCase(fetchOffer.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // Notes
            .addCase(fetchNotes.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchNotes.fulfilled, (state, action: PayloadAction<any[]>) => {
                state.loading = false;
                state.notes = action.payload;
            })
            .addCase(fetchNotes.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // Offer Response
            .addCase(recordOfferResponse.fulfilled, (state, action) => {
                state.offer = action.payload;
            })
            // Joining Status
            .addCase(recordJoiningStatus.fulfilled, (state, action) => {
                state.offer = action.payload;
            })
            // Candidate Documents
            .addCase(fetchCandidateDocuments.fulfilled, (state, action) => {
                state.candidateDocuments = action.payload;
            })
            // Add Note
            .addCase(addPlacementNote.fulfilled, (state, action) => {
                state.notes.unshift(action.payload);
            });
    },
});

export const { clearDetail } = placementDetailSlice.actions;
export default placementDetailSlice.reducer;
