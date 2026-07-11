// HR Designation models

export interface HRDesignationListItem {
	id: number;
	public_id: string;
	name: string;
	department_id: number | null;
	department_name: string | null;
	grade: string | null;
	description: string | null;
	is_active: boolean;
	employee_count: number;
	created_at: string;
}

export interface HRDesignationResponse extends HRDesignationListItem {
	description: string | null;
	others: Record<string, unknown> | null;
	organization_id: number;
	updated_at: string;
}

export interface HRDesignationCreate {
	name: string;
	department_id?: number | null;
	grade?: string;
	description?: string;
	others?: Record<string, unknown> | null;
}

export interface HRDesignationUpdate {
	name?: string;
	department_id?: number | null;
	grade?: string;
	description?: string;
	is_active?: boolean;
	others?: Record<string, unknown> | null;
}
