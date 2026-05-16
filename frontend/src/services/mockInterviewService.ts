import api from './api';
import { type MockInterview, type MockInterviewCreate, type MockInterviewUpdate } from '../models/MockInterview';

const mockInterviewService = {
	getByBatchId: async (batchId: number) => {
		const response = await api.get<MockInterview[]>(`/training-extensions/mock-interviews/batch/${batchId}`);
		return response.data;
	},

	getById: async (id: number) => {
		const response = await api.get<MockInterview>(`/training-extensions/mock-interviews/${id}`);
		return response.data;
	},

	create: async (data: MockInterviewCreate) => {
		const response = await api.post<MockInterview>('/training-extensions/mock-interviews', data);
		return response.data;
	},

	update: async (id: number, data: MockInterviewUpdate) => {
		const response = await api.put<MockInterview>(`/training-extensions/mock-interviews/${id}`, data);
		return response.data;
	},

	delete: async (id: number) => {
		const response = await api.delete(`/training-extensions/mock-interviews/${id}`);
		return response.data;
	},
};

export default mockInterviewService;
