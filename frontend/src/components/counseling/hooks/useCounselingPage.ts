import { useState, useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { 
	createCounseling, 
	updateCounseling, 
	fetchCandidateById, 
	fetchCandidateStats 
} from '../../../store/slices/candidateSlice';
import type { CandidateListItem, CandidateCounselingCreate } from '../../../models/candidate';
import useToast from '../../../hooks/useToast';

/**
 * useCounselingPage - Custom hook for managing candidate counseling page state and logic.
 */
export const useCounselingPage = () => {
	const dispatch = useAppDispatch();
	const toast = useToast();
	const { stats } = useAppSelector((state) => state.candidates);

	const [tabValue, setTabValue] = useState(0);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
	const [refreshKey, setRefreshKey] = useState(0);
	const [initialFormData, setInitialFormData] = useState<CandidateCounselingCreate | undefined>(undefined);

	// Fetch stats on mount and refresh
	useEffect(() => {
		dispatch(fetchCandidateStats());
	}, [dispatch, refreshKey]);

	const handleTabChange = useCallback((_event: React.SyntheticEvent, newValue: number) => {
		setTabValue(newValue);
	}, []);

	const handleAction = useCallback(async (action: 'counsel' | 'edit', candidate: CandidateListItem) => {
		try {
			const resultAction = await dispatch(fetchCandidateById({ publicId: candidate.public_id, withDetails: true }));

			if (fetchCandidateById.fulfilled.match(resultAction)) {
				const fullCandidate = resultAction.payload;
				setSelectedCandidate(fullCandidate);

				if (action === 'counsel') {
					setInitialFormData(undefined);
				} else if (action === 'edit' && fullCandidate.counseling) {
					setInitialFormData({
						...fullCandidate.counseling
					} as CandidateCounselingCreate);
				} else {
					setInitialFormData(undefined);
				}
				setDialogOpen(true);
			} else {
				toast.error('Failed to fetch candidate details');
			}
		} catch (error) {
			toast.error('An error occurred while fetching details');
		}
	}, [dispatch, toast]);

	const handleDialogClose = useCallback(() => {
		setDialogOpen(false);
		setSelectedCandidate(null);
		setInitialFormData(undefined);
	}, []);

	const handleFormSubmit = useCallback(async (data: CandidateCounselingCreate) => {
		try {
			if (selectedCandidate.counseling) {
				await dispatch(updateCounseling({
					publicId: selectedCandidate.public_id,
					counseling: data
				})).unwrap();
				toast.success('Counseling updated successfully');
			} else {
				await dispatch(createCounseling({
					publicId: selectedCandidate.public_id,
					counseling: data
				})).unwrap();
				toast.success('Counseling record created successfully');
			}
			setRefreshKey(prev => prev + 1);
		} catch (error: any) {
			toast.error(error || 'Failed to save counseling record');
		}
	}, [dispatch, selectedCandidate, toast]);

	return {
		stats,
		tabValue,
		dialogOpen,
		selectedCandidate,
		refreshKey,
		initialFormData,
		handleTabChange,
		handleAction,
		handleDialogClose,
		handleFormSubmit
	};
};
