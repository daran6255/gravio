import {
	Home as HomeIcon,
	ManageAccounts as UserIcon,
	CorporateFare as OrgIcon,
	TrendingUp as CrmIcon,
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
	hidden?: boolean;
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
		label: 'CRM',
		icon: CrmIcon,
		roles: ['admin', 'manager', 'marketing', 'placement'],
		children: [
			{
				label: 'Companies',
				path: '/crm/companies',
				roles: ['admin', 'manager', 'marketing', 'placement'],
			},
			{
				label: 'Leads',
				path: '/crm/leads',
				roles: ['admin', 'manager', 'marketing', 'placement'],
			},
			{
				label: 'Deals',
				path: '/crm/deals',
				roles: ['admin', 'manager', 'marketing', 'placement'],
			},
			{
				label: 'Tasks',
				path: '/crm/tasks',
				roles: ['admin', 'manager', 'marketing', 'placement'],
			},
		],
	},
	{
		label: 'Organizations',
		path: '/organizations',
		icon: OrgIcon,
		requiresSuperuser: true,
	},
	{
		label: 'Billing',
		path: '/billing',
		roles: ['admin'],
		hidden: true,
	},
];

export const bottomNavigation: NavigationItem[] = [];

/**
 * Resolves a route's configuration dynamically from top and bottom navigation lists.
 * Handles tenant-prefixed routes (e.g., /org/:orgId/users -> /users) automatically.
 */
export const getRouteConfig = (pathname: string): NavigationItem | undefined => {
	// Normalize route: strip tenant-prefixed /org/:orgId
	let normalizedPath = pathname;
	const orgMatch = pathname.match(/^\/org\/[^\/]+(\/.*)?$/);
	if (orgMatch) {
		normalizedPath = orgMatch[1] || '/';
	}

	const findItem = (items: NavigationItem[]): NavigationItem | undefined => {
		for (const item of items) {
			if (item.path === normalizedPath) return item;
			if (item.children) {
				const found = findItem(item.children);
				if (found) return found;
			}
		}
		return undefined;
	};

	return findItem(topNavigation) || findItem(bottomNavigation);
};
