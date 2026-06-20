import { useMemo } from 'react';
import type { ColumnDefinition } from '../../common/table';
import type { TeamMember } from '../../../models/user';

/**
 * Returns the theme color for a specific user role.
 */
export const getRoleColor = (role: string): 'error' | 'warning' | 'info' | 'success' | 'secondary' | 'primary' => {
	switch (role.toLowerCase()) {
		case 'admin': return 'error';
		case 'manager': return 'warning';
		case 'trainer': return 'info';
		case 'counselor': return 'success';
		case 'project_coordinator': return 'secondary';
		case 'developer': return 'primary';
		default: return 'info';
	}
};

interface UserTableConfigProps {
	isMobile: boolean;
	isMedium: boolean;
}

/**
 * Hook to manage Team table column configuration.
 *
 * Row actions are NOT defined here — DataTableActions takes one shared `actions`
 * array per table, not per row, so the Deactivate/Reactivate toggle (which depends
 * on each row's own is_active) is built per-row directly in UserTable.tsx instead.
 */
export const useUserTableConfig = ({ isMobile, isMedium }: UserTableConfigProps) => {
	const columns = useMemo((): ColumnDefinition<TeamMember>[] => [
		{ id: 'full_name', label: 'Name', sortable: false },
		{ id: 'email', label: 'Email', sortable: false },
		{ id: 'username', label: 'Username', sortable: false, hidden: isMedium },
		{ id: 'role', label: 'Role', sortable: false, hidden: isMobile },
		{ id: 'is_active', label: 'Status', sortable: false },
		{ id: 'is_verified', label: 'Invite', sortable: false, hidden: isMobile },
		{ id: 'actions', label: 'Actions', sortable: false, align: 'right' },
	], [isMobile, isMedium]);

	return { columns };
};
