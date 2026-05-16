import { useState, useEffect, useCallback } from 'react';
import type { SelectChangeEvent } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { fetchJobRoles, deleteJobRole, updateJobRoleStatus } from '../../../../store/slices/jobRoleSlice';
import useToast from '../../../../hooks/useToast';
import type { JobRole } from '../../../../models/jobRole';

export const useJobRoleTable = () => {
	const dispatch = useAppDispatch();
	const { list: jobRoles, loading, total: totalCount } = useAppSelector((state) => state.jobRoles);
	const { user } = useAppSelector((state) => state.auth);

	const toast = useToast();

	const [searchTerm, setSearchTerm] = useState('');
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(10);
	const [order, setOrder] = useState<'asc' | 'desc'>('desc');
	const [orderBy, setOrderBy] = useState<keyof JobRole>('created_at');
	const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

	// Committed filters (used for API calls)
	const [filters, setFilters] = useState({
		status: '' as string,
		workplace_type: [] as string[],
		job_type: [] as string[]
	});

	// Local filters (pending selection in the drawer)
	const [localFilters, setLocalFilters] = useState({
		status: '' as string,
		workplace_type: [] as string[],
		job_type: [] as string[]
	});

	const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [closeDialogOpen, setCloseDialogOpen] = useState(false);
	const [jobRoleToDelete, setJobRoleToDelete] = useState<JobRole | null>(null);
	const [jobRoleToClose, setJobRoleToClose] = useState<JobRole | null>(null);
	const [reason, setReason] = useState('');
	const [deleteLoading, setDeleteLoading] = useState(false);
	const [closeLoading, setCloseLoading] = useState(false);

	const fetchJobRolesData = useCallback(async () => {
		const filterParams: any = {
			skip: page * rowsPerPage,
			limit: rowsPerPage,
			search: debouncedSearchTerm,
			sortBy: orderBy,
			sortOrder: order
		};

		if (filters.status) {
			filterParams.status = filters.status;
		}
		if (filters.workplace_type.length > 0) {
			filterParams.workplace_type = filters.workplace_type.join(',');
		}
		if (filters.job_type.length > 0) {
			filterParams.job_type = filters.job_type.join(',');
		}

		dispatch(fetchJobRoles(filterParams));
	}, [page, rowsPerPage, debouncedSearchTerm, orderBy, order, filters, dispatch]);

	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearchTerm(searchTerm);
		}, 500);
		return () => clearTimeout(timer);
	}, [searchTerm]);

	useEffect(() => {
		fetchJobRolesData();
	}, [fetchJobRolesData]);

	const handleChangePage = (_event: unknown, newPage: number) => setPage(newPage);

	const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<number>) => {
		setRowsPerPage(parseInt(event.target.value as string, 10));
		setPage(0);
	};

	const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(event.target.value);
		setPage(0);
	};

	const handleRequestSort = (property: keyof JobRole) => {
		const isAsc = orderBy === property && order === 'asc';
		setOrder(isAsc ? 'desc' : 'asc');
		setOrderBy(property);
	};

	const handleFilterOpen = () => {
		// Sync local state from committed state when opening
		setLocalFilters(filters);
		setFilterDrawerOpen(true);
	};

	const handleFilterClose = () => setFilterDrawerOpen(false);

	const handleFilterChange = (key: string, value: any) => {
		// Update only local state
		setLocalFilters(prev => ({ ...prev, [key]: value }));
	};

	const applyFilters = () => {
		// Commit local state to primary state
		setFilters(localFilters);
		setPage(0);
		handleFilterClose();
	};

	const clearFilters = () => {
		const reset = { status: '', workplace_type: [], job_type: [] };
		setLocalFilters(reset);
		setFilters(reset);
		setPage(0);
		handleFilterClose();
	};

	const handleDeleteClick = (jobRole: JobRole) => {
		setJobRoleToDelete(jobRole);
		setDeleteDialogOpen(true);
	};

	const handleDeleteConfirm = async () => {
		if (!jobRoleToDelete) return;
		setDeleteLoading(true);
		try {
			await dispatch(deleteJobRole({ publicId: jobRoleToDelete.public_id, reason })).unwrap();
			toast.success(`Job Role "${jobRoleToDelete.title}" deleted successfully`);
			fetchJobRolesData();
		} catch (error: any) {
			toast.error(error || 'Failed to delete job role');
		} finally {
			setDeleteLoading(false);
			setDeleteDialogOpen(false);
			setJobRoleToDelete(null);
			setReason('');
		}
	};

	const handleCloseClick = (jobRole: JobRole) => {
		setJobRoleToClose(jobRole);
		setCloseDialogOpen(true);
	};

	const handleCloseConfirm = async () => {
		if (!jobRoleToClose) return;
		setCloseLoading(true);
		try {
			await dispatch(updateJobRoleStatus({ 
				publicId: jobRoleToClose.public_id, 
				status: 'closed' as any,
				reason 
			})).unwrap();
			toast.success(`Job Role "${jobRoleToClose.title}" marked as closed`);
			fetchJobRolesData();
		} catch (error: any) {
			toast.error(error || 'Failed to close job role');
		} finally {
			setCloseLoading(false);
			setCloseDialogOpen(false);
			setJobRoleToClose(null);
			setReason('');
		}
	};

	const handleCloseCancel = () => {
		setCloseDialogOpen(false);
		setJobRoleToClose(null);
		setReason('');
	};

	const handleReopenJobRole = async (jobRole: JobRole) => {
		try {
			await dispatch(updateJobRoleStatus({ publicId: jobRole.public_id, status: 'active' as any })).unwrap();
			toast.success(`Job Role "${jobRole.title}" re-opened successfully`);
			fetchJobRolesData();
		} catch (error: any) {
			toast.error(error || 'Failed to re-open job role');
		}
	};

	const handleDeleteCancel = () => {
		setDeleteDialogOpen(false);
		setJobRoleToDelete(null);
	};

	return {
		jobRoles,
		loading,
		totalCount,
		user,
		searchTerm,
		page,
		rowsPerPage,
		order,
		orderBy,
		filterDrawerOpen,
		filters: localFilters, // Pass local state to the drawer for pending selection
		deleteDialogOpen,
		closeDialogOpen,
		jobRoleToDelete,
		jobRoleToClose,
		reason,
		deleteLoading,
		closeLoading,
		fetchJobRolesData,
		handleChangePage,
		handleChangeRowsPerPage,
		handleSearch,
		handleRequestSort,
		handleFilterOpen,
		handleFilterClose,
		handleFilterChange,
		applyFilters,
		clearFilters,
		handleCloseClick,
		handleCloseConfirm,
		handleCloseCancel,
		handleReopenJobRole,
		handleDeleteClick,
		handleDeleteConfirm,
		handleDeleteCancel,
		setReason,
		setRowsPerPage
	};
};
