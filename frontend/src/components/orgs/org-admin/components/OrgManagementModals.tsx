import React from 'react';
import { MenuItem, Select, FormControl, InputLabel, Typography } from '@mui/material';
import { InviteOrgUserDialog } from '../forms';
import { EditOrgUserDialog } from '../../shared';
import { ConfirmationDialog } from '../../../common/dialogbox';
import type { TeamMember } from '../../../../models/user';
import type { CRMOwnerOption } from '../../../../models/crm/owner';

interface OrgManagementModalsProps {
	inviteDialogOpen: boolean;
	onCloseInviteDialog: () => void;
	onSuccessInvite: (message: string) => void;

	editDialogOpen: boolean;
	onCloseEditDialog: () => void;
	onSuccessEdit: (message: string) => void;

	statusDialogOpen: boolean;
	statusAction: 'deactivate' | 'reactivate';
	targetUser: TeamMember | null;
	statusLoading: boolean;
	onCancelStatusChange: () => void;
	onConfirmStatusChange: () => void;

	cancelDialogOpen: boolean;
	cancelLoading: boolean;
	onCancelInviteClose: () => void;
	onConfirmCancelInvite: () => void;

	bulkDeleteDialogOpen: boolean;
	bulkDeleteLoading: boolean;
	selectedCount: number;
	onBulkDeleteClose: () => void;
	onBulkDeleteConfirm: () => void;

	reassignDialogOpen: boolean;
	reassignAction: 'deactivate' | 'delete';
	reassignMessage: string;
	reassignOwners: CRMOwnerOption[];
	reassignToUserId: number | '';
	onReassignToUserChange: (id: number | '') => void;
	reassignLoading: boolean;
	onCancelReassign: () => void;
	onConfirmReassign: () => void;
}

export const OrgManagementModals: React.FC<OrgManagementModalsProps> = ({
	inviteDialogOpen,
	onCloseInviteDialog,
	onSuccessInvite,
	editDialogOpen,
	onCloseEditDialog,
	onSuccessEdit,
	statusDialogOpen,
	statusAction,
	targetUser,
	statusLoading,
	onCancelStatusChange,
	onConfirmStatusChange,
	cancelDialogOpen,
	cancelLoading,
	onCancelInviteClose,
	onConfirmCancelInvite,
	bulkDeleteDialogOpen,
	bulkDeleteLoading,
	selectedCount,
	onBulkDeleteClose,
	onBulkDeleteConfirm,
	reassignDialogOpen,
	reassignAction,
	reassignMessage,
	reassignOwners,
	reassignToUserId,
	onReassignToUserChange,
	reassignLoading,
	onCancelReassign,
	onConfirmReassign,
}) => {
	const isDeactivate = statusAction === 'deactivate';

	return (
		<>
			<InviteOrgUserDialog
				open={inviteDialogOpen}
				onClose={onCloseInviteDialog}
				onSuccess={onSuccessInvite}
			/>

			<EditOrgUserDialog
				open={editDialogOpen}
				user={targetUser}
				onClose={onCloseEditDialog}
				onSuccess={onSuccessEdit}
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

			<ConfirmationDialog
				open={cancelDialogOpen}
				onClose={onCancelInviteClose}
				onConfirm={onConfirmCancelInvite}
				title={targetUser?.is_verified ? 'Delete User' : 'Cancel Invite'}
				subtitle={targetUser?.is_verified ? 'Permanently delete user account' : 'Remove pending team member invite'}
				message={
					targetUser?.is_verified
						? `Are you sure you want to delete the user account for ${targetUser?.full_name || targetUser?.username}? This action is permanent, will revoke all their active sessions, and cannot be undone.`
						: `Are you sure you want to cancel the invitation for ${targetUser?.full_name || targetUser?.username}? This will remove them from the system, and their invite link will no longer work.`
				}
				confirmLabel={targetUser?.is_verified ? 'Delete User' : 'Cancel Invite'}
				cancelLabel={targetUser?.is_verified ? 'Cancel' : 'Keep Invite'}
				severity="error"
				loading={cancelLoading}
			/>

			<ConfirmationDialog
				open={bulkDeleteDialogOpen}
				onClose={onBulkDeleteClose}
				onConfirm={onBulkDeleteConfirm}
				title="Delete Selected Users"
				subtitle="Permanently delete user accounts"
				message={`Are you sure you want to delete the ${selectedCount} selected user${selectedCount === 1 ? '' : 's'}? This action is permanent, will revoke all their active sessions, and cannot be undone.`}
				confirmLabel={`Delete User${selectedCount === 1 ? '' : 's'}`}
				cancelLabel="Cancel"
				severity="error"
				loading={bulkDeleteLoading}
			/>

			<ConfirmationDialog
				open={reassignDialogOpen}
				onClose={onCancelReassign}
				onConfirm={onConfirmReassign}
				title="Reassign Owned Leads"
				subtitle="Pick a new owner to continue"
				message={reassignMessage}
				confirmLabel={reassignAction === 'deactivate' ? 'Reassign & Deactivate' : 'Reassign & Delete'}
				cancelLabel="Cancel"
				severity="warning"
				loading={reassignLoading}
			>
				<FormControl fullWidth size="small">
					<InputLabel id="reassign-owner-label">New Owner</InputLabel>
					<Select<number | ''>
						labelId="reassign-owner-label"
						label="New Owner"
						value={reassignToUserId}
						onChange={(e) => onReassignToUserChange(e.target.value === '' ? '' : Number(e.target.value))}
					>
						{reassignOwners.length === 0 && (
							<MenuItem value="" disabled>
								<Typography variant="body2" color="text.secondary">No other teammates available</Typography>
							</MenuItem>
						)}
						{reassignOwners.map((o) => (
							<MenuItem key={o.id} value={o.id}>
								{o.full_name || o.email}
							</MenuItem>
						))}
					</Select>
				</FormControl>
			</ConfirmationDialog>
		</>
	);
};

export default OrgManagementModals;
