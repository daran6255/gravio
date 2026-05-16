import api from './api';
import type { Assessment, AssessmentResult } from '../models/training';

const assessmentService = {
	// --- Trainer Management ---

	createAssessment: async (batchId: number, data: any) => {
		const response = await api.post(`/assessments/batch/${batchId}`, data);
		return response.data;
	},

	getBatchAssessments: async (batchId: number): Promise<Assessment[]> => {
		const response = await api.get(`/assessments/batch/${batchId}`);
		return response.data;
	},

	getAssessmentResults: async (assessmentId: number): Promise<AssessmentResult[]> => {
		const response = await api.get(`/assessments/${assessmentId}/results`);
		return response.data;
	},

	// --- Candidate Exam Portal ---

	getPublicAssessment: async (publicId: string): Promise<Assessment> => {
		const response = await api.get(`/assessments/public/${publicId}`);
		return response.data;
	},

	startAssessment: async (publicId: string, data: { email: string; dob: string; others?: any }) => {
		const response = await api.post(`/assessments/public/${publicId}/start`, data);
		return response.data;
	},

	submitAssessment: async (resultId: number, data: { responses: any[] }) => {
		const response = await api.post(`/assessments/public/submit/${resultId}`, data);
		return response.data;
	}
};

export default assessmentService;
