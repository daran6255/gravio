import React, { useState } from 'react';
import { Box, Container, Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useAppDispatch } from '../../store/hooks';
import { deactivateTeamUser, reactivateTeamUser, deleteTeamUser, resendTeamUserInvite } from '../../store/slices/userSlice';
import useToast from '../../hooks/useToast';
import type { TeamMember } from '../../models/user';

import PageHeader from '../../components/common/page-header';
import {
	UserManagementTable,
	UserManagementModals,
} from '../../components/users';

/**
 * Team Management — invite teammates into your organization, see who's accepted
 * their invite, and deactivate/reactivate access. (Route stays /users for now.)
 */
const UserManagement: React.FC = () => {
	const dispatch = useAppDispatch();
	const toast = useToast();

	const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
	const [statusDialogOpen, setStatusDialogOpen] = useState(false);
	const [statusAction, setStatusAction] = useState<'deactivate' | 'reactivate'>('deactivate');
	const [targetUser, setTargetUser] = useState<TeamMember | null>(null);
	const [statusLoading, setStatusLoading] = useState(false);
	const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
	const [cancelLoading, setCancelLoading] = useState(false);
	const [refreshKey, setRefreshKey] = useState(0);

	const refreshData = () => setRefreshKey((prev) => prev + 1);

	const handleAddUser = () => setInviteDialogOpen(true);

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

	const handleCancelInvite = (user: TeamMember) => {
		setTargetUser(user);
		setCancelDialogOpen(true);
	};

	const handleConfirmCancelInvite = async () => {
		if (!targetUser) return;
		setCancelLoading(true);
		try {
			await dispatch(deleteTeamUser(targetUser.public_id)).unwrap();
			toast.success(`Invitation for ${targetUser.full_name || targetUser.username} has been cancelled.`);
			refreshData();
		} catch (error: any) {
			toast.error(error || 'Failed to cancel invite');
		} finally {
			setCancelLoading(false);
			setCancelDialogOpen(false);
			setTargetUser(null);
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
					onDeactivateUser={handleDeactivateUser}
					onReactivateUser={handleReactivateUser}
					onResendInvite={handleResendInvite}
					onCancelInvite={handleCancelInvite}
				/>

				<UserManagementModals
					inviteDialogOpen={inviteDialogOpen}
					onCloseInviteDialog={() => setInviteDialogOpen(false)}
					onSuccessInvite={(message) => {
						refreshData();
						toast.success(message);
						setInviteDialogOpen(false);
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
					onConfirmCancelInvite={handleConfirmCancelInvite}
				/>

			</Container>
		</Box>
	);
};

export default UserManagement;
