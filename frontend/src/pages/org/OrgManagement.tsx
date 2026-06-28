import React from 'react';
import { Box, Container, Button, Grid } from '@mui/material';
import {
	Add as AddIcon,
	People as PeopleIcon,
	CheckCircleOutline as CheckCircleOutlineIcon,
	MailOutline as MailOutlineIcon,
	ManageAccounts as ManageAccountsIcon
} from '@mui/icons-material';
import PageHeader from '../../components/common/page-header';
import {
	OrgManagementTable,
	OrgManagementModals,
	useOrgManagement,
	OrgSummaryCard,
	UserDetailDrawer
} from '../../components/orgs';
import StatCard from '../../components/common/stats/StatCard';
import { useAppSelector } from '../../store/hooks';

/**
 * Org Management — invite teammates into your organization, see who's accepted
 * their invite, edit user details, delete accounts, and deactivate/reactivate access.
 */
const OrgManagement: React.FC = () => {
	const {
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
		currentUser,
		detailDrawerOpen,
		selectedDetailUser,
		handleOpenDetailDrawer,
		handleCloseDetailDrawer,
		handleSendPasswordReset,
	} = useOrgManagement();

	const { users, total } = useAppSelector((state) => state.users);

	const totalMembers = total;
	const activeMembers = users.filter((u) => u.is_active).length;
	const pendingInvites = users.filter((u) => !u.is_verified).length;
	const managerAdminCount = users.filter((u) => u.role === 'admin' || u.role === 'manager').length;

	const statsCards = [
		{
			title: 'Total Members',
			value: totalMembers,
			subtitle: 'Total registered teammates',
			icon: <PeopleIcon sx={{ color: '#8B7CF6', fontSize: 26 }} />,
			color: '#8B7CF6'
		},
		{
			title: 'Active Members',
			value: activeMembers,
			subtitle: 'Teammates with active access',
			icon: <CheckCircleOutlineIcon sx={{ color: '#10B981', fontSize: 26 }} />,
			color: '#10B981'
		},
		{
			title: 'Pending Invites',
			value: pendingInvites,
			subtitle: 'Unverified email invitations',
			icon: <MailOutlineIcon sx={{ color: '#F59E0B', fontSize: 26 }} />,
			color: '#F59E0B'
		},
		{
			title: 'Admins & Managers',
			value: managerAdminCount,
			subtitle: 'Users with privileged roles',
			icon: <ManageAccountsIcon sx={{ color: '#4EA8FF', fontSize: 26 }} />,
			color: '#4EA8FF'
		}
	];

	const headerAction = (
		<Button
			variant="contained"
			startIcon={<AddIcon />}
			onClick={handleAddUser}
			sx={{
				borderRadius: '10px',
				fontWeight: 700,
				textTransform: 'none',
				px: 3,
				py: 1,
				color: '#ffffff',
				background: 'linear-gradient(135deg, #8B7CF6 0%, #6052d9 100%)',
				boxShadow: '0 4px 14px 0 rgba(139, 124, 246, 0.4)',
				border: 'none',
				transition: 'all 0.2s ease',
				'&:hover': {
					background: 'linear-gradient(135deg, #9C8FFF 0%, #7062E9 100%)',
					boxShadow: '0 6px 20px 0 rgba(139, 124, 246, 0.6)',
					transform: 'translateY(-1px)',
				}
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

				<Grid container spacing={3} sx={{ mb: 4, position: 'relative', zIndex: 1 }}>
					{statsCards.map((card, idx) => (
						<Grid size={{ xs: 12, sm: 6, md: 3 }} key={idx}>
							<StatCard {...card} />
						</Grid>
					))}
				</Grid>

				<Grid container spacing={3} sx={{ alignItems: 'stretch' }}>
					{/* Left: Org Summary Card (1/4 space) */}
					<Grid size={{ xs: 12, md: 3 }}>
						<OrgSummaryCard />
					</Grid>

					{/* Right: User Management Table (3/4 space) */}
					<Grid size={{ xs: 12, md: 9 }}>
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
							onUserClick={handleOpenDetailDrawer}
						/>
					</Grid>
				</Grid>

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
					reassignDialogOpen={reassignDialogOpen}
					reassignAction={reassignAction}
					reassignMessage={reassignMessage}
					reassignOwners={reassignOwners}
					reassignToUserId={reassignToUserId}
					onReassignToUserChange={setReassignToUserId}
					reassignLoading={reassignLoading}
					onCancelReassign={handleCancelReassign}
					onConfirmReassign={handleConfirmReassignAndRetry}
				/>

				<UserDetailDrawer
					user={selectedDetailUser}
					open={detailDrawerOpen}
					onClose={handleCloseDetailDrawer}
					onSendPasswordReset={handleSendPasswordReset}
					onDeactivate={handleDeactivateUser}
					onReactivate={handleReactivateUser}
					onDelete={handleDeleteUser}
					onEdit={handleEditUser}
					isSelf={selectedDetailUser?.public_id === currentUser?.public_id}
				/>

			</Container>
		</Box>
	);
};

export default OrgManagement;
