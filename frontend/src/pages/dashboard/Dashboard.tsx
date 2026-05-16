import React, { useEffect } from 'react';
import { Box } from '@mui/material';
import Grid from '@mui/material/Grid';
import CandidateStatsGrid from '../../components/dashboard/CandidateStatsGrid';
import BIReport from '../../components/dashboard/BIReport';
import ApiSpeedometer from '../../components/dashboard/ApiSpeedometer';
import SystemHealthMonitor from '../../components/dashboard/SystemHealthMonitor';
import WelcomeHeader from '../../components/dashboard/WelcomeHeader';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchCandidateStats } from '../../store/slices/candidateSlice';

const Dashboard: React.FC = () => {
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

	const currentStats = stats || defaultStats;

	return (
		<Box component="main" sx={{ p: { xs: 1, sm: 0 } }}>
			<WelcomeHeader />

			<CandidateStatsGrid stats={currentStats} />


			<Grid container spacing={3} sx={{ alignItems: 'stretch' }}>
				<Grid size={{ xs: 12, lg: 9 }}>
					<BIReport />
				</Grid>
				<Grid size={{ xs: 12, lg: 3 }}>
					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, height: '100%' }}>
						<ApiSpeedometer />
						<SystemHealthMonitor />
					</Box>
				</Grid>
			</Grid>
		</Box>
	);
};

export default Dashboard;
