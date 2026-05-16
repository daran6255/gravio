import api from './api';
import type { TrainingAttendance, TrainingAssignment, TrainingMockInterview, TrainingBatchEvent, TrainingBatchPlan } from '../models/training';

const trainingExtensionService = {
	// Attendance
	getAttendance: async (batchId: number) => {
		const response = await api.get<TrainingAttendance[]>(`/training-extensions/attendance/${batchId}`);
		return response.data;
	},

	getAttendanceByDate: async (batchId: number, date: string) => {
		const response = await api.get<TrainingAttendance[]>(`/training-extensions/attendance/${batchId}/date/${date}`);
		return response.data;
	},

	updateBulkAttendance: async (data: TrainingAttendance[]) => {
		const response = await api.post<TrainingAttendance[]>('/training-extensions/attendance/bulk', data);
		return response.data;
	},
	updateAttendance: async (attendanceId: number, data: Partial<TrainingAttendance>) => {
		const response = await api.put<TrainingAttendance>(`/training-extensions/attendance/${attendanceId}`, data);
		return response.data;
	},
	deleteAttendance: async (attendanceId: number) => {
		const response = await api.delete(`/training-extensions/attendance/${attendanceId}`);
		return response.data;
	},
	deleteAttendanceByCandidate: async (candidateId: number, batchId: number) => {
		const response = await api.delete(`/training-extensions/attendance/candidate/${candidateId}/batch/${batchId}`);
		return response.data as { message: string; deleted_count: number };
	},

	// Training Plan
	getDailyPlan: async (batchPublicId: string, date: string) => {
		const response = await api.get<TrainingBatchPlan[]>(`/training-batch-plans/batch/${batchPublicId}`, {
			params: { start_date: date }
		});
		// Filter to only return plans for the specific date
		return response.data.filter(plan => plan.date === date);
	},

	// Assignments
	getAssignments: async (batchId: number) => {
		const response = await api.get<TrainingAssignment[]>(`/training-extensions/assignments/${batchId}`);
		return response.data;
	},

	createAssignment: async (data: TrainingAssignment) => {
		const response = await api.post<TrainingAssignment>('/training-extensions/assignments', data);
		return response.data;
	},

	updateBulkAssignments: async (data: TrainingAssignment[]) => {
		const response = await api.post<TrainingAssignment[]>('/training-extensions/assignments/bulk', data);
		return response.data;
	},

	deleteAssignment: async (batchId: number, assignmentName: string) => {
		const response = await api.delete(`/training-extensions/assignments/${batchId}/${encodeURIComponent(assignmentName)}`);
		return response.data;
	},

	// Mock Interviews
	getMockInterviews: async (batchId: number) => {
		const response = await api.get<TrainingMockInterview[]>(`/training-extensions/mock-interviews/batch/${batchId}`);
		return response.data;
	},

	getMockInterview: async (id: number) => {
		const response = await api.get<TrainingMockInterview>(`/training-extensions/mock-interviews/${id}`);
		return response.data;
	},

	createMockInterview: async (data: TrainingMockInterview) => {
		const response = await api.post<TrainingMockInterview>('/training-extensions/mock-interviews', data);
		return response.data;
	},

	generateMockInterviewToken: async (id: number) => {
		const response = await api.post<TrainingMockInterview>(`/training-extensions/mock-interviews/${id}/generate-token`);
		return response.data;
	},

	// Batch Events (Holidays)
	getBatchEvents: async (batchId: number) => {
		const response = await api.get<TrainingBatchEvent[]>(`/training-extensions/events/${batchId}`);
		return response.data;
	},

	createBatchEvent: async (data: TrainingBatchEvent) => {
		const response = await api.post<TrainingBatchEvent>('/training-extensions/events', data);
		return response.data;
	},

	deleteBatchEvent: async (eventId: number) => {
		const response = await api.delete(`/training-extensions/events/${eventId}`);
		return response.data;
	},
	// Candidate specific data
	getCandidateAttendance: async (publicId: string) => {
		const response = await api.get<TrainingAttendance[]>(`/training-extensions/attendance/candidate/${publicId}`);
		return response.data;
	},

	getCandidateAssignments: async (publicId: string) => {
		const response = await api.get<TrainingAssignment[]>(`/training-extensions/assignments/candidate/${publicId}`);
		return response.data;
	},

	getCandidateMockInterviews: async (publicId: string) => {
		const response = await api.get<TrainingMockInterview[]>(`/training-extensions/mock-interviews/candidate/${publicId}`);
		return response.data;
	},

	getCandidateAllocations: async (publicId: string) => {
		const response = await api.get<any[]>(`/training-candidate-allocations/candidate/${publicId}`);
		return response.data;
	},
};

export default trainingExtensionService;

