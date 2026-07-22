import api from './api';

/** Matches backend's AICreditBalanceResponse (GET /ai/credits). */
export interface AICreditBalance {
	balance: number;
	granted: number;
	period_start: string;
	percent_used: number;
}

/** Matches backend's ActionTypeBreakdown/ProviderBreakdown/DailyUsagePoint (GET /ai/usage). */
export interface AIUsageBreakdown {
	tokens: number;
	credits: number;
	calls: number;
}

export interface AIActionTypeBreakdown extends AIUsageBreakdown {
	action_type: string;
}

export interface AIProviderBreakdown extends AIUsageBreakdown {
	provider: string;
}

export interface AIDailyUsagePoint extends AIUsageBreakdown {
	date: string;
}

/** Matches backend's TokenUtilizationSummary. */
export interface AIUsageSummary {
	total_tokens_used: number;
	total_credits_consumed: number;
	total_calls: number;
	by_provider: AIProviderBreakdown[];
	by_model: { model: string; tokens: number; credits: number; calls: number }[];
	by_action_type: AIActionTypeBreakdown[];
	daily_trend: AIDailyUsagePoint[];
}

const aiService = {
	getCreditBalance: async (): Promise<AICreditBalance> => {
		const response = await api.get<AICreditBalance>('/ai/credits');
		return response.data;
	},

	getUsageSummary: async (scope: 'mine' | 'organization' = 'mine'): Promise<AIUsageSummary> => {
		const response = await api.get<AIUsageSummary>('/ai/usage', { params: { scope } });
		return response.data;
	},
};

export default aiService;
