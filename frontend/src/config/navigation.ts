import {
	Home as HomeIcon,
	ManageAccounts as UserIcon,
	CorporateFare as OrgIcon,
	ViewKanban as ProjectsIcon,
	Person as ProfileIcon,
	Tune as PreferencesIcon,
	Shield as SecurityIcon,
	Notifications as NotificationsIcon,
	ArrowBack as BackIcon,
	Business as BusinessIcon,
	AssignmentInd as LeadsIcon,
	Handshake as DealsIcon,
	Assignment as TasksIcon,
	PendingActions as TimesheetIcon,
	PeopleAltOutlined as EmployeesIcon,
	CalendarMonthOutlined as LeaveIcon,
	PlaylistAddCheck as OnboardingIcon,
	FolderShared as DocumentsIcon,
	EventAvailableOutlined as BookingSetupIcon,
	VideocamOutlined as MeetingsIcon,
	AccountTreeOutlined as DepartmentsIcon,
	WorkOutlined as DesignationsIcon,
	SupervisedUserCircleOutlined as ManagersIcon,
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
	sectionId?: string;
	isSection?: boolean;
}

export const topNavigation: NavigationItem[] = [
	{
		label: 'Workspace',
		isSection: true,
		children: [
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
				label: 'Projects',
				path: '/projects',
				icon: ProjectsIcon,
				roles: ['admin', 'manager', 'project_coordinator', 'developer'],
			},
			{
				label: 'Timesheets',
				path: '/timesheets',
				icon: TimesheetIcon,
			},
			{
				label: 'Leaves',
				path: '/hr/user/leaves',
				icon: LeaveIcon,
			},
			{
				label: 'Meetings',
				path: '/booking/meetings',
				icon: MeetingsIcon,
			},
			{
				label: 'Billing',
				path: '/billing',
				roles: ['admin'],
				hidden: true,
			},
		],
	},
	{
		label: 'CRM',
		isSection: true,
		roles: ['admin', 'manager', 'marketing', 'placement'],
		children: [
			{
				label: 'Companies',
				path: '/crm/companies',
				icon: BusinessIcon,
				roles: ['admin', 'manager', 'marketing', 'placement'],
			},
			{
				label: 'Leads',
				path: '/crm/leads',
				icon: LeadsIcon,
				roles: ['admin', 'manager', 'marketing', 'placement'],
			},
			{
				label: 'Deals',
				path: '/crm/deals',
				icon: DealsIcon,
				roles: ['admin', 'manager', 'marketing', 'placement'],
			},
			{
				label: 'Tasks',
				path: '/crm/tasks',
				icon: TasksIcon,
				roles: ['admin', 'manager', 'marketing', 'placement'],
			},
		],
	},
	{
		label: 'HR Administration',
		isSection: true,
		roles: ['admin', 'hr_admin', 'hr_manager', 'leadership'],
		children: [
			{
				label: 'Employees',
				path: '/hr/admin/employees',
				icon: EmployeesIcon,
				roles: ['admin', 'hr_admin', 'hr_manager', 'leadership'],
			},
			{
				label: 'Departments',
				path: '/hr/admin/departments',
				icon: DepartmentsIcon,
				roles: ['admin', 'hr_admin', 'hr_manager', 'leadership'],
			},
			{
				label: 'Designations',
				path: '/hr/admin/designations',
				icon: DesignationsIcon,
				roles: ['admin', 'hr_admin', 'hr_manager', 'leadership'],
			},
			{
				label: 'Managers',
				path: '/hr/admin/managers',
				icon: ManagersIcon,
				roles: ['admin', 'hr_admin', 'hr_manager', 'leadership'],
			},
			{
				label: 'Lifecycle',
				path: '/hr/admin/onboarding',
				icon: OnboardingIcon,
				roles: ['admin', 'hr_admin', 'hr_manager'],
			},
			{
				label: 'Documents',
				path: '/hr/admin/documents',
				icon: DocumentsIcon,
				roles: ['admin', 'hr_admin', 'hr_manager'],
			},
		],
	},
	{
		label: 'Administration',
		isSection: true,
		requiresSuperuser: true,
		children: [
			{
				label: 'Organizations',
				path: '/organizations',
				icon: OrgIcon,
				requiresSuperuser: true,
			},
		],
	},
];

export const bottomNavigation: NavigationItem[] = [];

export const settingsNavigation: NavigationItem[] = [
	{ label: 'Back to Dashboard', icon: BackIcon, path: '/dashboard', divider: true },
	{ label: 'Profile', icon: ProfileIcon, sectionId: 'settings-profile' },
	{ label: 'Preferences', icon: PreferencesIcon, sectionId: 'settings-preferences' },
	{ label: 'Security', icon: SecurityIcon, sectionId: 'settings-security' },
	{ label: 'Notifications', icon: NotificationsIcon, sectionId: 'settings-notifications' },
	{ label: 'Booking', icon: BookingSetupIcon, sectionId: 'settings-booking' },
];

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
