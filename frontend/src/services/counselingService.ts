import api from './api';
import type { CandidateCounselingCreate, CandidateCounseling } from '../models/candidate';

const counselingService = {
	// Create counseling record
	create: async (publicId: string, data: CandidateCounselingCreate): Promise<CandidateCounseling> => {
		const response = await api.post(`/candidates/${publicId}/counseling`, data);
		return response.data;
	},

	// Update counseling record
	update: async (publicId: string, data: CandidateCounselingCreate): Promise<CandidateCounseling> => {
		const response = await api.put(`/candidates/${publicId}/counseling`, data);
		return response.data;
	},

	// Delete counseling record
	delete: async (publicId: string): Promise<void> => {
		await api.delete(`/candidates/${publicId}/counseling`);
	},

	// Get candidates pending counseling (Profiled but no counseling)
	// We can reuse candidateService.getProfiled but we might need filtering.
	// For now, let's assume filtering happens on frontend or we add a new endpoint later.
	// Actually, looking at the requirement, we need "Profiled" candidates to be counseled.
	// So we can use getProfiled.

	// Get counseled candidates
	// We might need a new endpoint or filter for this. 
	// For now, let's assume we filter the "profiled" list or "all" list. 
	// Ideally, the backend should support ?status=counseled. 
	// Let's stick to basic CRUD for this service and use candidateService for lists.
};

export default counselingService;
