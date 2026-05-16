import React from 'react';
import { Box } from '@mui/material';
import UserTable from '../table/UserTable';
import type { User } from '../../../models/user';

interface UserManagementTableProps {
	refreshKey: number;
	onAddUser: () => void;
	onEditUser: (user: User) => void;
	onViewUser: (user: User) => void;
	onDeleteUser: (user: User) => void;
}

const UserManagementTable: React.FC<UserManagementTableProps> = ({
	refreshKey,
	onAddUser,
	onEditUser,
	onViewUser,
	onDeleteUser
}) => {
	return (
		<Box>
			<UserTable
				key={`table-${refreshKey}`}
				onAddUser={onAddUser}
				onEditUser={onEditUser}
				onViewUser={onViewUser}
				onDeleteUser={onDeleteUser}
			/>
		</Box>
	);
};

export default UserManagementTable;
