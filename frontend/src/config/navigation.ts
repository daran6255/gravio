import {
	Home as HomeIcon,
	ManageAccounts as UserIcon,
	Settings as SettingsIcon,
	SmartToy as AIIcon,
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
];

export const bottomNavigation: NavigationItem[] = [
	{
		label: 'Settings',
		path: '/settings',
		icon: SettingsIcon,
		roles: ['admin'],
	},
];

export const settingsTabs = [
	{ label: 'AI Engine', icon: AIIcon },
];
