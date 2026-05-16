import type { FilterField } from '../../common/drawer/FilterDrawer';
import { disabilityTypes } from '../../../data/Disabilities';

export const BATCH_STATUS_OPTIONS = [
	{ value: 'planned', label: 'Planned' },
	{ value: 'running', label: 'Running' },
	{ value: 'closed', label: 'Closed' }
];

export const getBatchFilterFields = (): FilterField[] => [
	{
		key: 'status',
		label: 'Operational Status',
		type: 'single-select',
		options: BATCH_STATUS_OPTIONS
	},
	{
		key: 'disability_types',
		label: 'Candidate Disability',
		type: 'multi-select',
		options: disabilityTypes.map(type => ({ value: type, label: type }))
	}
];
