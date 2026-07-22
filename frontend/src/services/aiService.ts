import api from './api';

/** Matches backend's AICreditBalanceResponse (GET /ai/credits). */
export interface AICreditBalance {
	balance: number;
	granted: number;
	period_start: string;
	percent_used: number;
}

const aiService = {
	getCreditBalance: async (): Promise<AICreditBalance> => {
		const response = await api.get<AICreditBalance>('/ai/credits');
		return response.data;
	},
};

export default aiService;
