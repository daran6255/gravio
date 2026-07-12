import type { DocumentType } from '../../../../models/hr';

export const DOCUMENT_TYPES: DocumentType[] = [
	'PAN Card',
	'Aadhaar Card',
	'NDA Signoff',
	'Offer Letter',
	'Degree Certificate',
	'Passport/Visa',
	'Resume',
	'Other Identity Proof',
];

export const ACCEPTED_FILE_TYPES = '.pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.xls,.xlsx,.csv,.txt,.zip';
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB, mirrors backend settings.MAX_UPLOAD_FILE_SIZE_BYTES

export const formatFileSize = (bytes?: number | null): string => {
	if (!bytes) return '—';
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
