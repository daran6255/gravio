// HR Department models

export interface HRDepartmentListItem {
	id: number;
	public_id: string;
	name: string;
	description: string | null;
	parent_id: number | null;
	head_user_id: number | null;
	head_user_name: string | null;
	is_active: boolean;
	designation_count: number | null;
	employee_count: number | null;
	created_at: string;
}

export interface HRDepartmentResponse extends HRDepartmentListItem {
	others: Record<string, unknown> | null;
	organization_id: number;
	updated_at: string;
}

export interface HRDepartmentCreate {
	name: string;
	description?: string;
	parent_id?: number | null;
	head_user_id?: number | null;
	others?: Record<string, unknown> | null;
}

export interface HRDepartmentUpdate {
	name?: string;
	description?: string;
	parent_id?: number | null;
	head_user_id?: number | null;
	is_active?: boolean;
	others?: Record<string, unknown> | null;
}
