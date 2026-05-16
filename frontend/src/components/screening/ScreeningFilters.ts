import type { FilterField } from '../common/drawer/FilterDrawer';

export const getScreeningFilterFields = (
	type: 'unscreened' | 'screened',
	status: string | undefined,
	filterOptions: {
		disability_types: string[];
		education_levels: string[];
		cities: string[];
		counseling_statuses: string[];
		screening_statuses: string[];
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
			key: 'counseling_status',
			label: 'Counseling Status',
			type: 'single-select',
			options: (filterOptions.counseling_statuses || []).map(val => ({ value: val, label: val }))
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

	if (!status && type !== 'unscreened') {
		fields.push({
			key: 'screening_status',
			label: 'Screening Status',
			type: 'single-select',
			options: (filterOptions.screening_statuses || []).map(val => ({ value: val, label: val }))
		});
	}

	return fields;
};
