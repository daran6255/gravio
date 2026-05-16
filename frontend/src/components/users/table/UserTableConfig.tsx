import { useMemo } from 'react';
import { Visibility, Edit, Delete } from '@mui/icons-material';
import type { ColumnDefinition, TableMenuAction } from '../../common/table';
import type { User } from '../../../models/user';
import type { User as AuthUser } from '../../../models/auth';

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
	currentUser: AuthUser | null;
	onViewUser?: (user: User) => void;
	onEditUser?: (user: User) => void;
	onDeleteUser?: (user: User) => void;
}

/**
 * Hook to manage UserTable configuration (columns and actions).
 */
export const useUserTableConfig = ({
	isMobile,
	isMedium,
	currentUser,
	onViewUser,
	onEditUser,
	onDeleteUser
}: UserTableConfigProps) => {

	// Column Definitions
	const columns = useMemo((): ColumnDefinition<User>[] => [
		{ id: 'full_name', label: 'Name', sortable: false },
		{ id: 'email', label: 'Email', sortable: false },
		{ id: 'mobile', label: 'WhatsApp', sortable: false },
		{ id: 'username', label: 'Username', sortable: false, hidden: isMedium },
		{ id: 'role', label: 'Role', sortable: false, hidden: isMobile },
		{ id: 'is_active', label: 'Status', sortable: false, hidden: isMobile },
		{ id: 'created_at', label: 'Created Date', sortable: false, hidden: isMedium },
		{ id: 'actions', label: 'Actions', sortable: false, align: 'right' },
	], [isMobile, isMedium]);

	// Action Definitions
	const rowActions = useMemo((): TableMenuAction<User>[] => [
		{
			label: 'View Details',
			icon: <Visibility fontSize="small" />,
			onClick: (user) => onViewUser?.(user)
		},
		{
			label: 'Edit User',
			icon: <Edit fontSize="small" />,
			onClick: (user) => onEditUser?.(user),
			color: 'warning.main',
			hidden: currentUser?.role !== 'admin'
		},
		{
			label: 'Delete User',
			icon: <Delete fontSize="small" />,
			onClick: (user) => onDeleteUser?.(user),
			color: 'error.main',
			hidden: currentUser?.role !== 'admin'
		}
	], [currentUser, onViewUser, onEditUser, onDeleteUser]);

	return { columns, rowActions };
};
