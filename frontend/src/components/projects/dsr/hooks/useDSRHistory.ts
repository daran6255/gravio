import { useState, useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { fetchMyEntries, deleteEntry } from '../../../../store/slices/dsrSlice';
import useToast from '../../../../hooks/useToast';
import type { DSRStatus } from '../../../../models/dsr';

export const useDSRHistory = () => {
	const dispatch = useAppDispatch();
	const toast = useToast();

	const { myEntries: entries, totalMyEntries: total, loading } = useAppSelector((state) => state.dsr);

	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(10);
	const [expandedRow, setExpandedRow] = useState<string | null>(null);

	// Filters
	const [searchTerm, setSearchTerm] = useState('');
	const [status, setStatus] = useState<DSRStatus | ''>('');
	const [dateFrom, setDateFrom] = useState('');
	const [dateTo, setDateTo] = useState('');

	const fetchHistory = useCallback(() => {
		dispatch(fetchMyEntries({
			skip: page * rowsPerPage,
			limit: rowsPerPage,
			date_from: dateFrom || undefined,
			date_to: dateTo || undefined,
			status: (status as DSRStatus) || undefined,
			search: searchTerm || undefined
		}));
	}, [dispatch, page, rowsPerPage, status, dateFrom, dateTo, searchTerm]);

	useEffect(() => {
		fetchHistory();
	}, [fetchHistory]);

	const handleDelete = async (publicId: string) => {
		if (window.confirm('Are you sure you want to delete this draft?')) {
			try {
				await dispatch(deleteEntry(publicId)).unwrap();
				toast.success('Draft deleted successfully');
			} catch (error: any) {
				toast.error(error || 'Failed to delete draft');
			}
		}
	};

	const handleClearFilters = () => {
		setSearchTerm('');
		setStatus('');
		setDateFrom('');
		setDateTo('');
	};

	return {
		entries,
		total,
		loading,
		page,
		setPage,
		rowsPerPage,
		setRowsPerPage,
		expandedRow,
		setExpandedRow,
		searchTerm,
		setSearchTerm,
		status,
		setStatus,
		dateFrom,
		setDateFrom,
		dateTo,
		setDateTo,
		handleDelete,
		handleClearFilters,
		fetchHistory
	};
};
