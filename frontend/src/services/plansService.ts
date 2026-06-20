import api from './api';

export interface Plan {
	tier: 'basic' | 'pro' | 'enterprise';
	name: string;
	enabled_modules: string[];
	ai_monthly_limit: number;
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
