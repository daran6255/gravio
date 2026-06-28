import type { Organization } from '../models/auth';

/** Mirrors the backend's require_paid_plan: trial orgs get full access to evaluate the
 * product, so only orgs settled on the Free tier (or with no plan and no active trial)
 * are considered free. */
export function isFreeTier(organization: Organization | null | undefined): boolean {
	if (!organization) return true;
	if (organization.subscription_status === 'trial') return false;
	return (organization.plan?.tier || 'free') === 'free';
}
