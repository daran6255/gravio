import { useState, useEffect, useCallback } from 'react';
import type { TrainingBatch } from '../../../../models/training';

export const useTrainingTable = () => {
	const [searchTerm, setSearchTerm] = useState('');
	const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(10);
	const [order, setOrder] = useState<'asc' | 'desc'>('desc');
	const [orderBy, setOrderBy] = useState<keyof TrainingBatch>('created_at');

	const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
	const [filters, setFilters] = useState({
		status: '' as string,
		disability_types: [] as string[]
	});

	// Debounce search term
	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearchTerm(searchTerm);
		}, 500);

		return () => clearTimeout(timer);
	}, [searchTerm]);

	const handleSearch = useCallback((value: string) => {
		setSearchTerm(value);
		setPage(0);
	}, []);

	const handleChangePage = useCallback((newPage: number) => {
		setPage(newPage);
	}, []);


	const handleRowsPerPageSelectChange = useCallback((rows: number) => {
		setRowsPerPage(rows);
		setPage(0);
	}, []);

	const handleRequestSort = useCallback((property: keyof TrainingBatch) => {
		setOrder(prevOrder => {
			const isAsc = orderBy === property && prevOrder === 'asc';
			return isAsc ? 'desc' : 'asc';
		});
		setOrderBy(property);
	}, [orderBy]);

	const handleFilterChange = useCallback((key: string, value: any) => {
		setFilters(prev => ({ ...prev, [key]: value }));
	}, []);

	const clearFilters = useCallback(() => {
		setFilters({ status: '', disability_types: [] });
		setPage(0);
	}, []);

	return {
		searchTerm,
		debouncedSearchTerm,
		page,
		rowsPerPage,
		order,
		orderBy,
		filterDrawerOpen,
		filters,
		setFilterDrawerOpen,
		handleSearch,
		handleChangePage,
		handleRequestSort,
		handleFilterChange,
		clearFilters,
		handleRowsPerPageSelectChange,
		setPage
	};
};
