import React from 'react';
import { Box, Container, Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import PageHeader from '../../components/common/page-header';
import {
	OrgManagementTable,
	OrgManagementModals,
	useOrgManagement,
	OrgConsole
} from '../../components/orgs';

/**
 * Org Management — invite teammates into your organization, see who's accepted
 * their invite, edit user details, delete accounts, and deactivate/reactivate access.
 */
const OrgManagement: React.FC = () => {
	const {
		currentUser,
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
	} = useOrgManagement();

	if (currentUser?.is_superuser) {
		return <OrgConsole />;
	}

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

				<OrgManagementTable
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

				<OrgManagementModals
					inviteDialogOpen={inviteDialogOpen}
					onCloseInviteDialog={() => setInviteDialogOpen(false)}
					onSuccessInvite={handleSuccessInvite}
					editDialogOpen={editDialogOpen}
					onCloseEditDialog={() => { setEditDialogOpen(false); setTargetUser(null); }}
					onSuccessEdit={handleSuccessEdit}
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

export default OrgManagement;
