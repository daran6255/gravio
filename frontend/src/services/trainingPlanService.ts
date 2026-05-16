import api from './api';
import type { TrainingBatchPlan } from '../models/training';

const trainingPlanService = {
	getWeeklyPlan: async (batchPublicId: string, startDate: string) => {
		const response = await api.get<TrainingBatchPlan[]>(`/training-batch-plans/batch/${batchPublicId}?start_date=${startDate}`);
		return response.data;
	},

	getAllBatchPlans: async (batchPublicId: string) => {
		const response = await api.get<TrainingBatchPlan[]>(`/training-batch-plans/batch/${batchPublicId}/all`);
		return response.data;
	},

	createPlanEntry: async (data: any) => {
		const response = await api.post<TrainingBatchPlan>('/training-batch-plans/', data);
		return response.data;
	},

	updatePlanEntry: async (publicId: string, data: Partial<TrainingBatchPlan>) => {
		const response = await api.put<TrainingBatchPlan>(`/training-batch-plans/${publicId}`, data);
		return response.data;
	},

	deletePlanEntry: async (publicId: string) => {
		const response = await api.delete(`/training-batch-plans/${publicId}`);
		return response.data;
	},

	syncBatchWithProject: async (batchPublicId: string) => {
		const response = await api.post(`/training-batch-plans/batch/${batchPublicId}/sync`);
		return response.data;
	}
};

export default trainingPlanService;
