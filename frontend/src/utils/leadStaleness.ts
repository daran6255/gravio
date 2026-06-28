import type { Lead } from '../models/crm/lead';

const STALE_STATUSES = new Set(['new', 'contacted', 'qualified']);

/** Mirrors the backend's stale-lead rule (LEAD_STALE_DAYS, default 14): an open lead
 * with no logged activity newer than the threshold, measured from last_activity_at
 * or, if there's never been any activity, from created_at. */
export function isLeadStale(lead: Lead, staleDays = 14): boolean {
	if (!STALE_STATUSES.has(lead.status)) return false;
	const referenceDate = lead.last_activity_at || lead.created_at;
	if (!referenceDate) return false;
	const ageMs = Date.now() - new Date(referenceDate).getTime();
	return ageMs > staleDays * 24 * 60 * 60 * 1000;
}
