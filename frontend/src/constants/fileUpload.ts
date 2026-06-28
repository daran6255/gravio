/** Mirrors backend's settings.MAX_UPLOAD_FILE_SIZE_BYTES / ALLOWED_UPLOAD_MIME_TYPES (app/core/config.py). */
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export const ALLOWED_UPLOAD_MIME_TYPES = [
	'application/pdf',
	'image/jpeg',
	'image/png',
	'image/gif',
	'image/webp',
	'application/msword',
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
	'application/vnd.ms-excel',
	'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
	'text/csv',
	'text/plain',
	'application/zip',
];
