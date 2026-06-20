import React from 'react';
import InviteUserDialog from '../InviteUserDialog';
import { ConfirmationDialog } from '../../common/dialogbox';
import type { TeamMember } from '../../../models/user';

interface UserManagementModalsProps {
	inviteDialogOpen: boolean;
	onCloseInviteDialog: () => void;
	onSuccessInvite: (message: string) => void;

	statusDialogOpen: boolean;
	statusAction: 'deactivate' | 'reactivate';
	targetUser: TeamMember | null;
	statusLoading: boolean;
	onCancelStatusChange: () => void;
	onConfirmStatusChange: () => void;
}

const UserManagementModals: React.FC<UserManagementModalsProps> = ({
	inviteDialogOpen,
	onCloseInviteDialog,
	onSuccessInvite,
	statusDialogOpen,
	statusAction,
	targetUser,
	statusLoading,
	onCancelStatusChange,
	onConfirmStatusChange,
}) => {
	const isDeactivate = statusAction === 'deactivate';

	return (
		<>
			<InviteUserDialog
				open={inviteDialogOpen}
				onClose={onCloseInviteDialog}
				onSuccess={onSuccessInvite}
			/>

			<ConfirmationDialog
				open={statusDialogOpen}
				onClose={onCancelStatusChange}
				onConfirm={onConfirmStatusChange}
				title={isDeactivate ? 'Deactivate Teammate' : 'Reactivate Teammate'}
				subtitle={isDeactivate ? 'They will lose access immediately' : 'Restore their access'}
				message={
					isDeactivate
						? `Deactivate ${targetUser?.full_name || targetUser?.username}? They won't be able to log in until reactivated.`
						: `Reactivate ${targetUser?.full_name || targetUser?.username}? They'll be able to log in again.`
				}
				confirmLabel={isDeactivate ? 'Deactivate' : 'Reactivate'}
				cancelLabel="Cancel"
				severity={isDeactivate ? 'warning' : 'success'}
				loading={statusLoading}
			/>
		</>
	);
};

export default UserManagementModals;
