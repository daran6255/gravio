export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'archived';

export interface Project {
	id: number;
	public_id: string;
	name: string;
	description?: string;
	owner_id?: number;
	company_id?: number;
	/** Set when this project was created by converting a Won CRM deal. */
	deal_id?: number;
	status: ProjectStatus;
	start_date?: string;
	end_date?: string;
	budget?: number;
	currency: string;
	phase?: string;
	issues?: string;
	tags?: string[];
	custom_fields?: Record<string, any>;
	created_at: string;
	updated_at: string;
	/** Only populated when the list/get endpoint eager-loads tasks. */
	task_count?: number;
	completed_task_count?: number;
}

/** Matches backend's ProjectCreate. */
export interface ProjectCreate {
	name: string;
	description?: string;
	owner_id?: number;
	company_id?: number;
	status?: ProjectStatus;
	start_date?: string;
	end_date?: string;
	budget?: number;
	currency?: string;
	phase?: string;
	issues?: string;
	tags?: string[];
	custom_fields?: Record<string, any>;
}

export interface ProjectUpdate extends Partial<ProjectCreate> { }

/** Matches backend's DealConvertToProjectRequest. */
export interface DealConvertToProjectRequest {
	name?: string;
	owner_id?: number;
	start_date?: string;
	end_date?: string;
	budget?: number;
}

export interface DealProjectConversionPreview {
	original_value?: number;
	original_currency: string;
	target_currency: string;
	converted_value?: number;
	rate?: number;
	rate_date?: string;
	converted: boolean;
}

