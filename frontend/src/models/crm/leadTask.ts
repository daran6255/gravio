// Mirrors dealTask.ts exactly — the backend reuses the same task_type/status/priority enums.
export type LeadTaskStatus = 'pending' | 'in_progress' | 'blocked' | 'completed';
export type LeadTaskType = 'document' | 'meeting' | 'call' | 'action' | 'review' | 'other';
export type LeadTaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface LeadTask {
	id: number;
	public_id: string;
	lead_id: number;
	title: string;
	task_type: LeadTaskType;
	status: LeadTaskStatus;
	priority: LeadTaskPriority;
	due_date?: string;
	notes?: string;
	assignee_id?: number;
	completed_at?: string;
	order: number;
	created_at: string;
	updated_at: string;
}

export interface LeadTaskCreate {
	title: string;
	task_type?: LeadTaskType;
	priority?: LeadTaskPriority;
	due_date?: string;
	notes?: string;
	assignee_id?: number;
	order?: number;
}

export interface LeadTaskUpdate {
	title?: string;
	task_type?: LeadTaskType;
	status?: LeadTaskStatus;
	priority?: LeadTaskPriority;
	due_date?: string;
	notes?: string;
	assignee_id?: number;
	order?: number;
}
