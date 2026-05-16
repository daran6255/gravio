import { useState, useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { fetchActivities, deleteActivities } from '../../../../store/slices/dsrSlice';
import type { DSRActivity } from '../../../../models/dsr';
import useToast from '../../../../hooks/useToast';

export const useActivityTable = (projectId: string, refreshKey: number) => {
	const dispatch = useAppDispatch();
	const toast = useToast();
	const { activities, loading, totalActivities: totalCount } = useAppSelector((state) => state.dsr);

	const [searchTerm, setSearchTerm] = useState('');
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(10);
	const [statusFilter, setStatusFilter] = useState<string>('all');
	const [manualRefresh, setManualRefresh] = useState(0);
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

	const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
	const [actionAnchorEl, setActionAnchorEl] = useState<null | HTMLElement>(null);
	const [activeActivity, setActiveActivity] = useState<DSRActivity | null>(null);

	const fetchActivitiesData = useCallback(() => {
		if (projectId) {
			dispatch(fetchActivities({
				projectId,
				skip: page * rowsPerPage,
				limit: rowsPerPage,
				search: searchTerm,
				status: statusFilter === 'all' ? undefined : statusFilter
			}));
		}
	}, [dispatch, projectId, page, rowsPerPage, searchTerm, statusFilter]);

	useEffect(() => {
		fetchActivitiesData();
		setSelectedIds(new Set()); // Clear selection on data reload
	}, [fetchActivitiesData, refreshKey, manualRefresh]);

	const handlePageChange = (_event: unknown, newPage: number) => {
		setPage(newPage);
	};

	const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setRowsPerPage(parseInt(event.target.value, 10));
		setPage(0);
	};

	const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(event.target.value);
		setPage(0);
	};

	const handleFilterClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		setFilterAnchorEl(event.currentTarget);
	};

	const handleFilterClose = () => {
		setFilterAnchorEl(null);
	};

	const handleStatusSelect = (status: string) => {
		setStatusFilter(status);
		setPage(0);
		handleFilterClose();
	};

	const handleActionClick = (event: React.MouseEvent<HTMLButtonElement>, activity: DSRActivity) => {
		setActionAnchorEl(event.currentTarget);
		setActiveActivity(activity);
	};

	const handleActionClose = () => {
		setActionAnchorEl(null);
		setActiveActivity(null);
	};

	const handleRefresh = () => {
		setManualRefresh(prev => prev + 1);
	};

	const handleSelectAll = (checked: boolean) => {
		if (checked) {
			const allIds = activities.map(a => a.public_id);
			setSelectedIds(new Set(allIds));
		} else {
			setSelectedIds(new Set());
		}
	};

	const handleToggleSelect = (id: string) => {
		setSelectedIds(prev => {
			const next = new Set(prev);
			if (next.has(id)) {
				next.delete(id);
			} else {
				next.add(id);
			}
			return next;
		});
	};

	const handleBulkDelete = async () => {
		if (selectedIds.size === 0) return;
		try {
			await dispatch(deleteActivities(Array.from(selectedIds))).unwrap();
			toast.success(`Successfully deleted ${selectedIds.size} activit${selectedIds.size === 1 ? 'y' : 'ies'}`);
			setSelectedIds(new Set());
			handleRefresh();
		} catch (error: any) {
			toast.error(error || 'Failed to delete activities');
		}
	};

	return {
		activities,
		loading,
		totalCount,
		searchTerm,
		page,
		rowsPerPage,
		statusFilter,
		filterAnchorEl,
		actionAnchorEl,
		activeActivity,
		filterOpen: Boolean(filterAnchorEl),
		actionOpen: Boolean(actionAnchorEl),
		handlePageChange,
		handleRowsPerPageChange,
		handleSearch,
		handleFilterClick,
		handleFilterClose,
		handleStatusSelect,
		handleActionClick,
		handleActionClose,
		handleRefresh,
		handleSelectAll,
		handleToggleSelect,
		handleBulkDelete,
		selectedIds,
		setRowsPerPage
	};
};
