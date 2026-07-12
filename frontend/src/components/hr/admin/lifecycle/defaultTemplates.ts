import type { ChecklistType } from '../../../../models/hr';

export interface DefaultChecklistTemplate {
	name: string;
	checklist_type: ChecklistType;
	tasks: Array<{ id: string; title: string; role_required: string; due_days?: number }>;
}

/** Starter templates shown so users have a concrete example to model their own checklists on. */
export const DEFAULT_CHECKLIST_TEMPLATES: DefaultChecklistTemplate[] = [
	{
		name: 'Standard Onboarding',
		checklist_type: 'onboarding',
		tasks: [
			{ id: 'ob_1', title: 'Sign offer letter & documents', role_required: 'hr_admin', due_days: 1 },
			{ id: 'ob_2', title: 'Complete IT equipment setup', role_required: 'hr_manager', due_days: 3 },
			{ id: 'ob_3', title: 'Submit bank & tax details', role_required: 'hr_admin', due_days: 5 },
			{ id: 'ob_4', title: 'Complete orientation session', role_required: 'manager', due_days: 7 },
			{ id: 'ob_5', title: 'Assign onboarding buddy & team intro', role_required: 'manager', due_days: 7 },
		],
	},
	{
		name: 'Standard Offboarding',
		checklist_type: 'offboarding',
		tasks: [
			{ id: 'off_1', title: 'Acknowledge resignation / exit notice', role_required: 'hr_admin', due_days: 1 },
			{ id: 'off_2', title: 'Knowledge transfer & handover', role_required: 'manager', due_days: 7 },
			{ id: 'off_3', title: 'Return company assets (laptop, ID card)', role_required: 'hr_manager', due_days: 10 },
			{ id: 'off_4', title: 'Revoke system access & accounts', role_required: 'admin', due_days: 10 },
			{ id: 'off_5', title: 'Conduct exit interview', role_required: 'hr_manager', due_days: 12 },
			{ id: 'off_6', title: 'Process final settlement', role_required: 'hr_admin', due_days: 15 },
		],
	},
];
