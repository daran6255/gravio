import { useState, useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../../../../store/hooks';
import { fetchMyLeaves, cancelLeaveAction } from '../../../../../store/slices/dsrSlice';
import useToast from '../../../../../hooks/useToast';

export const useMyLeaves = () => {
	const dispatch = useAppDispatch();
	const toast = useToast();

	const { myLeaves: leaves, loading } = useAppSelector((state) => state.dsr);

	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(10);
	const [status, setStatus] = useState<string | ''>('');

	const fetchLeaves = useCallback(() => {
		dispatch(fetchMyLeaves({
			skip: page * rowsPerPage,
			limit: rowsPerPage,
			status: status || undefined
		}));
	}, [dispatch, page, rowsPerPage, status]);

	useEffect(() => {
		fetchLeaves();
	}, [fetchLeaves]);

	const handleCancel = async (publicId: string) => {
		if (window.confirm('Are you sure you want to cancel this leave application?')) {
			try {
				await dispatch(cancelLeaveAction(publicId)).unwrap();
				toast.success('Leave application cancelled');
			} catch (error: any) {
				toast.error(error || 'Failed to cancel leave');
			}
		}
	};

	return {
		leaves,
		loading,
		page,
		setPage,
		rowsPerPage,
		setRowsPerPage,
		status,
		setStatus,
		handleCancel,
		fetchLeaves
	};
};
