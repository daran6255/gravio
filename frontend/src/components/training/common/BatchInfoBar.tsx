import React from 'react';
import {
	Box,
	Typography,
	Divider,
	Chip,
	Paper,
	Stack,
	alpha,
	useTheme
} from '@mui/material';
import {
	Schedule as ScheduleIcon,
	Group as EnrollmentIcon,
	CheckCircle as StatusIcon
} from '@mui/icons-material';
import type { TrainingBatch } from '../../../models/training';

interface BatchInfoBarProps {
	batch: TrainingBatch;
	enrollmentCount: number;
}

/**
 * Common Batch Information Bar
 * Designed to be used within ModuleHeaders to show training batch context and KPIs.
 */
const BatchInfoBar: React.FC<BatchInfoBarProps> = ({ batch, enrollmentCount }) => {
	const theme = useTheme();

	const getStatusColor = (status: string) => {
		switch (status?.toLowerCase()) {
			case 'planned': return theme.palette.info.main;
			case 'running': return theme.palette.warning.main;
			case 'closed': return theme.palette.text.disabled;
			default: return theme.palette.text.disabled;
		}
	};

	const statusColor = getStatusColor(batch.status);

	return (
		<Paper
			elevation={0}
			sx={{
				bgcolor: alpha(theme.palette.common.white, 0.04),
				borderRadius: 2,
				p: { xs: 1.5, sm: 2 },
				border: '1px solid',
				borderColor: alpha(theme.palette.common.white, 0.1),
				display: 'flex',
				flexWrap: 'wrap',
				alignItems: 'center',
				gap: { xs: 2.5, md: 4 },
				backdropFilter: 'blur(10px)',
			}}
		>
			{/* Batch Identity */}
			<Box>
				<Typography variant="caption" sx={{ color: alpha(theme.palette.common.white, 0.4), display: 'block', mb: 0.75, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.65rem' }}>
					Active Batch
				</Typography>
				<Typography variant="body2" sx={{ fontWeight: 700, color: 'common.white', fontSize: '0.95rem' }}>
					{batch.batch_name}
				</Typography>
			</Box>

			<Divider orientation="vertical" flexItem sx={{ borderColor: alpha(theme.palette.common.white, 0.1), my: 0.5 }} />

			{/* Status */}
			<Box>
				<Typography variant="caption" sx={{ color: alpha(theme.palette.common.white, 0.4), display: 'block', mb: 0.75, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.65rem' }}>
					Status
				</Typography>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
					<StatusIcon sx={{ fontSize: 16, color: statusColor }} />
					<Chip
						label={batch.status.toUpperCase()}
						size="small"
						sx={{
							height: 20,
							fontSize: '0.65rem',
							fontWeight: 900,
							bgcolor: alpha(statusColor, 0.15),
							color: batch.status.toLowerCase() === 'closed' ? alpha(theme.palette.common.white, 0.5) : statusColor,
							borderRadius: 1,
							border: '1px solid',
							borderColor: alpha(statusColor, 0.3)
						}}
					/>
				</Box>
			</Box>

			<Divider orientation="vertical" flexItem sx={{ borderColor: alpha(theme.palette.common.white, 0.1), my: 0.5 }} />

			{/* Schedule */}
			<Box>
				<Typography variant="caption" sx={{ color: alpha(theme.palette.common.white, 0.4), display: 'block', mb: 0.75, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.65rem' }}>
					Schedule
				</Typography>
				<Stack direction="row" spacing={1} alignItems="center">
					<ScheduleIcon sx={{ fontSize: 16, color: theme.palette.primary.light }} />
					<Typography variant="body2" sx={{ color: 'common.white', fontWeight: 600 }}>
						{batch.duration?.weeks} Weeks
					</Typography>
				</Stack>
			</Box>

			<Divider orientation="vertical" flexItem sx={{ borderColor: alpha(theme.palette.common.white, 0.1), my: 0.5 }} />

			{/* Enrollment */}
			<Box>
				<Typography variant="caption" sx={{ color: alpha(theme.palette.common.white, 0.4), display: 'block', mb: 0.75, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.65rem' }}>
					Enrollment
				</Typography>
				<Stack direction="row" spacing={1.5} alignItems="center">
					<EnrollmentIcon sx={{ fontSize: 18, color: theme.palette.secondary.light }} />
					<Typography variant="body2" sx={{ color: 'common.white', fontWeight: 800 }}>
						{enrollmentCount} Candidates
					</Typography>
				</Stack>
			</Box>
		</Paper>
	);
};

export default BatchInfoBar;
