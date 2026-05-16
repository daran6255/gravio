import { useState, useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchScreenedCandidates } from '../../../store/slices/candidateSlice';
import type { CandidateListItem } from '../../../models/candidate';

/**
 * useDocumentPage - Custom hook for managing document collection page state and logic.
 */
export const useDocumentPage = (type?: 'not_collected' | 'pending' | 'collected') => {
	const dispatch = useAppDispatch();
	const { list: candidates, loading, total: totalCount } = useAppSelector((state) => state.candidates);

	const [searchTerm, setSearchTerm] = useState('');
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(5);
	const [order, setOrder] = useState<'asc' | 'desc'>('desc');
	const [orderBy, setOrderBy] = useState<keyof CandidateListItem>('created_at');
	const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

	const fetchCandidatesData = useCallback(() => {
		dispatch(fetchScreenedCandidates({
			skip: page * rowsPerPage,
			limit: rowsPerPage,
			counselingStatus: 'selected',
			search: debouncedSearchTerm,
			documentStatus: type,
			sortBy: orderBy,
			sortOrder: order
		}));
	}, [dispatch, page, rowsPerPage, type, debouncedSearchTerm, order, orderBy]);

	useEffect(() => {
		fetchCandidatesData();
	}, [fetchCandidatesData]);

	// Debounce search term
	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearchTerm(searchTerm);
		}, 500);

		return () => clearTimeout(timer);
	}, [searchTerm]);

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

	return {
		candidates,
		loading,
		totalCount,
		searchTerm,
		page,
		rowsPerPage,
		order,
		orderBy,
		handleSearch,
		handleChangePage,
		handleChangeRowsPerPage,
		handleRequestSort,
		setRowsPerPage,
		setPage,
		refresh: fetchCandidatesData
	};
};
