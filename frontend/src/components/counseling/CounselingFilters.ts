import type { FilterField } from '../common/drawer/FilterDrawer';

export const getCounselingFilterFields = (
	type: 'not_counseled' | 'pending' | 'selected' | 'rejected' | 'counseled',
	filterOptions: {
		disability_types: string[];
		education_levels: string[];
		cities: string[];
		counseling_statuses: string[];
	}
): FilterField[] => {
	const fields: FilterField[] = [
		{
			key: 'disability_types',
			label: 'Disability Type',
			type: 'multi-select',
			options: (filterOptions.disability_types || []).map(val => ({ value: val, label: val }))
		},
		{
			key: 'education_levels',
			label: 'Education Level',
			type: 'multi-select',
			options: (filterOptions.education_levels || []).map(val => ({ value: val, label: val }))
		},
		{
			key: 'cities',
			label: 'City',
			type: 'multi-select',
			options: (filterOptions.cities || []).map(val => ({ value: val, label: val }))
		},
		{
			key: 'is_experienced',
			label: 'Work Experience',
			type: 'single-select',
			options: [
				{ value: 'false', label: 'Fresher' },
				{ value: 'true', label: 'Experienced' }
			]
		}
	];

	// Add counseling status filter only for 'counseled' tab
	if (type === 'counseled') {
		fields.push({
			key: 'counseling_status',
			label: 'Counseling Status',
			type: 'single-select',
			options: [
				{ value: 'selected', label: 'Selected' },
				{ value: 'rejected', label: 'Rejected' }
			]
		});
	}

	return fields;
};
