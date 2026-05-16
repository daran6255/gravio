import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import placementEmailService, { 
    type CandidateAvailableDocuments, 
    type CandidateEmailRequest 
} from '../../services/placementEmailService';

interface PlacementEmailState {
    availableDocuments: CandidateAvailableDocuments[];
    fetchLoading: boolean;
    sendLoading: boolean;
    error: string | null;
}

const initialState: PlacementEmailState = {
    availableDocuments: [],
    fetchLoading: false,
    sendLoading: false,
    error: null,
};

export const fetchAvailableDocuments = createAsyncThunk(
    'placementEmail/fetchAvailableDocuments',
    async (mappingIds: number[], { rejectWithValue }) => {
        try {
            return await placementEmailService.getAvailableDocuments(mappingIds);
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.detail || 'Failed to fetch available documents');
        }
    }
);

export const sendBulkProfiles = createAsyncThunk(
    'placementEmail/sendBulkProfiles',
    async (data: CandidateEmailRequest, { rejectWithValue }) => {
        try {
            return await placementEmailService.sendBulkProfiles(data);
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.detail || 'Failed to send bulk profiles');
        }
    }
);

export const sendCandidateProfile = createAsyncThunk(
    'placementEmail/sendCandidateProfile',
    async ({ mappingId, data }: { mappingId: number; data: CandidateEmailRequest }, { rejectWithValue }) => {
        try {
            return await placementEmailService.sendCandidateProfile(mappingId, data);
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.detail || 'Failed to send candidate profile');
        }
    }
);

const placementEmailSlice = createSlice({
    name: 'placementEmail',
    initialState,
    reducers: {
        clearEmailError: (state) => {
            state.error = null;
        },
        clearAvailableDocuments: (state) => {
            state.availableDocuments = [];
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch Documents
            .addCase(fetchAvailableDocuments.pending, (state) => {
                state.fetchLoading = true;
                state.error = null;
            })
            .addCase(fetchAvailableDocuments.fulfilled, (state, action: PayloadAction<CandidateAvailableDocuments[]>) => {
                state.fetchLoading = false;
                state.availableDocuments = action.payload;
            })
            .addCase(fetchAvailableDocuments.rejected, (state, action) => {
                state.fetchLoading = false;
                state.error = action.payload as string;
            })
            // Send Bulk
            .addCase(sendBulkProfiles.pending, (state) => {
                state.sendLoading = true;
                state.error = null;
            })
            .addCase(sendBulkProfiles.fulfilled, (state) => {
                state.sendLoading = false;
            })
            .addCase(sendBulkProfiles.rejected, (state, action) => {
                state.sendLoading = false;
                state.error = action.payload as string;
            })
            // Send Single
            .addCase(sendCandidateProfile.pending, (state) => {
                state.sendLoading = true;
                state.error = null;
            })
            .addCase(sendCandidateProfile.fulfilled, (state) => {
                state.sendLoading = false;
            })
            .addCase(sendCandidateProfile.rejected, (state, action) => {
                state.sendLoading = false;
                state.error = action.payload as string;
            });
    },
});

export const { clearEmailError, clearAvailableDocuments } = placementEmailSlice.actions;
export default placementEmailSlice.reducer;
