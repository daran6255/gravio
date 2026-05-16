import React from 'react';
import UserDialog from '../UserDialog';
import { ConfirmationDialog } from '../../common/dialogbox';
import type { User } from '../../../models/user';

interface UserManagementModalsProps {
	openDialog: boolean;
	dialogMode: 'add' | 'edit' | 'view';
	selectedUser: User | null;
	onCloseDialog: () => void;
	onSuccessDialog: (message: string) => void;
	
	deleteDialogOpen: boolean;
	onCancelDelete: () => void;
	onConfirmDelete: () => void;
	userToDelete: User | null;
}

const UserManagementModals: React.FC<UserManagementModalsProps> = ({
	openDialog,
	dialogMode,
	selectedUser,
	onCloseDialog,
	onSuccessDialog,
	deleteDialogOpen,
	onCancelDelete,
	onConfirmDelete,
	userToDelete
}) => {
	return (
		<>
			<UserDialog
				open={openDialog}
				mode={dialogMode}
				user={selectedUser}
				onClose={onCloseDialog}
				onSuccess={onSuccessDialog}
			/>

			<ConfirmationDialog
				open={deleteDialogOpen}
				onClose={onCancelDelete}
				onConfirm={onConfirmDelete}
				title="Delete User"
				subtitle="Irreversible Governance Action"
				message={`Are you sure you want to delete user ${userToDelete?.username}? This action is permanent and cannot be undone.`}
				confirmLabel="Delete User"
				cancelLabel="Cancel"
				severity="error"
				loading={false}
			/>
		</>
	);
};

export default UserManagementModals;
