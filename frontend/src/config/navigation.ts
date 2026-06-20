import {
	Home as HomeIcon,
	ManageAccounts as UserIcon,
	CorporateFare as OrgIcon,
} from '@mui/icons-material';
import type { SvgIconComponent } from '@mui/icons-material';

export interface NavigationItem {
	label?: string;
	path?: string;
	icon?: SvgIconComponent;
	roles?: string[];
	/** Gated on User.is_superuser rather than role — Super Admin is a platform-level
	 *  flag, not one of the org-scoped UserRole values. */
	requiresSuperuser?: boolean;
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
		label: 'Team',
		path: '/users',
		icon: UserIcon,
		roles: ['admin'],
	},
	{
		label: 'Organizations',
		path: '/admin/organizations',
		icon: OrgIcon,
		requiresSuperuser: true,
	},
];

export const bottomNavigation: NavigationItem[] = [];
