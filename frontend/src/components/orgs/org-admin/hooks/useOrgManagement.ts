import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import {
	deactivateTeamUser,
	reactivateTeamUser,
	deleteTeamUser,
	resendTeamUserInvite,
	bulkDeleteTeamUsers,
	resetTeamUserPassword
} from '../../../../store/slices/userSlice';
import useToast from '../../../../hooks/useToast';
import crmService from '../../../../services/crmService';
import type { TeamMember } from '../../../../models/user';
import type { CRMOwnerOption } from '../../../../models/crm/owner';

export const useOrgManagement = () => {
	const dispatch = useAppDispatch();
	const { user: currentUser } = useAppSelector((state) => state.auth);
	const { users } = useAppSelector((state) => state.users);
	const toast = useToast();

	const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
	const [editDialogOpen, setEditDialogOpen] = useState(false);
	const [statusDialogOpen, setStatusDialogOpen] = useState(false);
	const [statusAction, setStatusAction] = useState<'deactivate' | 'reactivate'>('deactivate');
	const [targetUser, setTargetUser] = useState<TeamMember | null>(null);
	const [statusLoading, setStatusLoading] = useState(false);
	const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
	const [cancelLoading, setCancelLoading] = useState(false);
	const [selectedIds, setSelectedIds] = useState<string[]>([]);
	const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
	const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);
	const [refreshKey, setRefreshKey] = useState(0);

	const [reassignDialogOpen, setReassignDialogOpen] = useState(false);
	const [reassignAction, setReassignAction] = useState<'deactivate' | 'delete'>('deactivate');
	const [reassignMessage, setReassignMessage] = useState('');
	const [reassignOwners, setReassignOwners] = useState<CRMOwnerOption[]>([]);
	const [reassignToUserId, setReassignToUserId] = useState<number | ''>('');
	const [reassignLoading, setReassignLoading] = useState(false);

	const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
	const [selectedDetailUser, setSelectedDetailUser] = useState<TeamMember | null>(null);

	const refreshData = () => setRefreshKey((prev) => prev + 1);

	const handleAddUser = () => setInviteDialogOpen(true);

	const handleEditUser = (user: TeamMember) => {
		setTargetUser(user);
		setEditDialogOpen(true);
	};

	const handleDeactivateUser = (user: TeamMember) => {
		setTargetUser(user);
		setStatusAction('deactivate');
		setStatusDialogOpen(true);
	};

	const handleReactivateUser = (user: TeamMember) => {
		setTargetUser(user);
		setStatusAction('reactivate');
		setStatusDialogOpen(true);
	};

	const openReassignDialog = async (action: 'deactivate' | 'delete', message: string) => {
		setReassignAction(action);
		setReassignMessage(message);
		setReassignToUserId('');
		setReassignDialogOpen(true);
		try {
			const owners = await crmService.listOwners();
			setReassignOwners(owners.filter((o) => o.email !== targetUser?.email));
		} catch {
			setReassignOwners([]);
		}
	};

	const handleConfirmStatusChange = async () => {
		if (!targetUser) return;
		setStatusLoading(true);
		try {
			if (statusAction === 'deactivate') {
				await dispatch(deactivateTeamUser({ publicId: targetUser.public_id })).unwrap();
				toast.success(`${targetUser.full_name || targetUser.username} has been deactivated.`);
				refreshData();
				setStatusDialogOpen(false);
				setTargetUser(null);
			} else {
				await dispatch(reactivateTeamUser(targetUser.public_id)).unwrap();
				toast.success(`${targetUser.full_name || targetUser.username} has been reactivated.`);
				refreshData();
				setStatusDialogOpen(false);
				setTargetUser(null);
			}
		} catch (error: any) {
			if (error?.status === 409) {
				setStatusDialogOpen(false);
				await openReassignDialog('deactivate', error.message);
			} else {
				toast.error(error?.message || error || `Failed to ${statusAction} user`);
				setStatusDialogOpen(false);
				setTargetUser(null);
			}
		} finally {
			setStatusLoading(false);
		}
	};

	const handleResendInvite = async (user: TeamMember) => {
		try {
			await dispatch(resendTeamUserInvite(user.public_id)).unwrap();
			toast.success(`Invite email resent to ${user.email}.`);
		} catch (error: any) {
			toast.error(error || 'Failed to resend invite');
		}
	};

	const handleDeleteUser = (user: TeamMember) => {
		setTargetUser(user);
		setCancelDialogOpen(true);
	};

	const handleConfirmDeleteUser = async () => {
		if (!targetUser) return;
		setCancelLoading(true);
		try {
			await dispatch(deleteTeamUser({ publicId: targetUser.public_id })).unwrap();
			const msg = targetUser.is_verified
				? `User ${targetUser.full_name || targetUser.username} has been deleted.`
				: `Invitation for ${targetUser.full_name || targetUser.username} has been cancelled.`;
			toast.success(msg);
			refreshData();
			setCancelDialogOpen(false);
			setTargetUser(null);
		} catch (error: any) {
			if (error?.status === 409) {
				setCancelDialogOpen(false);
				await openReassignDialog('delete', error.message);
			} else {
				toast.error(error?.message || error || 'Failed to delete user');
				setCancelDialogOpen(false);
				setTargetUser(null);
			}
		} finally {
			setCancelLoading(false);
		}
	};

	const handleConfirmReassignAndRetry = async () => {
		if (!targetUser || reassignToUserId === '') return;
		setReassignLoading(true);
		try {
			if (reassignAction === 'deactivate') {
				await dispatch(deactivateTeamUser({ publicId: targetUser.public_id, reassignToUserId })).unwrap();
				toast.success(`${targetUser.full_name || targetUser.username} has been deactivated.`);
			} else {
				await dispatch(deleteTeamUser({ publicId: targetUser.public_id, reassignToUserId })).unwrap();
				toast.success(`${targetUser.full_name || targetUser.username} has been deleted.`);
			}
			refreshData();
			setReassignDialogOpen(false);
			setTargetUser(null);
		} catch (error: any) {
			toast.error(error?.message || error || `Failed to ${reassignAction} user`);
		} finally {
			setReassignLoading(false);
		}
	};

	const handleCancelReassign = () => {
		setReassignDialogOpen(false);
		setTargetUser(null);
	};

	const handleSelectId = (id: string, checked: boolean) => {
		if (checked) {
			setSelectedIds((prev) => [...prev, id]);
		} else {
			setSelectedIds((prev) => prev.filter((item) => item !== id));
		}
	};

	const handleSelectAll = (checked: boolean) => {
		if (checked) {
			const nonSelfIds = users
				.filter((u) => u.public_id !== currentUser?.public_id)
				.map((u) => u.public_id);
			setSelectedIds(nonSelfIds);
		} else {
			setSelectedIds([]);
		}
	};

	const handleBulkDelete = () => {
		setBulkDeleteDialogOpen(true);
	};

	const handleConfirmBulkDelete = async () => {
		setBulkDeleteLoading(true);
		try {
			await dispatch(bulkDeleteTeamUsers(selectedIds)).unwrap();
			toast.success(`Successfully deleted ${selectedIds.length} user${selectedIds.length === 1 ? '' : 's'}.`);
			setSelectedIds([]);
			refreshData();
		} catch (error: any) {
			toast.error(error || 'Failed to delete selected users');
		} finally {
			setBulkDeleteLoading(false);
			setBulkDeleteDialogOpen(false);
		}
	};

	const handleSuccessInvite = (message: string) => {
		refreshData();
		toast.success(message);
		setInviteDialogOpen(false);
	};

	const handleSuccessEdit = (message: string) => {
		refreshData();
		toast.success(message);
		setEditDialogOpen(false);
	};

	const handleOpenDetailDrawer = (user: TeamMember) => {
		setSelectedDetailUser(user);
		setDetailDrawerOpen(true);
	};

	const handleCloseDetailDrawer = () => {
		setSelectedDetailUser(null);
		setDetailDrawerOpen(false);
	};

	const handleSendPasswordReset = async (user: TeamMember) => {
		try {
			await dispatch(resetTeamUserPassword(user.public_id)).unwrap();
			toast.success(`Password reset email has been sent to ${user.email}.`);
		} catch (error: any) {
			toast.error(error || 'Failed to send password reset link');
		}
	};

	return {
		currentUser,
		users,
		refreshKey,
		selectedIds,
		inviteDialogOpen,
		setInviteDialogOpen,
		editDialogOpen,
		setEditDialogOpen,
		statusDialogOpen,
		statusAction,
		targetUser,
		statusLoading,
		cancelDialogOpen,
		cancelLoading,
		bulkDeleteDialogOpen,
		bulkDeleteLoading,
		reassignDialogOpen,
		reassignAction,
		reassignMessage,
		reassignOwners,
		reassignToUserId,
		setReassignToUserId,
		reassignLoading,
		handleConfirmReassignAndRetry,
		handleCancelReassign,
		setTargetUser,
		setStatusDialogOpen,
		setCancelDialogOpen,
		setBulkDeleteDialogOpen,
		refreshData,
		handleAddUser,
		handleEditUser,
		handleDeactivateUser,
		handleReactivateUser,
		handleConfirmStatusChange,
		handleResendInvite,
		handleDeleteUser,
		handleConfirmDeleteUser,
		handleSelectId,
		handleSelectAll,
		handleBulkDelete,
		handleConfirmBulkDelete,
		handleSuccessInvite,
		handleSuccessEdit,
		detailDrawerOpen,
		setDetailDrawerOpen,
		selectedDetailUser,
		setSelectedDetailUser,
		handleOpenDetailDrawer,
		handleCloseDetailDrawer,
		handleSendPasswordReset,
	};
};
