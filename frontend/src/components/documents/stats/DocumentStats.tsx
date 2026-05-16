import React, { useEffect } from 'react';
import { Box, useTheme } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchCandidateStats } from '../../../store/slices/candidateSlice';
import StatCard from '../../common/stats/StatCard';
import {
	Description as FilesIcon,
	CheckCircle as CompleteIcon,
	PendingActions as PartialIcon,
	FolderOff as NoneIcon
} from '@mui/icons-material';

/**
 * DocumentStats - Specialized dashboard for document collection metrics.
 * Mirrors the CounselingStats architecture for consistent UI presentation.
 */
const DocumentStats: React.FC = () => {
	const theme = useTheme();
	const dispatch = useAppDispatch();
	const { stats } = useAppSelector((state) => state.candidates);

	useEffect(() => {
		if (!stats) {
			dispatch(fetchCandidateStats());
		}
	}, [dispatch, stats]);

	if (!stats) return null;

	return (
		<Box sx={{ display: 'flex', gap: 3, mb: 3, flexWrap: 'wrap' }}>
			<Box sx={{ flex: '1 1 250px' }}>
				<StatCard
					title="Files Collected"
					count={stats.files_collected?.toString() || '0'}
					icon={<FilesIcon fontSize="large" />}
					color={theme.palette.info.main}
					subtitle={`Target: ${stats.files_to_collect || 0} docs`}
				/>
			</Box>

			<Box sx={{ flex: '1 1 250px' }}>
				<StatCard
					title="Compliance Full"
					count={stats.candidates_fully_submitted?.toString() || '0'}
					icon={<CompleteIcon fontSize="large" />}
					color={theme.palette.success.main}
					subtitle="All mandatory docs verified"
				/>
			</Box>

			<Box sx={{ flex: '1 1 250px' }}>
				<StatCard
					title="Compliance Partial"
					count={stats.candidates_partially_submitted?.toString() || '0'}
					icon={<PartialIcon fontSize="large" />}
					color={theme.palette.warning.main}
					subtitle="Awaiting pending docs"
				/>
			</Box>

			<Box sx={{ flex: '1 1 250px' }}>
				<StatCard
					title="Zero Documentation"
					count={stats.candidates_not_submitted?.toString() || '0'}
					icon={<NoneIcon fontSize="large" />}
					color={theme.palette.error.main}
					subtitle="Initial collection pending"
				/>
			</Box>
		</Box>
	);
};

export default React.memo(DocumentStats);
