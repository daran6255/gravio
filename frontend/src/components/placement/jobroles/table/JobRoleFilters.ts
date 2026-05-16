import type { FilterField } from '../../../common/drawer/FilterDrawer';
import { JOB_ROLE_STATUS } from '../../../../models/jobRole';

export const getJobRoleFilterFields = (): FilterField[] => [
	{
		key: 'status',
		label: 'Status',
		type: 'single-select',
		options: [
			{ value: JOB_ROLE_STATUS.ACTIVE, label: 'Active' },
			{ value: JOB_ROLE_STATUS.INACTIVE, label: 'Inactive' },
			{ value: JOB_ROLE_STATUS.CLOSED, label: 'Closed' }
		]
	},
	{
		key: 'workplace_type',
		label: 'Workplace Type',
		type: 'multi-select',
		options: [
			{ value: 'Hybrid', label: 'Hybrid' },
			{ value: 'Onsite', label: 'Onsite' },
			{ value: 'Remote', label: 'Remote' }
		]
	},
	{
		key: 'job_type',
		label: 'Job Type',
		type: 'multi-select',
		options: [
			{ value: 'Permanent', label: 'Permanent' },
			{ value: 'Contract', label: 'Contract' },
			{ value: 'Full Time', label: 'Full Time' },
			{ value: 'Internship', label: 'Internship' }
		]
	}
];
