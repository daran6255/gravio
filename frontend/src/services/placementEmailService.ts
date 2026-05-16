import api from './api';

export interface CandidateDocumentInfo {
    id: number;
    name: string;
    type: string;
    size: number;
}

export interface CandidateAvailableDocuments {
    mapping_id: number;
    candidate_name: string;
    documents: CandidateDocumentInfo[];
}

export interface CandidateEmailRequest {
    mapping_ids?: number[];
    document_ids?: number[];
    custom_email?: string;
    custom_subject?: string;
    custom_message?: string;
    custom_cc?: string;
}

const placementEmailService = {
    getAvailableDocuments: async (mappingIds: number[]): Promise<CandidateAvailableDocuments[]> => {
        const params = new URLSearchParams();
        mappingIds.forEach(id => params.append('mapping_ids', id.toString()));
        const response = await api.get(`/placement/email/available-documents?${params.toString()}`);
        return response.data;
    },
    sendCandidateProfile: async (mappingId: number, data: CandidateEmailRequest) => {
        const response = await api.post(`/placement/email/send-candidate/${mappingId}`, data);
        return response.data;
    },
    sendBulkProfiles: async (data: CandidateEmailRequest) => {
        const response = await api.post(`/placement/email/send-bulk`, data);
        return response.data;
    }
};

export default placementEmailService;
