import { useState, useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { 
	fetchScreeningStats, 
	createScreening, 
	updateScreening, 
	fetchCandidateById 
} from '../../../store/slices/candidateSlice';
import useToast from '../../../hooks/useToast';
import type { CandidateListItem, CandidateScreeningCreate } from '../../../models/candidate';

export const useScreeningPage = () => {
	const dispatch = useAppDispatch();
	const toast = useToast();
	const { screeningStats: stats } = useAppSelector((state) => state.candidates);

	const [tabValue, setTabValue] = useState(0);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
	const [refreshKey, setRefreshKey] = useState(0);

	useEffect(() => {
		dispatch(fetchScreeningStats());
	}, [dispatch, refreshKey]);

	const handleTabChange = useCallback((_event: React.SyntheticEvent, newValue: number) => {
		setTabValue(newValue);
	}, []);

	const handleAction = useCallback(async (_action: 'screen' | 'edit', candidate: CandidateListItem) => {
		try {
			const fullCandidate = await dispatch(fetchCandidateById({ publicId: candidate.public_id, withDetails: true })).unwrap();
			setSelectedCandidate(fullCandidate);
			setDialogOpen(true);
		} catch (error) {
			toast.error(`Failed to fetch candidate details: ${error}`);
		}
	}, [dispatch, toast]);

	const handleDialogClose = useCallback(() => {
		setDialogOpen(false);
		setSelectedCandidate(null);
	}, []);

	const handleRefreshCandidate = useCallback(async () => {
		if (!selectedCandidate) return;
		try {
			const fullCandidate = await dispatch(fetchCandidateById({ publicId: selectedCandidate.public_id, withDetails: true })).unwrap();
			setSelectedCandidate(fullCandidate);
		} catch (error) {
			toast.error(`Failed to refresh candidate: ${error}`);
		}
	}, [dispatch, selectedCandidate, toast]);

	const handleScreeningSubmit = useCallback(async (screeningData: CandidateScreeningCreate) => {
		if (!selectedCandidate) return;
		try {
			if (selectedCandidate.screening) {
				await dispatch(updateScreening({ publicId: selectedCandidate.public_id, screening: screeningData })).unwrap();
				toast.success('Screening updated successfully');
			} else {
				await dispatch(createScreening({ publicId: selectedCandidate.public_id, screening: screeningData })).unwrap();
				toast.success('Screening created successfully');
			}
			setRefreshKey(prev => prev + 1);
		} catch (error: any) {
			toast.error(error || 'Failed to save screening');
		}
	}, [dispatch, selectedCandidate, toast]);

	return {
		stats,
		tabValue,
		dialogOpen,
		selectedCandidate,
		refreshKey,
		handleTabChange,
		handleAction,
		handleDialogClose,
		handleRefreshCandidate,
		handleScreeningSubmit
	};
};
