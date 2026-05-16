/**
 * Health Check Redux Slice
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import healthService from '../../services/healthService';
import type { SystemHealth } from '../../models/health';

interface HealthState {
	health: SystemHealth | null;
	loading: boolean;
	error: string | null;
	lastFetch: number | null;
}

const initialState: HealthState = {
	health: null,
	loading: false,
	error: null,
	lastFetch: null,
};

// Async thunk to fetch health status
export const fetchHealthStatus = createAsyncThunk(
	'health/fetchStatus',
	async (_, { rejectWithValue }) => {
		try {
			const startTime = Date.now();
			const response = await healthService.checkHealth();
			const responseTime = Date.now() - startTime;

			return {
				response,
				responseTime,
			};
		} catch (error: any) {
			return rejectWithValue(error.response?.data?.message || 'Failed to fetch health status');
		}
	}
);

const healthSlice = createSlice({
	name: 'health',
	initialState,
	reducers: {
		clearHealthError: (state) => {
			state.error = null;
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchHealthStatus.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchHealthStatus.fulfilled, (state, action) => {
				const { response } = action.payload;

				state.health = {
					overall: response.status,
					lastCheck: new Date(),
					apiVersion: response.version,
					environment: response.environment,
					metrics: response.metrics || [],
				};
				state.loading = false;
				state.lastFetch = Date.now();
			})
			.addCase(fetchHealthStatus.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload as string;

				// Set degraded state on error
				if (state.health) {
					state.health.overall = 'degraded';
					state.health.metrics = state.health.metrics.map((metric) =>
						metric.name === 'API Server' ? { ...metric, status: 'down' as const } : metric
					);
				}
			});
	},
});

export const { clearHealthError } = healthSlice.actions;
export default healthSlice.reducer;
