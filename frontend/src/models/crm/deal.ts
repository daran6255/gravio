export type DealStatus = 'open' | 'won' | 'lost' | 'on_hold';

/** Matches backend's CRMDealResponse exactly. */
export interface Deal {
	id: number;
	public_id: string;
	title: string;
	contact_id?: number;
	company_id?: number;
	lead_id?: number;
	pipeline_id: number;
	stage_id: number;
	owner_id?: number;
	value?: number;
	currency: string;
	close_date?: string;
	probability: number;
	status: DealStatus;
	lost_reason?: string;
	tags?: string[];
	custom_fields?: Record<string, any>;
	created_at: string;
	updated_at: string;
	/** Only populated by the deals list endpoint (kanban board); 0 elsewhere. */
	task_count?: number;
	completed_task_count?: number;
	in_progress_task_count?: number;
}

/** Matches backend's CRMDealCreate. */
export interface DealCreate {
	title: string;
	contact_id?: number;
	company_id?: number;
	lead_id?: number;
	pipeline_id: number;
	stage_id: number;
	owner_id?: number;
	value?: number;
	currency?: string;
	close_date?: string;
	probability?: number;
	status?: DealStatus;
	lost_reason?: string;
	tags?: string[];
	custom_fields?: Record<string, any>;
}

export interface DealUpdate extends Partial<DealCreate> { }

/** Matches backend's AuditLogResponse, scoped to entity_type="deal". */
export interface DealHistoryEntry {
	id: number;
	action: string;
	field_name?: string;
	old_value?: string;
	new_value?: string;
	changed_by_user_id?: number;
	changed_at: string;
}
