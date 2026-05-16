import React, { useEffect } from 'react';
import { Box, Container } from '@mui/material';
import CandidateStatCards from '../../components/candidates/stats/CandidateStatCards';
import CandidateTable from '../../components/candidates/table/CandidateTable';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchCandidateStats } from '../../store/slices/candidateSlice';
import PageHeader from '../../components/common/page-header';

/**
 * Candidate List Module
 * Standardized dashboard for managing candidate registrations and status.
 */
const CandidateList: React.FC = () => {
	const navigate = useNavigate();
	const dispatch = useAppDispatch();

	const { stats } = useAppSelector((state) => state.candidates);

	useEffect(() => {
		dispatch(fetchCandidateStats());
	}, [dispatch]);

	const defaultStats = {
		total: 0,
		male: 0,
		female: 0,
		others: 0,
		today: 0,
		weekly: [],
		screened: 0,
		not_screened: 0,
		total_counseled: 0,
		counseling_pending: 0,
		counseling_selected: 0,
		counseling_rejected: 0,
		docs_total: 0,
		docs_completed: 0,
		docs_pending: 0,
		files_collected: 0,
		files_to_collect: 0,
		candidates_fully_submitted: 0,
		candidates_partially_submitted: 0,
		candidates_not_submitted: 0,
		in_training: 0,
		moved_to_placement: 0,
		got_job: 0
	};


	const handleViewCandidate = (id: string) => {
		navigate(`/candidates/${id}`);
	};

	return (
		<Container maxWidth="xl" sx={{ py: { xs: 2, sm: 4 } }}>
			<PageHeader 
				title="Candidate List"
				subtitle="Manage candidate registrations, profiles, and status"
			/>
			
			<Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
				<CandidateStatCards stats={stats || defaultStats} />
				<CandidateTable
					onViewCandidate={handleViewCandidate}
				/>
			</Box>
		</Container>
	);
};

export default CandidateList;
