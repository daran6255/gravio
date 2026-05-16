import { useState, useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchUnscreenedCandidates, fetchScreenedCandidates } from '../../../store/slices/candidateSlice';
import { candidateService } from '../../../services/candidateService';
import type { CandidateListItem } from '../../../models/candidate';

interface UseScreeningTableProps {
	type: 'unscreened' | 'screened';
	status?: string;
	refreshTrigger?: number;
}

export const useScreeningTable = ({ type, status, refreshTrigger = 0 }: UseScreeningTableProps) => {
	const dispatch = useAppDispatch();
	const { list: candidates, loading, total: totalCount } = useAppSelector((state) => state.candidates);

	const [searchTerm, setSearchTerm] = useState('');
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(5);
	const [order, setOrder] = useState<'asc' | 'desc'>('desc');
	const [orderBy, setOrderBy] = useState<keyof CandidateListItem>(
		type === 'screened' ? 'screening_updated_at' : 'created_at'
	);

	const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

	// Filter state
	const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
	const [filters, setFilters] = useState<Record<string, any>>({
		disability_types: [],
		education_levels: [],
		cities: [],
		counseling_status: '',
		screening_status: status || '',
		is_experienced: ''
	});
	const [filterOptions, setFilterOptions] = useState({
		disability_types: [] as string[],
		education_levels: [] as string[],
		cities: [] as string[],
		counseling_statuses: [] as string[],
		screening_statuses: [] as string[]
	});

	// Update filters when status prop changes
	useEffect(() => {
		setFilters(prev => ({
			...prev,
			screening_status: status || ''
		}));
	}, [status]);

	// Debounce search term
	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearchTerm(searchTerm);
		}, 500);
		return () => clearTimeout(timer);
	}, [searchTerm]);

	const fetchCandidatesData = useCallback(() => {
		const params = {
			skip: page * rowsPerPage,
			limit: rowsPerPage,
			search: debouncedSearchTerm,
			sortBy: orderBy,
			sortOrder: order,
			disability_types: filters.disability_types?.join(',') || '',
			education_levels: filters.education_levels?.join(',') || '',
			cities: filters.cities?.join(',') || '',
			is_experienced: filters.is_experienced === '' ? undefined : filters.is_experienced
		};

		if (type === 'unscreened') {
			dispatch(fetchUnscreenedCandidates({
				...params,
				screening_status: filters.screening_status,
				counseling_status: filters.counseling_status
			}));
		} else {
			dispatch(fetchScreenedCandidates({
				...params,
				counselingStatus: filters.counseling_status,
				screening_status: filters.screening_status || status
			}));
		}
	}, [dispatch, type, page, rowsPerPage, debouncedSearchTerm, orderBy, order, filters, status, refreshTrigger]);

	const fetchFilterOptions = useCallback(async () => {
		try {
			const options = await candidateService.getFilterOptions();
			setFilterOptions(options);
		} catch (error) {
			console.error('Failed to fetch filter options:', error);
		}
	}, []);

	useEffect(() => {
		fetchFilterOptions();
	}, [fetchFilterOptions]);

	useEffect(() => {
		fetchCandidatesData();
	}, [fetchCandidatesData]);

	const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(event.target.value);
		setPage(0);
	};

	const handleChangePage = (_event: unknown, newPage: number) => {
		setPage(newPage);
	};

	const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
		setRowsPerPage(parseInt(event.target.value, 10));
		setPage(0);
	};

	const handleRequestSort = (property: keyof CandidateListItem) => {
		const isAsc = orderBy === property && order === 'asc';
		setOrder(isAsc ? 'desc' : 'asc');
		setOrderBy(property);
	};

	const handleFilterChange = (key: string, value: any) => {
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
	};

	const handleClearFilters = () => {
		setFilters({
			disability_types: [],
			education_levels: [],
			cities: [],
			counseling_status: '',
			screening_status: status || '',
			is_experienced: ''
		});
		setPage(0);
	};

	const handleApplyFilters = () => {
		setFilterDrawerOpen(false);
		setPage(0);
		fetchCandidatesData();
	};

	return {
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
		setFilterDrawerOpen,
		handleSearch,
		handleChangePage,
		handleChangeRowsPerPage,
		handleRequestSort,
		handleFilterChange,
		handleClearFilters,
		handleApplyFilters,
		fetchCandidatesData,
		setRowsPerPage
	};
};
