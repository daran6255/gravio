import React from 'react';
import { Box } from '@mui/material';
import UserTable from '../table/UserTable';
import type { TeamMember } from '../../../models/user';

interface UserManagementTableProps {
	refreshKey: number;
	onAddUser: () => void;
	onDeactivateUser: (user: TeamMember) => void;
	onReactivateUser: (user: TeamMember) => void;
}

const UserManagementTable: React.FC<UserManagementTableProps> = ({
	refreshKey,
	onAddUser,
	onDeactivateUser,
	onReactivateUser,
}) => {
	return (
		<Box>
			<UserTable
				refreshKey={refreshKey}
				onAddUser={onAddUser}
				onDeactivateUser={onDeactivateUser}
				onReactivateUser={onReactivateUser}
			/>
		</Box>
	);
};

export default UserManagementTable;
