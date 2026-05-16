import { useState, useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import {
	fetchMissingReports,
	fetchAdminOverview,
	sendDSRReminders,
	grantDSRPermission,
	fetchPermissionRequests,
	handlePermissionRequestAction,
	revokeEntryAction,
	fetchAllLeaves,
	handleLeaveAction as handleLeaveActionAction
} from '../../../../store/slices/dsrSlice';
import useToast from '../../../../hooks/useToast';

export const useDSRAdmin = () => {
	const dispatch = useAppDispatch();
	const toast = useToast();
	const { user } = useAppSelector((state) => state.auth);
	const isPrivileged = user?.role === 'admin';
	const {
		missingReports,
		adminEntries,
		totalAdminEntries: totalEntries,
		permissionRequests,
		totalPermissionRequests,
		adminLeaves,
		totalAdminLeaves,
		loading
	} = useAppSelector((state) => state.dsr);

	const entries = adminEntries;

	const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
	const [reminding, setReminding] = useState(false);
	const [entryPage, setEntryPage] = useState(0);
	const [entryRowsPerPage, setEntryRowsPerPage] = useState(10);
	const [submissionsSearchTerm, setSubmissionsSearchTerm] = useState('');
	const [debouncedSubmissionsSearch, setDebouncedSubmissionsSearch] = useState('');
	const [permissionsSearchTerm, setPermissionsSearchTerm] = useState('');
	const [debouncedPermissionsSearch, setDebouncedPermissionsSearch] = useState('');
	const [statusFilter, setStatusFilter] = useState<string | null>(null);
	const [historyDateFrom, setHistoryDateFrom] = useState<string | null>(null);
	const [historyDateTo, setHistoryDateTo] = useState<string | null>(null);
	const [permissionPage, setPermissionPage] = useState(0);
	const [permissionRowsPerPage, setPermissionRowsPerPage] = useState(10);
	const [historyFilterDrawerOpen, setHistoryFilterDrawerOpen] = useState(false);
	const [permissionFilterDrawerOpen, setPermissionFilterDrawerOpen] = useState(false);
	const [permissionStatusFilter, setPermissionStatusFilter] = useState<string | null>(null);
	const [leavePage, setLeavePage] = useState(0);
	const [leaveRowsPerPage, setLeaveRowsPerPage] = useState(10);
	const [leaveStatusFilter, setLeaveStatusFilter] = useState<string | null>(null);
	const [leaveFilterDrawerOpen, setLeaveFilterDrawerOpen] = useState(false);

	useEffect(() => {
		const timer = setTimeout(() => setDebouncedSubmissionsSearch(submissionsSearchTerm), 300);
		return () => clearTimeout(timer);
	}, [submissionsSearchTerm]);

	useEffect(() => {
		const timer = setTimeout(() => setDebouncedPermissionsSearch(permissionsSearchTerm), 300);
		return () => clearTimeout(timer);
	}, [permissionsSearchTerm]);

	const fetchData = useCallback(() => {
		// Only fetch admin data if user has admin/manager role
		if (!isPrivileged) return;
		dispatch(fetchMissingReports(reportDate));
		dispatch(fetchPermissionRequests({ 
			skip: permissionPage * permissionRowsPerPage, 
			limit: permissionRowsPerPage,
			status: permissionStatusFilter || undefined,
			search: debouncedPermissionsSearch || undefined
		}));
		dispatch(fetchAdminOverview({
			skip: entryPage * entryRowsPerPage,
			limit: entryRowsPerPage,
			date_from: historyDateFrom || undefined,
			date_to: historyDateTo || undefined,
			search: debouncedSubmissionsSearch || undefined,
			status: (statusFilter as any) || undefined
		}));
		dispatch(fetchAllLeaves({
			skip: leavePage * leaveRowsPerPage,
			limit: leaveRowsPerPage,
			status: leaveStatusFilter || undefined
		}));
	}, [dispatch, isPrivileged, reportDate, entryPage, entryRowsPerPage, historyDateFrom, historyDateTo, debouncedSubmissionsSearch, statusFilter, permissionPage, permissionRowsPerPage, debouncedPermissionsSearch, permissionStatusFilter, leavePage, leaveRowsPerPage, leaveStatusFilter]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	const handleSendReminders = async () => {
		setReminding(true);
		try {
			await dispatch(sendDSRReminders(reportDate)).unwrap();
			toast.success('Reminders sent successfully');
		} catch (error: any) {
			toast.error(error || 'Failed to send reminders');
		} finally {
			setReminding(false);
		}
	};

	const handleGrantPermission = async (userPublicId: string) => {
		try {
			await dispatch(grantDSRPermission({
				user_public_id: userPublicId,
				target_date: reportDate
			})).unwrap();
			const isToday = reportDate === new Date().toISOString().split('T')[0];
			toast.success(isToday ? 'Draft created for user' : 'Past-date submission permission granted');
			dispatch(fetchMissingReports(reportDate));
			dispatch(fetchAdminOverview({
				skip: entryPage * entryRowsPerPage,
				limit: entryRowsPerPage,
				date_from: reportDate,
				date_to: reportDate
			}));
		} catch (error: any) {
			toast.error(error || 'Failed to grant permission');
		}
	};

	const handleRefresh = () => fetchData();

	const handlePermissionAction = async (publicId: string, status: 'granted' | 'rejected') => {
		try {
			await dispatch(handlePermissionRequestAction({ publicId, status })).unwrap();
			toast.success(`Request ${status} successfully`);
			dispatch(fetchPermissionRequests({ skip: 0, limit: 100 }));
			dispatch(fetchAdminOverview({
				skip: entryPage * entryRowsPerPage,
				limit: entryRowsPerPage,
				date_from: reportDate,
				date_to: reportDate
			}));
		} catch (error: any) {
			toast.error(error || `Failed to ${status} request`);
		}
	};

	const handleRevokeEntry = async (publicId: string, reason?: string) => {
		try {
			await dispatch(revokeEntryAction({ publicId, reason })).unwrap();
			toast.success('Timesheet revoked successfully');
			// Refresh list after revoke
			dispatch(fetchAdminOverview({
				skip: entryPage * entryRowsPerPage,
				limit: entryRowsPerPage,
				date_from: historyDateFrom || undefined,
				date_to: historyDateTo || undefined,
				search: debouncedSubmissionsSearch || undefined,
				status: (statusFilter as any) || undefined
			}));
		} catch (error: any) {
			toast.error(error || 'Failed to revoke timesheet');
		}
	};

	const handleLeaveAction = async (publicId: string, status: 'approved' | 'rejected', admin_notes?: string) => {
		try {
			await dispatch(handleLeaveActionAction({ publicId, status, admin_notes })).unwrap();
			toast.success(`Leave ${status} successfully`);
			dispatch(fetchAllLeaves({
				skip: leavePage * leaveRowsPerPage,
				limit: leaveRowsPerPage,
				status: leaveStatusFilter || undefined
			}));
		} catch (error: any) {
			toast.error(error || `Failed to ${status} leave`);
		}
	};

	const reviewQueueTotal = adminEntries.filter(e => e.status === 'submitted').length;

	return {
		reportDate,
		setReportDate,
		reminding,
		missingReports,
		entries,
		totalEntries,
		permissionRequests,
		totalPermissionRequests,
		reviewQueueTotal,
		loading,
		entryPage,
		setEntryPage,
		entryRowsPerPage,
		setEntryRowsPerPage,
		submissionsSearchTerm,
		setSubmissionsSearchTerm,
		permissionsSearchTerm,
		setPermissionsSearchTerm,
		statusFilter,
		setStatusFilter,
		historyDateFrom,
		setHistoryDateFrom,
		historyDateTo,
		setHistoryDateTo,
		permissionPage,
		setPermissionPage,
		permissionRowsPerPage,
		setPermissionRowsPerPage,
		historyFilterDrawerOpen,
		setHistoryFilterDrawerOpen,
		permissionFilterDrawerOpen,
		setPermissionFilterDrawerOpen,
		permissionStatusFilter,
		setPermissionStatusFilter,
		adminLeaves,
		totalAdminLeaves,
		leavePage,
		setLeavePage,
		leaveRowsPerPage,
		setLeaveRowsPerPage,
		leaveStatusFilter,
		setLeaveStatusFilter,
		leaveFilterDrawerOpen,
		setLeaveFilterDrawerOpen,
		handleSendReminders,
		handleGrantPermission,
		handlePermissionAction,
		handleRevokeEntry,
		handleLeaveAction,
		handleRefresh
	};
};
