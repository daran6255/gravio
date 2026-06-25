import type { CompanySize, CompanyStatus } from '../models/crm/company';

export const COMPANY_SIZES: { value: CompanySize; label: string }[] = [
	{ value: 'startup', label: 'Startup (1-10)' },
	{ value: 'small', label: 'Small (11-50)' },
	{ value: 'medium', label: 'Medium (51-250)' },
	{ value: 'enterprise', label: 'Enterprise (250+)' }
];

export const COMPANY_STATUSES: { value: CompanyStatus; label: string }[] = [
	{ value: 'prospect', label: 'Prospect' },
	{ value: 'customer', label: 'Customer' },
	{ value: 'churned', label: 'Churned' },
	{ value: 'partner', label: 'Partner' }
];

export const COMPANY_INDUSTRIES = [
	'Aerospace',
	'Agriculture',
	'Automotive',
	'Banking & Finance',
	'Construction',
	'Education',
	'Energy & Utilities',
	'Entertainment',
	'Food & Beverage',
	'Government',
	'Healthcare',
	'Hospitality',
	'Information Technology',
	'Manufacturing',
	'Media & Communications',
	'Pharmaceuticals',
	'Real Estate',
	'Retail',
	'Telecommunications',
	'Transportation & Logistics',
	'Other'
];
