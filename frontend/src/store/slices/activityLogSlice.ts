/**
 * Activity Log Redux Slice
 * 
 * Manages state for activity logs including fetching, filtering, and pagination.
 * 
 * @module activityLogSlice
 */

import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import activityLogService from '../../services/activitylogsServices';
import type {
    ActivityLog,
    ActivityLogFilter,
    PaginatedActivityLogsResponse,
} from '../../models/activitylogs';

/**
 * State interface for activity logs slice
 */
interface ActivityLogState {
    logs: ActivityLog[];
    pagination: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
    };
    filter: ActivityLogFilter;
    loading: boolean;
    error: string | null;
}

/**
 * Initial state for activity logs
 */
const initialState: ActivityLogState = {
    logs: [],
    pagination: {
        page: 1,
        pageSize: 20,
        total: 0,
        totalPages: 0,
    },
    filter: {},
    loading: false,
    error: null,
};

// =============================================================================
// Async Thunks
// =============================================================================

/**
 * Fetch all activity logs with optional filtering (Admin only)
 * 
 * @param params - Object containing filter, page, and pageSize
 */
export const fetchAllActivityLogs = createAsyncThunk(
    'activityLogs/fetchAll',
    async (
        params: { filter?: ActivityLogFilter; page?: number; pageSize?: number },
        { rejectWithValue }
    ) => {
        try {
            const { filter = {}, page = 1, pageSize = 20 } = params;
            const response = await activityLogService.getAllActivityLogs(filter, page, pageSize);
            return response;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.message || error.message || 'Failed to fetch activity logs'
            );
        }
    }
);

/**
 * Fetch activity logs for the current authenticated user
 * 
 * @param params - Object containing page and pageSize
 */
export const fetchMyActivityLogs = createAsyncThunk(
    'activityLogs/fetchMy',
    async (params: { page?: number; pageSize?: number } = {}, { rejectWithValue }) => {
        try {
            const { page = 1, pageSize = 20 } = params;
            const response = await activityLogService.getMyActivityLogs(page, pageSize);
            return response;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.message || error.message || 'Failed to fetch your activity logs'
            );
        }
    }
);


// =============================================================================
// Slice
// =============================================================================

const activityLogSlice = createSlice({
    name: 'activityLogs',
    initialState,
    reducers: {
        /**
         * Clear all activity logs from state
         */
        clearActivityLogs: (state) => {
            state.logs = [];
            state.pagination = {
                page: 1,
                pageSize: 20,
                total: 0,
                totalPages: 0,
            };
        },

        /**
         * Clear error state
         */
        clearError: (state) => {
            state.error = null;
        },

        /**
         * Update filter parameters
         */
        setFilter: (state, action: PayloadAction<ActivityLogFilter>) => {
            state.filter = action.payload;
        },

        /**
         * Update pagination parameters
         */
        setPage: (state, action: PayloadAction<number>) => {
            state.pagination.page = action.payload;
        },

        /**
         * Update page size
         */
        setPageSize: (state, action: PayloadAction<number>) => {
            state.pagination.pageSize = action.payload;
        },
    },
    extraReducers: (builder) => {
        // Fetch All Activity Logs
        builder
            .addCase(fetchAllActivityLogs.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(
                fetchAllActivityLogs.fulfilled,
                (state, action: PayloadAction<PaginatedActivityLogsResponse>) => {
                    state.loading = false;
                    state.logs = action.payload.items;
                    state.pagination = {
                        page: action.payload.page,
                        pageSize: action.payload.pageSize,
                        total: action.payload.total,
                        totalPages: action.payload.totalPages,
                    };
                }
            )
            .addCase(fetchAllActivityLogs.rejected, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Fetch My Activity Logs
            .addCase(fetchMyActivityLogs.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(
                fetchMyActivityLogs.fulfilled,
                (state, action: PayloadAction<PaginatedActivityLogsResponse>) => {
                    state.loading = false;
                    state.logs = action.payload.items;
                    state.pagination = {
                        page: action.payload.page,
                        pageSize: action.payload.pageSize,
                        total: action.payload.total,
                        totalPages: action.payload.totalPages,
                    };
                }
            )
            .addCase(fetchMyActivityLogs.rejected, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.error = action.payload;
            })
    },
});

// =============================================================================
// Exports
// =============================================================================

export const { clearActivityLogs, clearError, setFilter, setPage, setPageSize } =
    activityLogSlice.actions;

export default activityLogSlice.reducer;
