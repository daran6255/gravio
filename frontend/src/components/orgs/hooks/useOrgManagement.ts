import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
	deactivateTeamUser,
	reactivateTeamUser,
	deleteTeamUser,
	resendTeamUserInvite,
	bulkDeleteTeamUsers,
	resetTeamUserPassword
} from '../../../store/slices/userSlice';
import useToast from '../../../hooks/useToast';
import type { TeamMember } from '../../../models/user';

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

	const handleConfirmStatusChange = async () => {
		if (!targetUser) return;
		setStatusLoading(true);
		try {
			if (statusAction === 'deactivate') {
				await dispatch(deactivateTeamUser(targetUser.public_id)).unwrap();
				toast.success(`${targetUser.full_name || targetUser.username} has been deactivated.`);
			} else {
				await dispatch(reactivateTeamUser(targetUser.public_id)).unwrap();
				toast.success(`${targetUser.full_name || targetUser.username} has been reactivated.`);
			}
			refreshData();
		} catch (error: any) {
			toast.error(error || `Failed to ${statusAction} user`);
		} finally {
			setStatusLoading(false);
			setStatusDialogOpen(false);
			setTargetUser(null);
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
			await dispatch(deleteTeamUser(targetUser.public_id)).unwrap();
			const msg = targetUser.is_verified
				? `User ${targetUser.full_name || targetUser.username} has been deleted.`
				: `Invitation for ${targetUser.full_name || targetUser.username} has been cancelled.`;
			toast.success(msg);
			refreshData();
		} catch (error: any) {
			toast.error(error || 'Failed to delete user');
		} finally {
			setCancelLoading(false);
			setCancelDialogOpen(false);
			setTargetUser(null);
		}
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
