import React from 'react';
import { Box, useTheme } from '@mui/material';
import StatCard from '../../common/stats/StatCard';
import { Assignment, PendingActions, CheckCircle, Cancel } from '@mui/icons-material';
import { useAppSelector } from '../../../store/hooks';

const CounselingStats: React.FC = () => {
	const theme = useTheme();
	const { stats } = useAppSelector((state) => state.candidates);

	if (!stats) return null;

	const screenedCompleted = stats.screening_distribution?.['Completed'] || 0;
	const selected = stats.counseling_selected || 0;
	const rejected = stats.counseling_rejected || 0;
	const totalCounseled = stats.total_counseled || 0;

	const yetToBeCounseled = Math.max(0, screenedCompleted - totalCounseled);

	return (
		<Box sx={{ display: 'flex', gap: 3, mb: 3, flexWrap: 'wrap' }}>
			<Box sx={{ flex: '1 1 250px' }}>
				<StatCard
					title="Screened Completed"
					count={screenedCompleted.toString()}
					icon={<Assignment fontSize="large" />}
					color={theme.palette.info.main}
					subtitle="Qualified for counseling"
				/>
			</Box>
			<Box sx={{ flex: '1 1 250px' }}>
				<StatCard
					title="Selected"
					count={selected.toString()}
					icon={<CheckCircle fontSize="large" />}
					color={theme.palette.success.main}
					subtitle="Ready for training batches"
				/>
			</Box>
			<Box sx={{ flex: '1 1 250px' }}>
				<StatCard
					title="Yet To Be Counseled"
					count={yetToBeCounseled.toString()}
					icon={<PendingActions fontSize="large" />}
					color={theme.palette.warning.main}
					subtitle="Awaiting counselor review"
				/>
			</Box>
			<Box sx={{ flex: '1 1 250px' }}>
				<StatCard
					title="Rejected"
					count={rejected.toString()}
					icon={<Cancel fontSize="large" />}
					color={theme.palette.error.main}
					subtitle="Not suitable for current batches"
				/>
			</Box>
		</Box>
	);
};

export default React.memo(CounselingStats);
