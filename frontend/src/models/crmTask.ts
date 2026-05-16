export type CRMTaskType = 'call' | 'email' | 'meeting' | 'follow_up' | 'demo' | 'proposal' | 'other';
export type CRMTaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type CRMTaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type CRMRelatedToType = 'lead' | 'deal' | 'company' | 'contact';

export interface CRMTask {
	id: number;
	public_id: string;
	title: string;
	description?: string;
	task_type: CRMTaskType;
	priority: CRMTaskPriority;
	status: CRMTaskStatus;
	assigned_to: number;
	created_by: number;
	related_to_type?: CRMRelatedToType;
	related_to_id?: number;
	due_date: string;
	completed_date?: string;
	is_reminder_sent: boolean;
	reminder_before_minutes: number;
	outcome?: Record<string, any>;
	attachments?: any[];
	custom_fields?: Record<string, any>;
	created_at: string;
	updated_at: string;
	assigned_user?: any;
	creator?: any;
}

export interface CRMTaskCreate extends Omit<CRMTask, 'public_id' | 'created_at' | 'updated_at' | 'assigned_user' | 'creator' | 'completed_date' | 'is_reminder_sent' | 'created_by'> { }
export interface CRMTaskUpdate extends Partial<CRMTaskCreate> {
	completed_date?: string;
	is_reminder_sent?: boolean;
}

export interface CRMTaskPaginatedResponse {
	items: CRMTask[];
	total: number;
}
