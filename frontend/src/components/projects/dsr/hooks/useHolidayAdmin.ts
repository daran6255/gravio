import { useState, useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { fetchHolidays } from '../../../../store/slices/holidaySlice';

export const useHolidayAdmin = () => {
	const dispatch = useAppDispatch();
	const { holidays, totalHolidays: total, loading, error } = useAppSelector((state) => state.holidays);

	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(10);
	const [searchTerm, setSearchTerm] = useState('');

	const fetchBatch = useCallback(() => {
		dispatch(fetchHolidays({
			skip: page * rowsPerPage,
			limit: rowsPerPage
		}));
	}, [dispatch, page, rowsPerPage]);

	useEffect(() => {
		fetchBatch();
	}, [fetchBatch]);

	const handleRefresh = () => fetchBatch();

	return {
		holidays,
		total,
		loading,
		error,
		page,
		setPage,
		rowsPerPage,
		setRowsPerPage,
		searchTerm,
		setSearchTerm,
		handleRefresh
	};
};
