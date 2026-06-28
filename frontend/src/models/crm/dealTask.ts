export type DealTaskStatus = 'pending' | 'in_progress' | 'completed';
export type DealTaskType = 'document' | 'meeting' | 'call' | 'action' | 'review' | 'other';

export interface DealTask {
	id: number;
	public_id: string;
	deal_id: number;
	title: string;
	task_type: DealTaskType;
	status: DealTaskStatus;
	due_date?: string;
	notes?: string;
	assignee_id?: number;
	completed_at?: string;
	order: number;
	created_at: string;
	updated_at: string;
}

export interface DealTaskCreate {
	title: string;
	task_type?: DealTaskType;
	due_date?: string;
	notes?: string;
	assignee_id?: number;
	order?: number;
}

export interface DealTaskUpdate {
	title?: string;
	task_type?: DealTaskType;
	status?: DealTaskStatus;
	due_date?: string;
	notes?: string;
	assignee_id?: number;
	order?: number;
}
