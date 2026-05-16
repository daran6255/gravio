import api from './api';
import type {
	Candidate,
	CandidateCreate,
	CandidateUpdate,
	CandidateScreening,
	CandidateScreeningCreate,
	CandidateDocument,
	CandidateDocumentCreate,
	CandidateCounseling,
	CandidateCounselingCreate,
	CandidateStats,
	CandidatePaginatedResponse
} from '../models/candidate';

// ======================
// CANDIDATE SERVICE
// ======================
export const candidateService = {
	/**
	 * Get all candidates (simplified list)
	 */
	getAll: async (
		skip = 0,
		limit = 100,
		search?: string,
		sortBy?: string,
		sortOrder: 'asc' | 'desc' = 'desc',
		disabilityTypes?: string,
		educationLevels?: string,
		cities?: string,
		counselingStatus?: string,
		screeningStatus?: string,
		isExperienced?: boolean,
		disabilityPercentages?: string,
		screeningReasons?: string,
		gender?: string,
		yearOfPassing?: string,
		yearOfExperience?: string,
		currentlyEmployed?: boolean,
		registrationType?: string,
		extraFilters?: Record<string, string>,
		isGlobal: boolean = false
	): Promise<CandidatePaginatedResponse> => {
		const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
		const globalParam = isGlobal ? `&is_global=true` : '';
		const sortParam = sortBy ? `&sort_by=${sortBy}&sort_order=${sortOrder}` : '';
		const filterParams = [
			disabilityTypes ? `&disability_types=${encodeURIComponent(disabilityTypes)}` : '',
			educationLevels ? `&education_levels=${encodeURIComponent(educationLevels)}` : '',
			cities ? `&cities=${encodeURIComponent(cities)}` : '',
			counselingStatus ? `&counseling_status=${encodeURIComponent(counselingStatus)}` : '',
			screeningStatus ? `&screening_status=${encodeURIComponent(screeningStatus)}` : '',
			isExperienced !== undefined ? `&is_experienced=${isExperienced}` : '',
			disabilityPercentages ? `&disability_percentages=${encodeURIComponent(disabilityPercentages)}` : '',
			screeningReasons ? `&screening_reasons=${encodeURIComponent(screeningReasons)}` : '',
			gender ? `&gender=${encodeURIComponent(gender)}` : '',
			yearOfPassing ? `&year_of_passing=${encodeURIComponent(yearOfPassing)}` : '',
			yearOfExperience ? `&year_of_experience=${encodeURIComponent(yearOfExperience)}` : '',
			currentlyEmployed !== undefined ? `&currently_employed=${currentlyEmployed}` : '',
			registrationType ? `&registration_type=${encodeURIComponent(registrationType)}` : ''
		].join('');

		// Append dynamic (screening_others.* / counseling_others.*) filters
		const extraParams = extraFilters
			? Object.entries(extraFilters)
				.filter(([, v]) => v)
				.map(([k, v]) => `&${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
				.join('')
			: '';

		const response = await api.get<CandidatePaginatedResponse>(`/candidates/?skip=${skip}&limit=${limit}${searchParam}${sortParam}${filterParams}${extraParams}${globalParam}`);
		return response.data;
	},

	/**
	 * Get candidate statistics
	 */
	getStats: async (): Promise<CandidateStats> => {
		const response = await api.get<CandidateStats>('/candidates/stats');
		return response.data;
	},

	getScreeningStats: async (isGlobal: boolean = false): Promise<any> => {
		const response = await api.get(`/candidates/screening-stats${isGlobal ? '?is_global=true' : ''}`);
		return response.data;
	},

	/**
	 * Get candidate by public_id (UUID)
	 * @param publicId - UUID of the candidate
	 * @param withDetails - Include profile, documents, and counseling data
	 */
	getById: async (publicId: string, withDetails = true): Promise<Candidate> => {
		const response = await api.get<Candidate>(`/candidates/${publicId}?with_details=${withDetails}`);
		return response.data;
	},

	/**
	 * Register new candidate (public endpoint)
	 */
	create: async (candidate: CandidateCreate): Promise<Candidate> => {
		const response = await api.post<Candidate>('/candidates/', candidate);
		return response.data;
	},

	/**
	 * Update candidate by public_id (UUID)
	 */
	update: async (publicId: string, candidate: CandidateUpdate): Promise<Candidate> => {
		const response = await api.put<Candidate>(`/candidates/${publicId}`, candidate);
		return response.data;
	},

	/**
	 * Delete candidate by public_id (UUID)
	 */
	delete: async (public_id: string): Promise<void> => {
		await api.delete(`/candidates/${public_id}`);
	},

	/**
	 * Get unscreened candidates
	 */
	getUnscreened: async (
		skip = 0,
		limit = 100,
		search?: string,
		sortBy?: string,
		sortOrder: 'asc' | 'desc' = 'desc',
		disabilityTypes?: string,
		educationLevels?: string,
		cities?: string,
		screeningStatus?: string,
		isExperienced?: boolean,
		counselingStatus?: string,
		isGlobal: boolean = false
	): Promise<CandidatePaginatedResponse> => {
		const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
		const globalParam = isGlobal ? `&is_global=true` : '';
		const sortParam = sortBy ? `&sort_by=${sortBy}&sort_order=${sortOrder}` : '';
		const filterParams = [
			disabilityTypes ? `&disability_types=${encodeURIComponent(disabilityTypes)}` : '',
			educationLevels ? `&education_levels=${encodeURIComponent(educationLevels)}` : '',
			cities ? `&cities=${encodeURIComponent(cities)}` : '',
			screeningStatus ? `&screening_status=${encodeURIComponent(screeningStatus)}` : '',
			isExperienced !== undefined ? `&is_experienced=${isExperienced}` : '',
			counselingStatus ? `&counseling_status=${encodeURIComponent(counselingStatus)}` : ''
		].join('');

		const response = await api.get<CandidatePaginatedResponse>(`/candidates/unscreened?skip=${skip}&limit=${limit}${searchParam}${sortParam}${filterParams}${globalParam}`);
		return response.data;
	},

	/**
	 * Get screened candidates (with screening data)
	 */
	getScreened: async (
		skip = 0,
		limit = 100,
		counselingStatus?: string,
		search?: string,
		documentStatus?: string,
		sortBy?: string,
		sortOrder: 'asc' | 'desc' = 'desc',
		disabilityTypes?: string,
		educationLevels?: string,
		cities?: string,
		screeningStatus?: string,
		isExperienced?: boolean,
		yearOfPassing?: string,
		yearOfExperience?: string,
		currentlyEmployed?: boolean,
		isGlobal: boolean = false
	): Promise<CandidatePaginatedResponse> => {
		const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
		const globalParam = isGlobal ? `&is_global=true` : '';
		const docStatusParam = documentStatus ? `&document_status=${documentStatus}` : '';
		const sortParam = sortBy ? `&sort_by=${sortBy}&sort_order=${sortOrder}` : '';
		const filterParams = [
			disabilityTypes ? `&disability_types=${encodeURIComponent(disabilityTypes)}` : '',
			educationLevels ? `&education_levels=${encodeURIComponent(educationLevels)}` : '',
			cities ? `&cities=${encodeURIComponent(cities)}` : '',
			screeningStatus ? `&screening_status=${encodeURIComponent(screeningStatus)}` : '',
			isExperienced !== undefined ? `&is_experienced=${isExperienced}` : '',
			yearOfPassing ? `&year_of_passing=${encodeURIComponent(yearOfPassing)}` : '',
			yearOfExperience ? `&year_of_experience=${encodeURIComponent(yearOfExperience)}` : '',
			currentlyEmployed !== undefined ? `&currently_employed=${currentlyEmployed}` : ''
		].join('');

		const response = await api.get<CandidatePaginatedResponse>(`/candidates/screened?skip=${skip}&limit=${limit}${counselingStatus ? `&counseling_status=${counselingStatus}` : ''}${docStatusParam}${searchParam}${sortParam}${filterParams}${globalParam}`);
		return response.data;
	},

	/**
	 * Get profiled candidates (alias for getScreened for backward compatibility)
	 */
	getProfiled: async (skip = 0, limit = 100, counselingStatus?: string, search?: string, documentStatus?: string, sortBy?: string, sortOrder: 'asc' | 'desc' = 'desc'): Promise<CandidatePaginatedResponse> => {
		return candidateService.getScreened(skip, limit, counselingStatus, search, documentStatus, sortBy, sortOrder);
	},

	/**
	 * Get filter options for all candidates
	 */
	getFilterOptions: async (): Promise<{
		disability_types: string[];
		education_levels: string[];
		cities: string[];
		counseling_statuses: string[];
		screening_statuses: string[];
		registration_types: string[];
	}> => {
		const response = await api.get('/candidates/filter-options');
		return response.data;
	},

	/**
	 * Check if email/phone are available and validate pincode
	 */
	checkAvailability: async (params: { 
		email?: string; 
		phone?: string; 
		pincode: string; 
		country_code?: string;
		city?: string;
		district?: string;
		state?: string;
		exclude_public_id?: string;
	}): Promise<{ status: string; address: any }> => {
		const response = await api.post('/candidates/check-availability', params);
		return response.data;
	},

	/**
	 * Assign candidate to sourcing user
	 */
	assignCandidate: async (publicId: string, userId: number): Promise<any> => {
		const response = await api.post(`/candidates/${publicId}/assign`, { user_id: userId });
		return response.data;
	},

	/**
	 * Export candidates based on filters and send via email
	 */
	export: async (
		search?: string,
		sortBy?: string,
		sortOrder: 'asc' | 'desc' = 'desc',
		disabilityTypes?: string,
		educationLevels?: string,
		cities?: string,
		counselingStatus?: string,
		screeningStatus?: string,
		isExperienced?: boolean,
		disabilityPercentages?: string,
		screeningReasons?: string,
		gender?: string,
		yearOfPassing?: string,
		yearOfExperience?: string,
		currentlyEmployed?: boolean,
		registrationType?: string,
		extraFilters?: Record<string, string>,
		isGlobal: boolean = false,
		columns?: string
	): Promise<{ message: string }> => {
		const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
		const globalParam = isGlobal ? `&is_global=true` : '';
		const columnsParam = columns ? `&columns=${encodeURIComponent(columns)}` : '';
		const sortParam = sortBy ? `&sort_by=${sortBy}&sort_order=${sortOrder}` : '';
		const filterParams = [
			disabilityTypes ? `&disability_types=${encodeURIComponent(disabilityTypes)}` : '',
			educationLevels ? `&education_levels=${encodeURIComponent(educationLevels)}` : '',
			cities ? `&cities=${encodeURIComponent(cities)}` : '',
			counselingStatus ? `&counseling_status=${encodeURIComponent(counselingStatus)}` : '',
			screeningStatus ? `&screening_status=${encodeURIComponent(screeningStatus)}` : '',
			isExperienced !== undefined ? `&is_experienced=${isExperienced}` : '',
			disabilityPercentages ? `&disability_percentages=${encodeURIComponent(disabilityPercentages)}` : '',
			screeningReasons ? `&screening_reasons=${encodeURIComponent(screeningReasons)}` : '',
			gender ? `&gender=${encodeURIComponent(gender)}` : '',
			yearOfPassing ? `&year_of_passing=${encodeURIComponent(yearOfPassing)}` : '',
			yearOfExperience ? `&year_of_experience=${encodeURIComponent(yearOfExperience)}` : '',
			currentlyEmployed !== undefined ? `&currently_employed=${currentlyEmployed}` : '',
			registrationType ? `&registration_type=${encodeURIComponent(registrationType)}` : ''
		].join('');

		const extraParams = extraFilters
			? Object.entries(extraFilters)
				.filter(([, v]) => v)
				.map(([k, v]) => `&${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
				.join('')
			: '';

		const response = await api.post<{ message: string }>(`/candidates/export?${searchParam}${globalParam}${columnsParam}${sortParam}${filterParams}${extraParams}`);
		return response.data;
	}
};

// ======================
// SCREENING SERVICE
// ======================
export const screeningService = {
	/**
	 * Create screening for a candidate
	 */
	create: async (publicId: string, screening: CandidateScreeningCreate): Promise<CandidateScreening> => {
		const response = await api.post<CandidateScreening>(`/candidates/${publicId}/screening`, screening);
		return response.data;
	},

	/**
	 * Update candidate screening
	 */
	update: async (publicId: string, screening: Partial<CandidateScreeningCreate>): Promise<CandidateScreening> => {
		const response = await api.put<CandidateScreening>(`/candidates/${publicId}/screening`, screening);
		return response.data;
	},

	/**
	 * Delete candidate screening
	 */
	delete: async (publicId: string): Promise<void> => {
		await api.delete(`/candidates/${publicId}/screening`);
	},

	/**
	 * Send consent email to candidate
	 */
	sendConsent: async (publicId: string): Promise<any> => {
		const response = await api.post(`/consent/send/${publicId}`);
		return response.data;
	},

	/**
	 * Get consent form data (public)
	 */
	getConsentData: async (publicId: string): Promise<any> => {
		const response = await api.get(`/consent/public/${publicId}`);
		return response.data;
	},

	/**
	 * Submit consent form (public)
	 */
	submitConsent: async (publicId: string): Promise<any> => {
		const response = await api.post(`/consent/public/${publicId}/submit`);
		return response.data;
	}
};

// ======================
// DOCUMENT SERVICE
// ======================
export const documentService = {
	/**
	 * Upload document file for a candidate
	 */
	upload: async (
		publicId: string,
		documentType: string,
		file: File,
		description?: string,
		documentSource?: string
	): Promise<CandidateDocument> => {
		const formData = new FormData();
		formData.append('document_type', documentType);
		formData.append('file', file);
		if (description) {
			formData.append('description', description);
		}
		if (documentSource) {
			formData.append('document_source', documentSource);
		}

		// Use multipart/form-data for file uploads.
		// Axios will automatically add the boundary if we provide the header.
		const response = await api.post<CandidateDocument>(
			`/candidates/${publicId}/documents/upload`,
			formData,
			{
				headers: {
					'Content-Type': 'multipart/form-data',
				},
			}
		);
		return response.data;
	},

	/**
	 * Create document with manual file path
	 */
	create: async (publicId: string, document: CandidateDocumentCreate): Promise<CandidateDocument> => {
		const response = await api.post<CandidateDocument>(`/candidates/${publicId}/documents`, document);
		return response.data;
	},

	/**
	 * Get all documents for a candidate
	 */
	getAll: async (publicId: string): Promise<CandidateDocument[]> => {
		const response = await api.get<CandidateDocument[]>(`/candidates/${publicId}/documents`);
		return response.data;
	},

	/**
	 * Update document metadata
	 */
	update: async (documentId: number, document: Partial<CandidateDocumentCreate>): Promise<CandidateDocument> => {
		const response = await api.put<CandidateDocument>(`/candidates/documents/${documentId}`, document);
		return response.data;
	},

	download: async (documentId: number): Promise<Blob> => {
		const response = await api.get(`/candidates/documents/${documentId}/download`, {
			responseType: 'blob',
		});
		return response.data;
	},

	/**
	 * Delete document and its file
	 */
	delete: async (documentId: number): Promise<void> => {
		await api.delete(`/candidates/documents/${documentId}`);
	}
};

// ======================
// COUNSELING SERVICE
// ======================
export const counselingService = {
	/**
	 * Create counseling record for a candidate
	 */
	create: async (publicId: string, counseling: CandidateCounselingCreate): Promise<CandidateCounseling> => {
		const response = await api.post<CandidateCounseling>(`/candidates/${publicId}/counseling`, counseling);
		return response.data;
	},

	/**
	 * Update counseling record
	 */
	update: async (publicId: string, counseling: Partial<CandidateCounselingCreate>): Promise<CandidateCounseling> => {
		const response = await api.put<CandidateCounseling>(`/candidates/${publicId}/counseling`, counseling);
		return response.data;
	},

	/**
	 * Delete counseling record
	 */
	delete: async (publicId: string): Promise<void> => {
		await api.delete(`/candidates/${publicId}/counseling`);
	}
};

export default candidateService;

