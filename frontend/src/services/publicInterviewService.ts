import api from './api';
import type { TrainingMockInterview } from '../models/training';

const publicInterviewService = {
	getInterview: async (token: string) => {
		const response = await api.get<TrainingMockInterview>(`/public/mock-interviews/${token}`);
		return response.data;
	},

	submitAnswers: async (token: string, answers: { question: string; answer: string }[]) => {
		const response = await api.post<TrainingMockInterview>(`/public/mock-interviews/${token}/submit`, answers);
		return response.data;
	},
};

export default publicInterviewService;
