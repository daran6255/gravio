import React, { useState } from 'react';
import { Box, Container, Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { deleteUser } from '../../store/slices/userSlice';
import useToast from '../../hooks/useToast';
import type { User } from '../../models/user';

// Common Components
import PageHeader from '../../components/common/page-header';

// Restructured User Components
import {
	UserManagementStats,
	UserManagementTable,
	UserManagementModals
} from '../../components/users';

/**
 * User Management Module
 * Comprehensive dashboard for managing system users, roles, and statistics.
 * Uses the standardized PageHeader common component.
 */
const UserManagement: React.FC = () => {
	const dispatch = useAppDispatch();
	const toast = useToast();
	const { user: currentUser } = useAppSelector((state) => state.auth);

	// --- State Management ---
	const [openDialog, setOpenDialog] = useState(false);
	const [dialogMode, setDialogMode] = useState<'add' | 'edit' | 'view'>('add');
	const [selectedUser, setSelectedUser] = useState<User | null>(null);

	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [userToDelete, setUserToDelete] = useState<User | null>(null);

	const [refreshKey, setRefreshKey] = useState(0);

	// --- Handlers: Dialogs & Actions ---
	const handleAddUser = () => {
		setDialogMode('add');
		setSelectedUser(null);
		setOpenDialog(true);
	};

	const handleEditUser = (user: User) => {
		setDialogMode('edit');
		setSelectedUser(user);
		setOpenDialog(true);
	};

	const handleViewUser = (user: User) => {
		setDialogMode('view');
		setSelectedUser(user);
		setOpenDialog(true);
	};

	const handleCloseDialog = () => {
		setOpenDialog(false);
		setSelectedUser(null);
	};

	const handleDeleteClick = (user: User) => {
		if (currentUser?.role !== 'admin') {
			toast.error('Only administrators can delete users');
			return;
		}
		setUserToDelete(user);
		setDeleteDialogOpen(true);
	};

	const handleConfirmDelete = async () => {
		if (!userToDelete) return;

		try {
			await dispatch(deleteUser(userToDelete.id.toString())).unwrap();
			toast.success('User deleted successfully');
			refreshData();
		} catch (error: any) {
			console.error('Failed to delete user:', error);
			toast.error(error || 'Failed to delete user');
		} finally {
			setDeleteDialogOpen(false);
			setUserToDelete(null);
		}
	};

	const handleCancelDelete = () => {
		setDeleteDialogOpen(false);
		setUserToDelete(null);
	};

	// --- Utilities ---
	const refreshData = () => setRefreshKey(prev => prev + 1);

	// Header Action
	const headerAction = currentUser?.role === 'admin' ? (
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
			Add User
		</Button>
	) : undefined;

	return (
		<Box component="main" sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
			<Container maxWidth="xl" sx={{ py: { xs: 2, sm: 4 } }}>

				<PageHeader
					title="User Management"
					subtitle="Manage system users, roles, and permissions"
					action={headerAction}
				/>

				<UserManagementStats refreshKey={refreshKey} />

				<UserManagementTable
					refreshKey={refreshKey}
					onAddUser={handleAddUser}
					onEditUser={handleEditUser}
					onViewUser={handleViewUser}
					onDeleteUser={handleDeleteClick}
				/>

				<UserManagementModals
					openDialog={openDialog}
					dialogMode={dialogMode}
					selectedUser={selectedUser}
					onCloseDialog={handleCloseDialog}
					onSuccessDialog={(message) => {
						refreshData();
						toast.success(message);
						handleCloseDialog();
					}}
					deleteDialogOpen={deleteDialogOpen}
					onCancelDelete={handleCancelDelete}
					onConfirmDelete={handleConfirmDelete}
					userToDelete={userToDelete}
				/>

			</Container>
		</Box>
	);
};

export default UserManagement;
