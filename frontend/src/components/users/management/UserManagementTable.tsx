import React from 'react';
import { Box } from '@mui/material';
import UserTable from '../table/UserTable';
import type { TeamMember } from '../../../models/user';

interface UserManagementTableProps {
	refreshKey: number;
	onAddUser: () => void;
	onEditUser: (user: TeamMember) => void;
	onDeactivateUser: (user: TeamMember) => void;
	onReactivateUser: (user: TeamMember) => void;
	onResendInvite: (user: TeamMember) => void;
	onDeleteUser: (user: TeamMember) => void;
	selectedIds: string[];
	onSelectId: (id: string, checked: boolean) => void;
	onSelectAll: (checked: boolean) => void;
	onBulkDelete: () => void;
}

const UserManagementTable: React.FC<UserManagementTableProps> = ({
	refreshKey,
	onAddUser,
	onEditUser,
	onDeactivateUser,
	onReactivateUser,
	onResendInvite,
	onDeleteUser,
	selectedIds,
	onSelectId,
	onSelectAll,
	onBulkDelete,
}) => {
	return (
		<Box>
			<UserTable
				refreshKey={refreshKey}
				onAddUser={onAddUser}
				onEditUser={onEditUser}
				onDeactivateUser={onDeactivateUser}
				onReactivateUser={onReactivateUser}
				onResendInvite={onResendInvite}
				onDeleteUser={onDeleteUser}
				selectedIds={selectedIds}
				onSelectId={onSelectId}
				onSelectAll={onSelectAll}
				onBulkDelete={onBulkDelete}
			/>
		</Box>
	);
};

export default UserManagementTable;
