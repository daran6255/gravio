import React, { useEffect } from 'react';
import { Box, CircularProgress, Alert, useTheme } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchCandidateStats } from '../../../store/slices/candidateSlice';
import StatCard from '../../common/stats/StatCard';
import PeopleIcon from '@mui/icons-material/People';
import WcIcon from '@mui/icons-material/Wc';
import CheckCircle from '@mui/icons-material/CheckCircle';

const ScreeningStatCard: React.FC = () => {
	const theme = useTheme();
	const dispatch = useAppDispatch();
	// Use statsLoading specifically to avoid flicker when list refreshes
	// @ts-ignore - statsLoading is added to slice but might not be picked up by TS immediately in editor
	const { stats, statsLoading, error } = useAppSelector((state) => state.candidates);

	useEffect(() => {
		dispatch(fetchCandidateStats());
	}, [dispatch]);

	if (statsLoading && !stats) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
				<CircularProgress />
			</Box>
		);
	}

	if (error) {
		return (
			<Alert severity="error" sx={{ mb: 3 }}>
				{error}
			</Alert>
		);
	}

	if (!stats) {
		return null;
	}

	return (
		<Box sx={{ display: 'flex', gap: 3, mb: 3, flexWrap: 'wrap', opacity: statsLoading ? 0.7 : 1, transition: 'opacity 0.2s' }}>
			<Box sx={{ flex: '1 1 200px' }}>
				<StatCard
					title="Total Candidates"
					count={stats.total.toString()}
					icon={<PeopleIcon fontSize="large" />}
					color={theme.palette.primary.main}
					subtitle="Registered in the system"
				/>
			</Box>
			<Box sx={{ flex: '1 1 200px' }}>
				<StatCard
					title="Screened Candidates"
					count={stats.screened?.toString() || '0'}
					icon={<WcIcon fontSize="large" />}
					color={theme.palette.success.main}
					subtitle="Assessment process completed"
				/>
			</Box>
			<Box sx={{ flex: '1 1 200px' }}>
				<StatCard
					title="Selected For Counseling"
					count={stats.screening_distribution?.['Completed']?.toString() || '0'}
					icon={<CheckCircle fontSize="large" />}
					color={theme.palette.info.main}
					subtitle="Ready for next phase"
				/>
			</Box>
			<Box sx={{ flex: '1 1 200px' }}>
				<StatCard
					title="Yet To Be Screened"
					count={stats.not_screened?.toString() || '0'}
					icon={<PeopleIcon fontSize="large" />}
					color={theme.palette.warning.main}
					subtitle="Awaiting initial review"
				/>
			</Box>
		</Box>
	);
};

export default ScreeningStatCard;
