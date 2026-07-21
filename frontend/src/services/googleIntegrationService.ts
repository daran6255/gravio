import api from './api';
import type { GoogleConnectionStatusResponse, GoogleAuthorizationUrlResponse } from '../models/booking/googleIntegration';

const googleIntegrationService = {
	getStatus: async (): Promise<GoogleConnectionStatusResponse> => {
		const response = await api.get<GoogleConnectionStatusResponse>('/integrations/google/status');
		return response.data;
	},
	getAuthorizationUrl: async (): Promise<string> => {
		const response = await api.get<GoogleAuthorizationUrlResponse>('/integrations/google/connect');
		return response.data.authorization_url;
	},
	disconnect: async (): Promise<void> => {
		await api.post('/integrations/google/disconnect');
	},
};

export default googleIntegrationService;
