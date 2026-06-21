import { useMemo } from 'react';
import type { ColumnDefinition } from '../../common/table';
import type { TeamMember } from '../../../models/user';

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

interface OrgUserTableConfigProps {
	isMobile: boolean;
	isMedium: boolean;
}

export const useOrgUserTableConfig = ({ isMobile, isMedium }: OrgUserTableConfigProps) => {
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
