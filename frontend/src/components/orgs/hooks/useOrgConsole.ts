import { useCallback, useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
	fetchOrganizations,
	deactivateOrg,
	reactivateOrg,
	fetchAdminStats,
	fetchOrgUsers,
	deactivateOrgUser,
	reactivateOrgUser,
	deleteOrgUser,
	resendOrgUserInvite
} from '../../../store/slices/orgAdminSlice';
import useToast from '../../../hooks/useToast';
import type { Organization } from '../../../models/auth';
import type { TeamMember } from '../../../models/user';
import authService from '../../../services/authService';

export const useOrgConsole = () => {
	const dispatch = useAppDispatch();
	const toast = useToast();

	const {
		organizations,
		loading,
		total,
		stats,
		selectedOrgUsers,
		selectedOrgUsersLoading,
		selectedOrgUsersError
	} = useAppSelector((state) => state.orgAdmin);

	const [page, setPage] = useState(0); // MUI 0-indexed; backend is 1-indexed
	const [rowsPerPage, setRowsPerPage] = useState(20);
	const [createDialogOpen, setCreateDialogOpen] = useState(false);

	const [statusDialogOpen, setStatusDialogOpen] = useState(false);
	const [statusAction, setStatusAction] = useState<'deactivate' | 'reactivate'>('deactivate');
	const [targetOrg, setTargetOrg] = useState<Organization | null>(null);
	const [statusLoading, setStatusLoading] = useState(false);

	const [extendTrialOpen, setExtendTrialOpen] = useState(false);
	const [extendDays, setExtendDays] = useState('30');
	const [extendLoading, setExtendLoading] = useState(false);

	// Side drawer states
	const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
	const [userSearchTerm, setUserSearchTerm] = useState('');

	// Side drawer user actions confirmation states
	const [userDialogOpen, setUserDialogOpen] = useState(false);
	const [userActionType, setUserActionType] = useState<'deactivate' | 'reactivate' | 'delete'>('deactivate');
	const [targetUser, setTargetUser] = useState<TeamMember | null>(null);
	const [userActionLoading, setUserActionLoading] = useState(false);

	const fetchData = useCallback(() => {
		dispatch(fetchOrganizations({ page: page + 1, pageSize: rowsPerPage }));
		dispatch(fetchAdminStats());
	}, [dispatch, page, rowsPerPage]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	const handleOpenExtendTrial = (org: Organization) => {
		setTargetOrg(org);
		setExtendDays('30');
		setExtendTrialOpen(true);
	};

	const handleConfirmExtendTrial = async () => {
		if (!targetOrg) return;
		const days = parseInt(extendDays, 10);
		if (isNaN(days) || days <= 0) {
			toast.error('Please enter a valid number of days');
			return;
		}
		setExtendLoading(true);
		try {
			await authService.extendTrial(targetOrg.public_id, days);
			toast.success(`Successfully extended trial for ${targetOrg.name} by ${days} days.`);
			
			fetchData();

			if (selectedOrg?.public_id === targetOrg.public_id) {
				const updatedOrgs = await dispatch(fetchOrganizations({ page: page + 1, pageSize: rowsPerPage })).unwrap();
				const refreshedSelected = updatedOrgs.items.find((o: Organization) => o.public_id === targetOrg.public_id);
				if (refreshedSelected) {
					setSelectedOrg(refreshedSelected);
				}
			}
		} catch (error: any) {
			toast.error(error?.response?.data?.error?.message || error?.message || 'Failed to extend trial');
		} finally {
			setExtendLoading(false);
			setExtendTrialOpen(false);
			setTargetOrg(null);
		}
	};

	const handleDeactivate = (org: Organization) => {
		setTargetOrg(org);
		setStatusAction('deactivate');
		setStatusDialogOpen(true);
	};

	const handleReactivate = (org: Organization) => {
		setTargetOrg(org);
		setStatusAction('reactivate');
		setStatusDialogOpen(true);
	};

	const handleConfirmStatusChange = async () => {
		if (!targetOrg) return;
		setStatusLoading(true);
		try {
			if (statusAction === 'deactivate') {
				const updated = await dispatch(deactivateOrg(targetOrg.public_id)).unwrap();
				toast.success(`${targetOrg.name} has been deactivated.`);
				if (selectedOrg?.public_id === targetOrg.public_id) {
					setSelectedOrg(updated);
				}
			} else {
				const updated = await dispatch(reactivateOrg(targetOrg.public_id)).unwrap();
				toast.success(`${targetOrg.name} has been reactivated.`);
				if (selectedOrg?.public_id === targetOrg.public_id) {
					setSelectedOrg(updated);
				}
			}
			dispatch(fetchAdminStats());
		} catch (error: any) {
			toast.error(error || `Failed to ${statusAction} organization`);
		} finally {
			setStatusLoading(false);
			setStatusDialogOpen(false);
			setTargetOrg(null);
		}
	};

	const handleUserAction = (user: TeamMember, type: 'deactivate' | 'reactivate' | 'delete' | 'resendInvite') => {
		setTargetUser(user);
		if (type === 'resendInvite') {
			handleConfirmUserAction(user, type);
		} else {
			setUserActionType(type);
			setUserDialogOpen(true);
		}
	};

	const handleConfirmUserAction = async (userParam?: TeamMember, typeParam?: any) => {
		const u = userParam || targetUser;
		const type = typeParam || userActionType;
		if (!u || !selectedOrg) return;

		setUserActionLoading(true);
		try {
			if (type === 'deactivate') {
				await dispatch(deactivateOrgUser(u.public_id)).unwrap();
				toast.success(`${u.full_name || u.username} has been deactivated.`);
			} else if (type === 'reactivate') {
				await dispatch(reactivateOrgUser(u.public_id)).unwrap();
				toast.success(`${u.full_name || u.username} has been reactivated.`);
			} else if (type === 'delete') {
				await dispatch(deleteOrgUser(u.public_id)).unwrap();
				toast.success(`${u.full_name || u.username} has been deleted.`);
			} else if (type === 'resendInvite') {
				await dispatch(resendOrgUserInvite(u.public_id)).unwrap();
				toast.success(`Invite resent to ${u.email}.`);
			}

			dispatch(fetchAdminStats());
			dispatch(fetchOrganizations({ page: page + 1, pageSize: rowsPerPage }));
		} catch (error: any) {
			toast.error(error || `Failed to ${type} user`);
		} finally {
			setUserActionLoading(false);
			setUserDialogOpen(false);
			setTargetUser(null);
		}
	};

	const handleSelectOrg = (org: Organization | null) => {
		setSelectedOrg(org);
		if (org) {
			dispatch(fetchOrgUsers(org.public_id));
		}
	};

	return {
		organizations,
		loading,
		total,
		stats,
		selectedOrgUsers,
		selectedOrgUsersLoading,
		selectedOrgUsersError,
		page,
		setPage,
		rowsPerPage,
		setRowsPerPage,
		createDialogOpen,
		setCreateDialogOpen,
		statusDialogOpen,
		setStatusDialogOpen,
		statusAction,
		targetOrg,
		statusLoading,
		extendTrialOpen,
		setExtendTrialOpen,
		extendDays,
		setExtendDays,
		extendLoading,
		selectedOrg,
		handleSelectOrg,
		userSearchTerm,
		setUserSearchTerm,
		userDialogOpen,
		setUserDialogOpen,
		userActionType,
		targetUser,
		userActionLoading,
		fetchData,
		handleOpenExtendTrial,
		handleConfirmExtendTrial,
		handleDeactivate,
		handleReactivate,
		handleConfirmStatusChange,
		handleUserAction,
		handleConfirmUserAction
	};
};
