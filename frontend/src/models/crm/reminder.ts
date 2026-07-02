export type ReminderEntityType = 'lead' | 'deal' | 'deal_task' | 'activity';
export type ReminderStatus = 'pending' | 'sent' | 'cancelled';

export interface Reminder {
	id: number;
	public_id: string;
	entity_type: ReminderEntityType;
	entity_id: number;
	user_id: number;
	created_by_id?: number;
	remind_at: string;
	message?: string;
	status: ReminderStatus;
	sent_at?: string;
	created_at: string;
	updated_at: string;
}

export interface ReminderCreate {
	entity_type: ReminderEntityType;
	entity_id: number;
	remind_at: string;
	message?: string;
	user_id?: number;
}

export interface ReminderUpdate {
	remind_at?: string;
	message?: string;
	status?: ReminderStatus;
}
