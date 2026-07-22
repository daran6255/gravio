import api from './api';

/** Matches backend's PlanResponse (GET /plans) — every seeded pricing tier. */
export interface Plan {
	tier: 'free' | 'basic' | 'pro' | 'enterprise';
	name: string;
	enabled_modules: string[];
	ai_credits_monthly: number;
	user_limit?: number | null;
}

const plansService = {
	/**
	 * List all available pricing plans
	 */
	list: async (): Promise<Plan[]> => {
		const response = await api.get<Plan[]>('/plans');
		return response.data;
	}
};

export default plansService;
