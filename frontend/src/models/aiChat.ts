export interface AIChatMessage {
	id: number;
	session_id: number;
	role: 'user' | 'assistant' | 'system';
	content: string;
	task_log_id: number | null;
	created_at: string;
}

export interface AIChatSession {
	id: number;
	public_id: string;
	title: string;
	user_id: number;
	is_active: boolean;
	created_at: string;
}

export interface AIChatSessionDetail extends AIChatSession {
	messages: AIChatMessage[];
}

export type AIStreamEvent =
	| { status: 'planning' | 'typing'; message?: string }
	| { status: 'executing'; message: string }
	| { token: string }
	| { status: 'completed'; summary: string; task_db_id: number | null }
	| { error: string; status: 'failed' }
	| { session_title_update: string; session_id: number };
