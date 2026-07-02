export type LeadSource = 'website' | 'referral' | 'cold_call' | 'linkedin' | 'ad' | 'event' | 'other';
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'unqualified' | 'converted';
export type LeadPriority = 'low' | 'medium' | 'high' | 'urgent';

/** Matches backend's CRMLeadResponse exactly. */
export interface Lead {
	id: number;
	public_id: string;
	title: string;
	contact_id?: number;
	company_id?: number;
	source?: LeadSource;
	status: LeadStatus;
	priority: LeadPriority;
	owner_id?: number;
	estimated_value?: number;
	currency: string;
	description?: string;
	converted_at?: string;
	deal_id?: number;
	tags?: string[];
	custom_fields?: Record<string, any>;
	version: number;
	last_activity_at?: string;
	is_anonymized: boolean;
	created_at: string;
	updated_at: string;
	/** Populated server-side only when `currency` differs from the viewer's preferred display
	 * currency — the value converted using the exchange rate on `created_at`'s date. */
	display_value?: number;
	display_currency?: string;
	display_rate?: number;
}

/** Matches backend's CRMLeadCreateResponse - returned only from POST /leads. */
export interface LeadCreateResponse extends Lead {
	duplicate_warning?: string;
}

/** Matches backend's CRMLeadCreate. */
export interface LeadCreate {
	title: string;
	contact_id?: number;
	company_id?: number;
	source?: LeadSource;
	status?: LeadStatus;
	priority?: LeadPriority;
	owner_id?: number;
	estimated_value?: number;
	currency?: string;
	description?: string;
	tags?: string[];
	custom_fields?: Record<string, any>;
}

export interface LeadUpdate extends Partial<LeadCreate> {
	/** Client's last-seen version, for optimistic locking. Omit to skip the conflict check. */
	version?: number;
}

/** Matches backend's CRMLeadConvertRequest. */
export interface LeadConvertRequest {
	pipeline_id: number;
	stage_id: number;
	deal_title?: string;
	value?: number;
	close_date?: string;
}

/** Matches backend's AuditLogResponse. */
export interface LeadHistoryEntry {
	id: number;
	action: string;
	field_name?: string;
	old_value?: string;
	new_value?: string;
	changed_by_user_id?: number;
	changed_at: string;
}

/** Matches backend's CRMLeadImportRowResult. */
export interface LeadImportRowResult {
	row_number: number;
	success: boolean;
	lead_public_id?: string;
	error?: string;
	duplicate_warning?: string;
}

/** Matches backend's CRMLeadImportResponse. */
export interface LeadImportResponse {
	total_rows: number;
	success_count: number;
	failure_count: number;
	results: LeadImportRowResult[];
}
