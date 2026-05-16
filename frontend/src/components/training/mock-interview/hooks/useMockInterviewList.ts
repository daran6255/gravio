import { useState, useEffect, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { type AppDispatch, type RootState } from '../../../../store/store';
import { fetchMockInterviewsByBatch, deleteMockInterview, setCurrentMockInterview } from '../../../../store/slices/mockInterviewSlice';
import type { MockInterview } from '../../../../models/MockInterview';
import useToast from '../../../../hooks/useToast';

export const useMockInterviewList = (batchId: number) => {
	const dispatch = useDispatch<AppDispatch>();
	const { mockInterviews, loading } = useSelector((state: RootState) => state.mockInterviews);

	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(10);
	const [searchTerm, setSearchTerm] = useState('');
	const [filterCandidateId, setFilterCandidateId] = useState<number | null>(null);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [viewMode, setViewMode] = useState(false);

	useEffect(() => {
		if (batchId) {
			dispatch(fetchMockInterviewsByBatch(batchId));
		}
	}, [dispatch, batchId]);

	const handleRefresh = useCallback(() => {
		dispatch(fetchMockInterviewsByBatch(batchId));
	}, [dispatch, batchId]);

	const handleChangePage = useCallback((_event: unknown, newPage: number) => {
		setPage(newPage);
	}, []);

	const handleChangeRowsPerPage = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
		setRowsPerPage(parseInt(event.target.value, 10));
		setPage(0);
	}, []);

	const handleCreate = useCallback(() => {
		dispatch(setCurrentMockInterview(null));
		setViewMode(false);
		setIsFormOpen(true);
	}, [dispatch]);

	const handleEdit = useCallback((interview: MockInterview) => {
		dispatch(setCurrentMockInterview(interview));
		setViewMode(false);
		setIsFormOpen(true);
	}, [dispatch]);

	const handleView = useCallback((interview: MockInterview) => {
		dispatch(setCurrentMockInterview(interview));
		setViewMode(true);
		setIsFormOpen(true);
	}, [dispatch]);

	const toast = useToast();

	const handleDelete = useCallback(async (id: number) => {
		try {
			await dispatch(deleteMockInterview(id)).unwrap();
			toast.success('Mock interview record deleted successfully');
		} catch (error: any) {
			toast.error(error?.message || 'Failed to delete mock interview record');
		}
	}, [dispatch, toast]);

	const filteredInterviews = useMemo(() => {
		return mockInterviews.filter(interview => {
			const matchesSearch = interview.interviewer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
				interview.status.toLowerCase().includes(searchTerm.toLowerCase());
			const matchesCandidate = filterCandidateId ? interview.candidate_id === filterCandidateId : true;
			return matchesSearch && matchesCandidate;
		});
	}, [mockInterviews, searchTerm, filterCandidateId]);

	const stats = useMemo(() => {
		const total = mockInterviews.length;
		const cleared = mockInterviews.filter(i => i.status === 'cleared').length;
		const absent = mockInterviews.filter(i => i.status === 'absent').length;
		const uniqueCandidates = new Set(mockInterviews.filter(i => i.status !== 'absent').map(i => i.candidate_id)).size;
		const ratedInterviews = mockInterviews.filter(i => i.overall_rating !== undefined && i.overall_rating !== null);
		const avgRating = ratedInterviews.length > 0
			? ratedInterviews.reduce((sum, i) => sum + (i.overall_rating || 0), 0) / ratedInterviews.length
			: 0;

		return {
			total,
			cleared,
			absent,
			uniqueCandidates,
			avgRating: avgRating.toFixed(1)
		};
	}, [mockInterviews]);

	return {
		mockInterviews: filteredInterviews,
		loading,
		page,
		rowsPerPage,
		searchTerm,
		filterCandidateId,
		isFormOpen,
		viewMode,
		stats,
		setSearchTerm,
		setFilterCandidateId,
		setIsFormOpen,
		handleRefresh,
		handleChangePage,
		handleChangeRowsPerPage,
		handleCreate,
		handleEdit,
		handleView,
		handleDelete,
		setRowsPerPage
	};
};
