/**
 * Health Check Service
 */
import axios from 'axios';
import type { HealthCheckResponse } from '../models/health';

// Create a separate axios instance for health check (no /api/v1 prefix)
const healthApi = axios.create({
	baseURL: import.meta.env.VITE_API_URL,
	headers: {
		'Content-Type': 'application/json',
	},
});

export const healthService = {
	/**
	 * Check system health status
	 */
	async checkHealth(): Promise<HealthCheckResponse> {
		const response = await healthApi.get<HealthCheckResponse>('/health');
		return response.data;
	},
};

export default healthService;
