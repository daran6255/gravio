export type CRMEntityType = 'company' | 'contact' | 'lead' | 'deal' | 'task';
export type CRMActivityType = 'created' | 'updated' | 'deleted' | 'status_changed' | 'stage_changed' | 'note_added' | 'email_sent' | 'call_made' | 'meeting_held' | 'converted' | 'task_assigned' | 'other';

export interface CRMActivityLog {
	public_id: string;
	entity_type: CRMEntityType;
	entity_id: number;
	activity_type: CRMActivityType;
	performed_by: number;
	summary: string;
	details?: Record<string, any>;
	extra_data?: Record<string, any>;
	created_at: string;
	performer?: any;
}

export interface CRMActivityPaginatedResponse {
	items: CRMActivityLog[];
	total: number;
}
