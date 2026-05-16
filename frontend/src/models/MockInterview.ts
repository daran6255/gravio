export interface Question {
	question: string;
	answer: string;
}

export interface Skill {
	skill: string;
	level: string; // e.g., Beginner, Intermediate, Expert
	rating: number; // 0-10
}

export interface MockInterview {
	id: number;
	batch_id: number;
	candidate_id: number;
	interviewer_name?: string;
	interview_date: string;
	questions?: Question[];
	skills?: Skill[];
	feedback?: string;
	overall_rating?: number;
	status: 'pending' | 'cleared' | 're-test' | 'rejected' | 'absent';
	interview_type?: 'internal' | 'external';
	interview_category?: 'hr' | 'domain';
	start_time?: string;
	end_time?: string;
	duration_minutes?: number;
	candidate_token?: string;
	candidate_submitted_at?: string;
	interviewer_id?: number;
	created_at: string;
	updated_at: string;
	candidate?: {
		id: number;
		public_id: string;
		name: string;
		documents?: import('./candidate').CandidateDocument[];
	};
	batch?: {
		id: number;
		public_id: string;
		batch_name: string;
	};
}

export interface MockInterviewCreate {
	batch_id: number;
	candidate_id: number;
	interviewer_name?: string;
	interview_date: string;
	interview_type?: 'internal' | 'external';
	interview_category?: 'hr' | 'domain';
	questions?: Question[];
	skills?: Skill[];
	feedback?: string;
	overall_rating?: number;
	status?: string;
	start_time?: string;
	end_time?: string;
	duration_minutes?: number;
	candidate_token?: string;
	candidate_submitted_at?: string;
	interviewer_id?: number;
}

export interface MockInterviewUpdate {
	interviewer_name?: string;
	interview_date?: string;
	interview_type?: 'internal' | 'external';
	interview_category?: 'hr' | 'domain';
	questions?: Question[];
	skills?: Skill[];
	feedback?: string;
	overall_rating?: number;
	status?: string;
	candidate_token?: string;
	interviewer_id?: number;
}
