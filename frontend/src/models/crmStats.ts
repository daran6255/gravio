export interface StageStats {
	stage_id: number;
	stage_name: string;
	count: number;
	total_value: number;
}

export interface SourceStats {
	source: string;
	count: number;
}

/** Matches backend's CRMStatsResponse exactly. */
export interface CRMStats {
	total_active_leads: number;
	total_deal_value: number;
	deal_value_by_stage: StageStats[];
	leads_by_source: SourceStats[];
	overdue_tasks_count: number;
}
