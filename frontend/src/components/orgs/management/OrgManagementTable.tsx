import React from 'react';
import { Box } from '@mui/material';
import OrgUserTable from '../table/OrgUserTable';
import type { TeamMember } from '../../../models/user';

interface OrgManagementTableProps {
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
	onUserClick?: (user: TeamMember) => void;
}

export const OrgManagementTable: React.FC<OrgManagementTableProps> = ({
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
	onUserClick,
}) => {
	return (
		<Box>
			<OrgUserTable
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
				onUserClick={onUserClick}
			/>
		</Box>
	);
};

export default OrgManagementTable;
