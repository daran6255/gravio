export interface CRMFile {
	id: number;
	public_id: string;
	file_name: string;
	file_size: number;
	mime_type: string;
	entity_type: string;
	entity_id: number;
	owner_id?: number;
	created_at: string;
	updated_at: string;
}
