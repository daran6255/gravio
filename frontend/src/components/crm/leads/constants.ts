import type { LeadSource, LeadStatus, LeadPriority } from '../../../models/crm/lead';

export const LEAD_STATUSES: LeadStatus[] = ['new', 'contacted', 'qualified', 'unqualified', 'converted'];
export const LEAD_SOURCES: LeadSource[] = ['website', 'referral', 'cold_call', 'linkedin', 'ad', 'event', 'other'];
export const LEAD_PRIORITIES: LeadPriority[] = ['low', 'medium', 'high', 'urgent'];
