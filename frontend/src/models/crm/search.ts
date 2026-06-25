import type { Company } from './company';
import type { Contact } from './contact';
import type { Lead } from './lead';
import type { Deal } from './deal';

/** Matches backend's CRMSearchResponse exactly. */
export interface CRMSearchResults {
	companies: Company[];
	contacts: Contact[];
	leads: Lead[];
	deals: Deal[];
}
