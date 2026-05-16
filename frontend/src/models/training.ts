export interface TrainingBatch {
	id: number;
	public_id: string;
	batch_name: string;
	disability_types: string[];
	start_date?: string;
	approx_close_date?: string;
	total_extension_days?: number;
	courses: (string | { name: string; trainer: string })[] | null;
	duration?: {
		start_date: string;
		end_date: string;
		weeks: number;
		days: number;
	} | null;
	status: 'planned' | 'running' | 'closed' | string;
	domain?: string;
	training_mode?: string;
	other: any;
	created_at: string;
	updated_at: string;
	extensions?: TrainingBatchExtension[];
}

export interface TrainingBatchExtension {
	id: number;
	public_id: string;
	batch_id: number;
	previous_close_date: string;
	new_close_date: string;
	extension_days: number;
	reason: string | null;
	created_at: string;
}

export interface CandidateAllocation {
	id: number;
	public_id: string;
	batch_id: number;
	candidate_id: number;
	status: 'allocated' | 'in_training' | 'completed' | 'dropped_out' | 'moved_to_placement' | string;
	is_dropout: boolean;
	dropout_remark: string | null;
	others: any;
	created_at: string;
	updated_at: string;
	batch?: TrainingBatch;
	candidate?: {
		public_id: string;
		name: string;
		email: string;
		phone: string;
		gender?: string;
		disability_details?: {
			disability_type?: string;
			type?: string;
			[key: string]: any;
		};
		education_details?: {
			qualification?: string;
			[key: string]: any;
		};
		documents?: import('./candidate').CandidateDocument[];
	};
}

export interface TrainingStats {
	total: number;
	running: number;
	completed: number;
	planned: number;
	total_selected: number;
	in_training: number;
	completed_training: number;
	completed_candidates: number;
	moved_to_placement: number;
	ready_for_training: number;
	dropped_out: number;
	women: number;
}

export interface TrainingAttendance {
	id?: number;
	batch_id: number;
	candidate_id: number;
	date: string;
	period_id?: number | null;  // Reference to training plan period (NULL = full day attendance)
	status: 'present' | 'absent' | 'late' | 'half_day';
	remarks: string | null;
	trainer_notes?: string | null;  // Period-specific trainer observations
	batch?: TrainingBatch; // Eager loaded batch info
	period?: TrainingBatchPlan;  // Eager loaded period info
	candidate?: CandidateAllocation['candidate']; // Eager loaded candidate info
}

export interface TrainingBatchEvent {
	id?: number;
	batch_id: number;
	date: string;
	event_type: 'holiday' | 'event';
	title: string;
	description: string | null;
}

export interface TrainingAssignment {
	id?: number;
	batch_id: number;
	candidate_id: number;
	assignment_name: string;
	description?: string;
	course_name?: string[];
	course_marks?: Record<string, number>;
	trainer_id?: number;
	marks_obtained: number;
	max_marks: number;
	assignment_date: string;
	submission_date?: string;
	others?: any;
	batch?: TrainingBatch; // Eager loaded batch info
}

export interface TrainingMockInterview {
	id?: number;
	batch_id: number;
	candidate_id: number;
	interviewer_name: string | null;
	interview_date: string;
	questions: { question: string; answer: string }[] | null;
	skills?: { skill: string; level: string; rating: number }[] | null;
	feedback: string | null;
	overall_rating: number | null;
	status: 'pending' | 'cleared' | 're-test' | 'rejected' | 'absent' | string;
	interview_type?: 'internal' | 'external';
	interview_category?: 'hr' | 'domain';
	start_time?: string;
	end_time?: string;
	duration_minutes?: number;
	candidate_token?: string;
	interviewer_id?: number;
	batch?: TrainingBatch; // Eager loaded batch info
	candidate?: CandidateAllocation['candidate']; // Eager loaded candidate info
}

export interface TrainingBatchPlan {
	id: number;
	public_id: string;
	batch_id: number;
	date: string;
	start_time: string;
	end_time: string;
	activity_type: 'course' | 'break' | 'event' | 'interview' | 'other' | string;
	activity_name: string;
	trainer?: string | null;
	trainer_user_id?: number | null;
	trainer_user_public_id?: string | null;
	trainer_user?: {
		id: number;
		public_id: string;
		full_name?: string;
		email: string;
	} | null;
	notes?: string | null;
	others?: any;
	created_at: string;
	updated_at: string;
}

export interface Course {
	name: string;
	trainer: string;
}

export interface Assessment {
	id?: number;
	public_id?: string;
	batch_id: number;
	title: string;
	description?: string;
	duration_minutes: number;
	security_key?: string;
	is_active: boolean;
	pass_percentage: number;
	include_seb: boolean;
	seb_config_key?: string;
	others?: any;
	questions?: AssessmentQuestion[];
	created_at?: string;
	updated_at?: string;
}

export interface AssessmentQuestion {
	id?: number;
	assessment_id?: number;
	text: string;
	type: 'MCQ' | 'TF';
	options?: string[] | any;
	correct_answer: string;
	marks: number;
	others?: any;
}

export interface AssessmentResult {
	id?: number;
	assessment_id: number;
	candidate_id: number;
	candidate_name?: string;
	candidate_email?: string;
	total_score: number;
	started_at: string;
	submitted_at?: string;
	status: 'InProgress' | 'Completed';
	others?: any;
	responses?: AssessmentResponse[];
	candidate?: any;
	assessment?: Assessment;
}

export interface AssessmentResponse {
	id?: number;
	result_id?: number;
	question_id: number;
	selected_answer: string | null;
	is_correct: boolean;
	others?: any;
}
