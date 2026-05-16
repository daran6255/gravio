export type JobRoleStatus = 'active' | 'inactive' | 'closed';
import type { Contact } from './contact';

export const JOB_ROLE_STATUS: Record<string, JobRoleStatus> = {
	ACTIVE: 'active',
	INACTIVE: 'inactive',
	CLOSED: 'closed'
};

export interface JobRole {
	id: number;
	public_id: string;
	title: string;
	description?: string;
	status: JobRoleStatus;
	is_visible: boolean;
	no_of_vacancies?: number;
	close_date?: string;
	company_id: number;
	contact_id: number;
	created_by_id?: number;
	location?: {
		cities: string[];
		states?: string[];
		country?: string;
	};
	salary_range?: {
		min?: number;
		max?: number;
		currency?: string;
	};
	experience?: {
		min?: number;
		max?: number;
	};
	requirements?: {
		skills?: string[];
		qualifications?: string[];
		disability_preferred?: string[];
	};
	job_details?: {
		designation?: string;
		workplace_type?: string; // hybrid, onsite, remote
		job_type?: string; // permanent, contract, full time, internship
	};
	other?: any;
	pipeline_stages?: {
		id: string;
		label: string;
		category: 'lead' | 'shortlisted' | 'interview' | 'offer' | 'hired' | 'rejected' | 'not_joined';
	}[];
	created_at: string;
	updated_at: string;
	company?: {
		id: number;
		public_id: string;
		name: string;
	};
	contact?: Contact;
	creator?: {
		id: number;
		public_id: string;
		full_name?: string;
		username: string;
	};
	mappings_count?: number;
	status_reason?: string;
	deletion_reason?: string;
}

export interface JobRoleCreate extends Omit<JobRole, 'id' | 'public_id' | 'created_at' | 'updated_at' | 'company' | 'contact' | 'creator'> { }
export interface JobRoleUpdate extends Partial<JobRoleCreate> { }

export interface JobRolePaginatedResponse {
	items: JobRole[];
	total: number;
}
