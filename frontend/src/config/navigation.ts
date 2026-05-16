import {
	Home as HomeIcon,
	ManageAccounts as UserIcon,
	// Business as BusinessIcon,
	Group as CandidatesIcon,
	School as SchoolIcon,
	Assessment as AssessmentIcon,
	Settings as SettingsIcon,
	HelpOutline as HelpIcon,
	Folder as ProjectIcon,
	Work as PlacementIcon,
	Assignment as ScreeningIcon,
	FactCheck as CounselingIcon,
	SmartToy as AIIcon,
	Email as EmailIcon,
	Psychology as SkillsIcon,
} from '@mui/icons-material';
import type { SvgIconComponent } from '@mui/icons-material';

export interface NavigationItem {
	label?: string;
	path?: string;
	icon?: SvgIconComponent;
	roles?: string[];
	children?: NavigationItem[];
	divider?: boolean;
}

export const topNavigation: NavigationItem[] = [
	{
		label: 'Home',
		path: '/dashboard',
		icon: HomeIcon,
	},
	{
		label: 'User Management',
		path: '/users',
		icon: UserIcon,
		roles: ['admin'],
	},
	{
		label: 'Timesheet Management',
		icon: ProjectIcon,
		roles: ['admin', 'manager', 'trainer', 'sourcing', 'project_coordinator', 'developer', 'placement', 'marketing'],
		children: [
			{
				label: 'Projects',
				path: '/projects',
				roles: ['admin', 'manager']
			},
			{
				label: 'Activities',
				path: '/projects/activities',
				roles: ['admin', 'manager']
			},
			{
				label: 'Timesheet',
				path: '/projects/timesheet',
				roles: ['admin', 'manager', 'trainer', 'sourcing', 'project_coordinator', 'developer', 'placement', 'marketing']
			},
		],
	},
	// {
	// 	label: 'CRM Management',
	// 	icon: BusinessIcon,
	// 	roles: ['admin', 'manager', 'marketing', 'placement'],
	// 	children: [
	// 		{ label: 'Companies', path: '/crm/companies', roles: ['admin', 'manager', 'marketing', 'placement'] },
	// 		{ label: 'Contacts', path: '/crm/contacts', roles: ['admin', 'manager', 'marketing', 'placement'] },
	// 		{ label: 'Leads', path: '/crm/leads', roles: ['admin', 'manager', 'marketing', 'placement'] },
	// 		{ label: 'Deals', path: '/crm/deals', roles: ['admin', 'manager', 'marketing', 'placement'] },
	// 		{ label: 'Tasks', path: '/crm/tasks', roles: ['admin', 'manager', 'marketing', 'placement'] },
	// 	],
	// },
	{
		label: 'Candidate Management',
		icon: CandidatesIcon,
		roles: ['admin', 'manager', 'sourcing', 'trainer', 'counselor', 'placement'],
		children: [
			{
				label: 'All Candidates',
				path: '/candidates',
				roles: ['admin', 'manager', 'sourcing', 'placement', 'trainer', 'counselor']
			},
			{
				label: 'Screening',
				path: '/candidates/screening',
				roles: ['admin', 'manager', 'sourcing']
			},
			{
				label: 'Counseling',
				path: '/candidates/counseling',
				roles: ['admin', 'manager', 'trainer', 'counselor']
			},
			{
				label: 'Document Collection',
				path: '/candidates/documents',
				roles: ['admin', 'manager', 'sourcing', 'trainer', 'placement']
			},
		],
	},
	{
		label: 'Training Management',
		icon: SchoolIcon,
		roles: ['admin', 'manager', 'trainer', 'project_coordinator'],
		children: [
			{ label: 'Training Batch', path: '/training/batches', roles: ['admin', 'manager', 'sourcing', 'trainer', 'placement'] },
			{ label: 'Weekly Training Plan', path: '/training/weekly-plan', roles: ['admin', 'manager', 'trainer', 'placement'] },
			{ label: 'Candidate Allocation', path: '/training/allocation', roles: ['admin', 'manager', 'trainer', 'placement'] },
			{ label: 'Attendance', path: '/training/attendance', roles: ['admin', 'manager', 'trainer', 'placement'] },
			// { label: 'Mock Interview', path: '/training/mock-interview', roles: ['admin', 'manager', 'trainer', 'placement'] },
		],
	},
	{
		label: 'Placement Management',
		icon: PlacementIcon,
		roles: ['admin', 'manager', 'placement'],
		children: [
			{ label: 'Job Roles', path: '/placement/job-roles', roles: ['admin', 'manager', 'placement'] },
		],
	},
];

export const bottomNavigation: NavigationItem[] = [
	{
		label: 'Reports',
		path: '/reports',
		icon: AssessmentIcon,
	},
	{
		label: 'Settings',
		path: '/settings',
		icon: SettingsIcon,
		roles: ['admin'],
	},
	{
		label: 'Help and Support',
		path: '/support',
		icon: HelpIcon,
	},
];

export const settingsTabs = [
	{ label: 'Screening Fields', icon: ScreeningIcon },
	{ label: 'Counseling Fields', icon: CounselingIcon },
	{ label: 'Training Config', icon: SchoolIcon },
	{ label: 'AI Engine', icon: AIIcon },
	{ label: 'Email Configuration', icon: EmailIcon },
	{ label: 'Skills', icon: SkillsIcon },
];
