import { useState, useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchScreenedCandidates } from '../../../store/slices/candidateSlice';
import { candidateService } from '../../../services/candidateService';
import type { CandidateListItem } from '../../../models/candidate';

interface FilterState {
	disability_types: string[];
	education_levels: string[];
	cities: string[];
	counseling_status: string;
	is_experienced: boolean | string;
	[key: string]: string[] | string | boolean | undefined;
}

export const useCounselingTable = (
	type: 'not_counseled' | 'pending' | 'selected' | 'rejected' | 'counseled',
	refreshKey?: number
) => {
	const dispatch = useAppDispatch();
	const { list: candidates, loading, total: totalCount } = useAppSelector((state) => state.candidates);

	const [searchTerm, setSearchTerm] = useState('');
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(5);
	const [order, setOrder] = useState<'asc' | 'desc'>('desc');
	const [orderBy, setOrderBy] = useState<keyof CandidateListItem>('created_at');
	const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

	// Filter state
	const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
	const [filters, setFilters] = useState<FilterState>({
		disability_types: [],
		education_levels: [],
		cities: [],
		counseling_status: '',
		is_experienced: ''
	});
	const [filterOptions, setFilterOptions] = useState({
		disability_types: [] as string[],
		education_levels: [] as string[],
		cities: [] as string[],
		counseling_statuses: [] as string[]
	});

	// Fetch filter options
	useEffect(() => {
		let isMounted = true;
		const loadOptions = async () => {
			try {
				const options = await candidateService.getFilterOptions();
				if (isMounted) setFilterOptions(options);
			} catch (error) {
				console.error('Failed to fetch filter options:', error);
			}
		};
		void loadOptions();
		return () => { isMounted = false; };
	}, []);

	// Debounce search term
	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearchTerm(searchTerm);
		}, 500);

		return () => clearTimeout(timer);
	}, [searchTerm]);

	// Fetch candidates data
	const fetchCandidatesData = useCallback(async () => {
		// Determine counseling status to fetch based on tab type
		let statusToFetch = filters.counseling_status;
		if (!statusToFetch) {
			if (type === 'not_counseled') statusToFetch = 'not_counseled';
			else if (type === 'pending') statusToFetch = 'pending';
			else if (type === 'selected') statusToFetch = 'selected';
			else if (type === 'rejected') statusToFetch = 'rejected';
			else if (type === 'counseled') statusToFetch = 'counseled';
		}

		dispatch(fetchScreenedCandidates({
			skip: page * rowsPerPage,
			limit: rowsPerPage,
			counselingStatus: statusToFetch,
			search: debouncedSearchTerm,
			sortBy: orderBy,
			sortOrder: order,
			disability_types: filters.disability_types?.join(',') || '',
			education_levels: filters.education_levels?.join(',') || '',
			cities: filters.cities?.join(',') || '',
			is_experienced: filters.is_experienced === '' ? undefined : (filters.is_experienced as boolean),
			screening_status: type === 'not_counseled' ? 'Completed' : undefined
		}));
	}, [dispatch, page, rowsPerPage, type, debouncedSearchTerm, orderBy, order, filters]);

	useEffect(() => {
		fetchCandidatesData();
	}, [fetchCandidatesData, refreshKey]);

	// Event handlers
	const handleChangePage = useCallback((_event: unknown, newPage: number) => {
		setPage(newPage);
	}, []);

	const handleChangeRowsPerPage = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
		setRowsPerPage(parseInt(event.target.value, 10));
		setPage(0);
	}, []);

	const handleSearch = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(event.target.value);
		setPage(0);
	}, []);

	const handleRequestSort = useCallback((property: keyof CandidateListItem) => {
		setOrder(prevOrder => {
			const isAsc = orderBy === property && prevOrder === 'asc';
			return isAsc ? 'desc' : 'asc';
		});
		setOrderBy(property);
	}, [orderBy]);

	const handleFilterOpen = useCallback(() => {
		setFilterDrawerOpen(true);
	}, []);

	const handleFilterClose = useCallback(() => {
		setFilterDrawerOpen(false);
	}, []);

	const handleFilterChange = useCallback((key: string, value: string | string[] | boolean) => {
		// Convert experience values back to boolean/null
		let finalValue = value;
		if (key === 'is_experienced') {
			if (value === 'false') finalValue = false;
			else if (value === 'true') finalValue = true;
			else if (value === '') finalValue = '';
		}

		setFilters(prev => ({
			...prev,
			[key]: finalValue
		}));
	}, []);

	const clearFilters = useCallback(() => {
		setFilters({
			disability_types: [],
			education_levels: [],
			cities: [],
			counseling_status: '',
			is_experienced: ''
		});
		setPage(0);
	}, []);

	const applyFilters = useCallback(() => {
		setFilterDrawerOpen(false);
		setPage(0);
		fetchCandidatesData();
	}, [fetchCandidatesData]);

	const handleRowsPerPageSelectChange = useCallback((rows: number) => {
		setRowsPerPage(rows);
		setPage(0);
	}, []);

	return {
		// Data & State
		candidates,
		loading,
		totalCount,
		searchTerm,
		page,
		rowsPerPage,
		order,
		orderBy,
		filterDrawerOpen,
		filters,
		filterOptions,

		// Handlers
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
		handleRowsPerPageSelectChange
	};
};
