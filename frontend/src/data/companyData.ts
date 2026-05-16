import type { CompanySize, CompanyStatus } from '../models/company';

export const COMPANY_SIZES: { value: CompanySize; label: string }[] = [
	{ value: 'micro', label: 'Micro (1-10)' },
	{ value: 'small', label: 'Small (11-50)' },
	{ value: 'medium', label: 'Medium (51-250)' },
	{ value: 'large', label: 'Large (251-1000)' },
	{ value: 'enterprise', label: 'Enterprise (1000+)' }
];

export const COMPANY_STATUSES: { value: CompanyStatus; label: string }[] = [
	{ value: 'active', label: 'Active' },
	{ value: 'inactive', label: 'Inactive' },
	{ value: 'prospect', label: 'Prospect' },
	{ value: 'customer', label: 'Customer' }
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
