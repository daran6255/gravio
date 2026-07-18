import type { StageItem } from '../components/common/kanban/StageManagementDialog';

export interface ProjectStagePreset {
	category: string;
	stages: StageItem[];
}

const stage = (
	name: string,
	color: string,
	order: number,
	opts?: { initial?: boolean; done?: boolean },
): StageItem => ({
	name,
	color,
	order,
	is_initial_status: !!opts?.initial,
	is_done_status: !!opts?.done,
});

/** One suggested default stage list per project template category — loaded into the
 *  Manage Stages editor as a starting point, not applied automatically. */
export const PROJECT_STAGE_PRESETS: ProjectStagePreset[] = [
	{
		category: 'Software',
		stages: [
			stage('Backlog', '#9E9E9E', 0, { initial: true }),
			stage('Design', '#EC4899', 1),
			stage('In Development', '#8B7CF6', 2),
			stage('Code Review', '#4EA8FF', 3),
			stage('QA Testing', '#EF4444', 4),
			stage('Deployed', '#10B981', 5, { done: true }),
		],
	},
	{
		category: 'Construction',
		stages: [
			stage('Permits & Planning', '#9E9E9E', 0, { initial: true }),
			stage('Site Preparation', '#F59E0B', 1),
			stage('Foundation', '#64748B', 2),
			stage('Structural Build', '#8B7CF6', 3),
			stage('Finishing', '#EC4899', 4),
			stage('Handover', '#10B981', 5, { done: true }),
		],
	},
	{
		category: 'Pharma',
		stages: [
			stage('Protocol Development', '#9E9E9E', 0, { initial: true }),
			stage('Regulatory Submission', '#EF4444', 1),
			stage('Site & Recruitment', '#4EA8FF', 2),
			stage('Trial Execution', '#F59E0B', 3),
			stage('Data Analysis', '#8B7CF6', 4),
			stage('Reported', '#10B981', 5, { done: true }),
		],
	},
	{
		category: 'Manufacturing',
		stages: [
			stage('Design & Planning', '#9E9E9E', 0, { initial: true }),
			stage('Procurement', '#F59E0B', 1),
			stage('Installation', '#8B7CF6', 2),
			stage('Calibration & Testing', '#EF4444', 3),
			stage('Trial Run', '#4EA8FF', 4),
			stage('In Production', '#10B981', 5, { done: true }),
		],
	},
	{
		category: 'Marketing',
		stages: [
			stage('Planning', '#9E9E9E', 0, { initial: true }),
			stage('Content Creation', '#EC4899', 1),
			stage('Review & Approval', '#F59E0B', 2),
			stage('Campaign Live', '#4EA8FF', 3),
			stage('Monitoring', '#8B7CF6', 4),
			stage('Completed', '#10B981', 5, { done: true }),
		],
	},
	{
		category: 'Sales',
		stages: [
			stage('Planning', '#9E9E9E', 0, { initial: true }),
			stage('In Progress', '#4EA8FF', 1),
			stage('Client Review', '#F59E0B', 2),
			stage('Delivery', '#8B7CF6', 3),
			stage('Closed Won', '#10B981', 4, { done: true }),
		],
	},
	{
		category: 'HR',
		stages: [
			stage('Planning', '#9E9E9E', 0, { initial: true }),
			stage('Setup', '#4EA8FF', 1),
			stage('Implementation', '#8B7CF6', 2),
			stage('Review', '#F59E0B', 3),
			stage('Completed', '#10B981', 4, { done: true }),
		],
	},
];
