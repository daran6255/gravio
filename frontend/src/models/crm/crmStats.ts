import type { CRMActivity } from './crmActivity';

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
	conversion_rate: number;
	my_tasks: CRMActivity[];
}

/** Matches backend's CRMLeadStatsResponse exactly. */
export interface CRMLeadStats {
	total_leads: number;
	new_count: number;
	contacted_count: number;
	qualified_count: number;
	unqualified_count: number;
	converted_count: number;
	conversion_rate: number;
}
