import {
	HubOutlined as CrmIcon,
	GroupsOutlined as HrIcon,
	AssignmentTurnedInOutlined as ProjectIcon,
	ScheduleOutlined as TimesheetIcon,
	VerifiedUserOutlined as SecurityIcon,
	AdminPanelSettingsOutlined as AccessIcon,
	BoltOutlined as UptimeIcon,
	SupportAgentOutlined as SupportIcon,
} from '@mui/icons-material';
import type { SvgIconComponent } from '@mui/icons-material';

export type AuthBrandVariant = 'login' | 'register' | 'success' | 'forgot';

export interface AuthPanelFeature {
	icon: SvgIconComponent;
	title: string;
	description: string;
}

export interface AuthPanelStep {
	label: string;
	description: string;
	status: 'done' | 'current' | 'upcoming';
}

export interface AuthPanelCopy {
	title: string;
	description: string;
	features?: AuthPanelFeature[];
	steps?: AuthPanelStep[];
}

const registerFeatures: AuthPanelFeature[] = [
	{
		icon: CrmIcon,
		title: 'CRM & Deal Pipelines',
		description: 'Track leads, companies and deals in one shared view.',
	},
	{
		icon: HrIcon,
		title: 'HR & Payroll',
		description: 'Run payroll, manage leave and onboard employees with ease.',
	},
	{
		icon: ProjectIcon,
		title: 'Projects & Tasks',
		description: 'Plan work and keep every team aligned on delivery.',
	},
	{
		icon: TimesheetIcon,
		title: 'Timesheets & Attendance',
		description: 'Capture hours and attendance without the spreadsheets.',
	},
];

const loginHighlights: AuthPanelFeature[] = [
	{
		icon: SecurityIcon,
		title: 'Enterprise-grade security',
		description: 'Your data stays encrypted in transit and at rest, always.',
	},
	{
		icon: AccessIcon,
		title: 'Role-based access',
		description: 'Every teammate gets exactly the permissions they need.',
	},
	{
		icon: UptimeIcon,
		title: '99.9% uptime',
		description: 'Reliable infrastructure that keeps your team moving.',
	},
	{
		icon: SupportIcon,
		title: 'Real, human support',
		description: "We're on hand whenever something needs a second pair of eyes.",
	},
];

const successSteps: AuthPanelStep[] = [
	{
		label: 'Account created',
		description: 'Your workspace has been set up and is ready to go.',
		status: 'done',
	},
	{
		label: 'Verify your email',
		description: 'Confirm your address using the link we just sent you.',
		status: 'current',
	},
	{
		label: 'Log in & get started',
		description: 'Jump straight into your new workspace.',
		status: 'upcoming',
	},
];

export const authPanelContent: Record<AuthBrandVariant, AuthPanelCopy> = {
	register: {
		title: 'Run your entire business from one workspace.',
		description:
			'Gravit brings CRM, HR, payroll, projects and timesheets together, so growing teams stop switching between tools.',
		features: registerFeatures,
	},
	login: {
		title: 'Welcome back to your workspace.',
		description:
			'Sign in to pick up right where you left off — your pipelines, payroll runs and projects are exactly as you left them.',
		features: loginHighlights,
	},
	success: {
		title: "You're almost in.",
		description: 'Just one quick step stands between you and your new workspace.',
		steps: successSteps,
	},
	forgot: {
		title: "Let's get you back in.",
		description: "Enter your email and we'll send you a secure link to reset your password.",
		features: loginHighlights,
	},
};
