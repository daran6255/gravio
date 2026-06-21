import React, { useState } from 'react';
import { Box, Container, Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { deactivateTeamUser, reactivateTeamUser, deleteTeamUser, resendTeamUserInvite, bulkDeleteTeamUsers } from '../../store/slices/userSlice';
import useToast from '../../hooks/useToast';
import type { TeamMember } from '../../models/user';

import PageHeader from '../../components/common/page-header';
import {
	UserManagementTable,
	UserManagementModals,
} from '../../components/users';
import OrganizationsConsole from '../admin/OrganizationsConsole';

/**
 * Team Management — invite teammates into your organization, see who's accepted
 * their invite, edit user details, delete accounts, and deactivate/reactivate access.
 */
const UserManagement: React.FC = () => {
	const dispatch = useAppDispatch();
	const { user: currentUser } = useAppSelector((state) => state.auth);

	if (currentUser?.is_superuser) {
		return <OrganizationsConsole />;
	}

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

	const headerAction = (
		<Button
			variant="contained"
			startIcon={<AddIcon />}
			onClick={handleAddUser}
			sx={{
				textTransform: 'none',
				fontWeight: 600,
				px: 3,
				py: 1,
				borderRadius: 3,
				boxShadow: 'none',
				'&:hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }
			}}
		>
			Invite Teammate
		</Button>
	);

	return (
		<Box component="main" sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
			<Container maxWidth="xl" sx={{ py: { xs: 2, sm: 4 } }}>

				<PageHeader
					title="Team"
					subtitle="Invite teammates and manage who has access to your organization"
					action={headerAction}
				/>

				<UserManagementTable
					refreshKey={refreshKey}
					onAddUser={handleAddUser}
					onEditUser={handleEditUser}
					onDeactivateUser={handleDeactivateUser}
					onReactivateUser={handleReactivateUser}
					onResendInvite={handleResendInvite}
					onDeleteUser={handleDeleteUser}
					selectedIds={selectedIds}
					onSelectId={handleSelectId}
					onSelectAll={handleSelectAll}
					onBulkDelete={handleBulkDelete}
				/>

				<UserManagementModals
					inviteDialogOpen={inviteDialogOpen}
					onCloseInviteDialog={() => setInviteDialogOpen(false)}
					onSuccessInvite={(message) => {
						refreshData();
						toast.success(message);
						setInviteDialogOpen(false);
					}}
					editDialogOpen={editDialogOpen}
					onCloseEditDialog={() => { setEditDialogOpen(false); setTargetUser(null); }}
					onSuccessEdit={(message) => {
						refreshData();
						toast.success(message);
						setEditDialogOpen(false);
					}}
					statusDialogOpen={statusDialogOpen}
					statusAction={statusAction}
					targetUser={targetUser}
					statusLoading={statusLoading}
					onCancelStatusChange={() => { setStatusDialogOpen(false); setTargetUser(null); }}
					onConfirmStatusChange={handleConfirmStatusChange}
					cancelDialogOpen={cancelDialogOpen}
					cancelLoading={cancelLoading}
					onCancelInviteClose={() => { setCancelDialogOpen(false); setTargetUser(null); }}
					onConfirmCancelInvite={handleConfirmDeleteUser}
					bulkDeleteDialogOpen={bulkDeleteDialogOpen}
					bulkDeleteLoading={bulkDeleteLoading}
					selectedCount={selectedIds.length}
					onBulkDeleteClose={() => setBulkDeleteDialogOpen(false)}
					onBulkDeleteConfirm={handleConfirmBulkDelete}
				/>

			</Container>
		</Box>
	);
};

export default UserManagement;
