import { useState, useEffect, useCallback } from 'react';
import type { SelectChangeEvent } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchCandidates } from '../../../store/slices/candidateSlice';
import candidateService from '../../../services/candidateService';
import type { CandidateListItem } from '../../../models/candidate';

export const useCandidateTable = () => {
	const dispatch = useAppDispatch();
	const { list: candidates, loading, total: totalCount } = useAppSelector((state) => state.candidates);
	const { user } = useAppSelector((state) => state.auth);

	const [searchTerm, setSearchTerm] = useState('');
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(5);
	const [order, setOrder] = useState<'asc' | 'desc'>('desc');
	const [orderBy, setOrderBy] = useState<keyof CandidateListItem>('created_at');
	const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

	// Filter state
	const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
	const [filters, setFilters] = useState({
		disability_type: [] as string[],
		education_level: [] as string[],
		city: [] as string[],
		counseling_status: '' as string,
		registration_type: [] as string[]
	});
	const [filterOptions, setFilterOptions] = useState<{
		disability_types: string[];
		education_levels: string[];
		cities: string[];
		counseling_statuses: string[];
		registration_types: string[];
	}>({ disability_types: [], education_levels: [], cities: [], counseling_statuses: [], registration_types: [] });

	// Assignment state
	const [assignDialogOpen, setAssignDialogOpen] = useState(false);
	const [candidateForAssignment, setCandidateForAssignment] = useState<CandidateListItem | null>(null);

	// Delete state
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [candidateToDelete, setCandidateToDelete] = useState<{ id: string; name: string } | null>(null);
	const [deleteLoading, setDeleteLoading] = useState(false);
	const [notification, setNotification] = useState<{
		open: boolean;
		message: string;
		severity: 'success' | 'error';
	}>({ open: false, message: '', severity: 'success' });

	const fetchCandidatesData = useCallback(async () => {
		const filterParams: Record<string, unknown> = {
			skip: page * rowsPerPage,
			limit: rowsPerPage,
			search: debouncedSearchTerm,
			sortBy: orderBy,
			sortOrder: order
		};

		if (filters.disability_type.length > 0) {
			filterParams.disability_types = filters.disability_type.join(',');
		}
		if (filters.education_level.length > 0) {
			filterParams.education_levels = filters.education_level.join(',');
		}
		if (filters.city.length > 0) {
			filterParams.cities = filters.city.join(',');
		}
		if (filters.counseling_status) {
			filterParams.counseling_status = filters.counseling_status;
		}
		if (filters.registration_type.length > 0) {
			filterParams.registration_type = filters.registration_type.join(',');
		}

		dispatch(fetchCandidates(filterParams));
	}, [page, rowsPerPage, debouncedSearchTerm, orderBy, order, filters, dispatch]);

	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearchTerm(searchTerm);
		}, 500);

		return () => clearTimeout(timer);
	}, [searchTerm]);

	useEffect(() => {
		fetchCandidatesData();
	}, [fetchCandidatesData]);

	useEffect(() => {
		const fetchFilterOptions = async () => {
			try {
				const options = await candidateService.getFilterOptions();
				setFilterOptions(options);
			} catch (error) {
				console.error('Failed to fetch filter options:', error);
			}
		};
		fetchFilterOptions();
	}, []);

	const handleChangePage = (_event: unknown, newPage: number) => {
		setPage(newPage);
	};

	const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<number>) => {
		setRowsPerPage(parseInt(event.target.value as string, 10));
		setPage(0);
	};

	const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(event.target.value);
		setPage(0);
	};

	const handleRequestSort = (property: keyof CandidateListItem) => {
		const isAsc = orderBy === property && order === 'asc';
		setOrder(isAsc ? 'desc' : 'asc');
		setOrderBy(property);
	};

	const handleFilterOpen = () => setFilterDrawerOpen(true);
	const handleFilterClose = () => setFilterDrawerOpen(false);
	const handleFilterChange = (key: string, value: unknown) => setFilters(prev => ({ ...prev, [key]: value }));

	const applyFilters = () => {
		setPage(0);
		handleFilterClose();
	};

	const clearFilters = () => {
		setFilters({
			disability_type: [],
			education_level: [],
			city: [],
			counseling_status: '',
			registration_type: []
		});
		setPage(0);
	};

	const handleDeleteClick = (candidate: CandidateListItem) => {
		setCandidateToDelete({ id: candidate.public_id, name: candidate.name });
		setDeleteDialogOpen(true);
	};

	const handleDeleteConfirm = async () => {
		if (!candidateToDelete) return;

		setDeleteLoading(true);
		try {
			await candidateService.delete(candidateToDelete.id);
			setNotification({
				open: true,
				message: `Candidate "${candidateToDelete.name}" deleted successfully`,
				severity: 'success'
			});
			fetchCandidatesData(); // Refresh list
		} catch (error: any) {
			console.error('Delete failed:', error);
			setNotification({
				open: true,
				message: error.response?.data?.detail || 'Failed to delete candidate',
				severity: 'error'
			});
		} finally {
			setDeleteLoading(false);
			setDeleteDialogOpen(false);
			setCandidateToDelete(null);
		}
	};

	const handleDeleteCancel = () => {
		setDeleteDialogOpen(false);
		setCandidateToDelete(null);
	};

	const handleAssignClick = (candidate: CandidateListItem) => {
		setCandidateForAssignment(candidate);
		setAssignDialogOpen(true);
	};

	const handleAssignCancel = () => {
		setAssignDialogOpen(false);
		setCandidateForAssignment(null);
	};

	const handleCloseNotification = () => {
		setNotification(prev => ({ ...prev, open: false }));
	};

	const [selectedIds, setSelectedIds] = useState<string[]>([]);

	const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
		if (event.target.checked) {
			setSelectedIds(candidates.map(c => c.public_id));
		} else {
			setSelectedIds([]);
		}
	};

	const handleSelectOne = (id: string) => {
		setSelectedIds(prev => {
			if (prev.includes(id)) {
				return prev.filter(item => item !== id);
			} else {
				return [...prev, id];
			}
		});
	};

	useEffect(() => {
		setSelectedIds([]);
	}, [candidates]);

	const handleBulkAssignClick = () => {
		if (selectedIds.length > 0) {
			setAssignDialogOpen(true);
		}
	};

	const selectedCandidates = candidates.filter(c => selectedIds.includes(c.public_id));

	return {
		candidates,
		loading,
		totalCount,
		user,
		searchTerm,
		page,
		rowsPerPage,
		order,
		orderBy,
		filterDrawerOpen,
		filters,
		filterOptions,
		deleteDialogOpen,
		candidateToDelete,
		deleteLoading,
		assignDialogOpen,
		candidateForAssignment,
		notification,
		selectedIds,
		selectedCandidates,
		fetchCandidatesData,
		handleChangePage,
		handleChangeRowsPerPage,
		handleSearch,
		handleRequestSort,
		handleFilterOpen,
		handleFilterClose,
		handleFilterChange,
		applyFilters,
		clearFilters,
		handleDeleteClick,
		handleDeleteConfirm,
		handleDeleteCancel,
		handleAssignClick,
		handleAssignCancel,
		handleSelectAll,
		handleSelectOne,
		handleBulkAssignClick,
		handleCloseNotification,
		setRowsPerPage // Exposed for CustomTablePagination
	};
};
