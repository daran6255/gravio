export type CRMActivityType = 'note' | 'call' | 'email' | 'meeting' | 'task' | 'whatsapp';
export type CRMActivityEntityType = 'lead' | 'deal' | 'company' | 'contact';

/** Matches backend's CRMActivityResponse exactly. */
export interface CRMActivity {
	id: number;
	public_id: string;
	type: CRMActivityType;
	subject: string;
	description?: string;
	entity_type: CRMActivityEntityType;
	entity_id: number;
	owner_id?: number;
	due_date?: string;
	completed_at?: string;
	is_completed: boolean;
	outcome?: string;
	custom_fields?: Record<string, any>;
	created_at: string;
	updated_at: string;
}

/** Matches backend's CRMActivityCreate. */
export interface CRMActivityCreate {
	type: CRMActivityType;
	subject: string;
	description?: string;
	entity_type: CRMActivityEntityType;
	entity_id: number;
	owner_id?: number;
	due_date?: string;
	is_completed?: boolean;
	outcome?: string;
	custom_fields?: Record<string, any>;
}

export interface CRMActivityUpdate {
	type?: CRMActivityType;
	subject?: string;
	description?: string;
	due_date?: string;
	completed_at?: string;
	is_completed?: boolean;
	outcome?: string;
	owner_id?: number;
	custom_fields?: Record<string, any>;
}
