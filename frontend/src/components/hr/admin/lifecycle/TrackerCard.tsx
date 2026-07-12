import React, { useMemo } from 'react';
import { Box, Chip, CircularProgress, Divider, Stack, Typography, alpha, useTheme } from '@mui/material';
import { WarningAmberRounded as OverdueIcon } from '@mui/icons-material';
import type { HRChecklistInstance } from '../../../../models/hr';

interface TrackerCardProps {
	instance: HRChecklistInstance;
	onClick: () => void;
}

const TrackerCard: React.FC<TrackerCardProps> = ({ instance, onClick }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const isOnboarding = instance.checklist_type === 'onboarding';

	const { progress, completedCount, totalCount, overdueCount } = useMemo(() => {
		const statuses = Object.values(instance.task_statuses);
		const completedCount = statuses.filter((s) => s.completed).length;
		const totalCount = statuses.length;
		const today = new Date().toISOString().split('T')[0];
		const overdueCount = statuses.filter((s) => !s.completed && s.due_date && s.due_date < today).length;
		return {
			progress: totalCount ? Math.round((completedCount / totalCount) * 100) : 0,
			completedCount,
			totalCount,
			overdueCount,
		};
	}, [instance.task_statuses]);

	const accent = isOnboarding ? theme.palette.primary.main : theme.palette.error.main;

	return (
		<Box
			onClick={onClick}
			sx={{
				p: 2.5,
				borderRadius: '20px',
				height: '100%',
				cursor: 'pointer',
				bgcolor: theme.palette.background.paper,
				border: '1px solid',
				borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.04)',
				boxShadow: isDark
					? '0 1px 2px rgba(0,0,0,0.4), 0 8px 20px rgba(0,0,0,0.2)'
					: '0 1px 2px rgba(15,23,42,0.04), 0 8px 20px rgba(15,23,42,0.05)',
				transition: 'transform 0.2s ease, box-shadow 0.2s ease',
				'&:hover': {
					transform: 'translateY(-3px)',
					boxShadow: isDark ? `0 10px 28px ${alpha(accent, 0.25)}` : `0 10px 28px ${alpha(accent, 0.15)}`,
				},
			}}
		>
			<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
				<Chip
					label={isOnboarding ? 'Onboarding' : 'Offboarding'}
					size="small"
					sx={{
						fontWeight: 800, textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.4px',
						bgcolor: alpha(accent, 0.12), color: accent,
					}}
				/>
				<Stack direction="row" spacing={0.75} alignItems="center">
					{overdueCount > 0 && instance.status !== 'completed' && (
						<Chip
							icon={<OverdueIcon sx={{ fontSize: '0.9rem !important' }} />}
							label={overdueCount}
							size="small"
							color="error"
							sx={{ fontWeight: 800, fontSize: '0.65rem', height: 22 }}
						/>
					)}
					<Chip
						label={instance.status === 'completed' ? 'COMPLETED' : 'PENDING'}
						size="small"
						color={instance.status === 'completed' ? 'success' : 'warning'}
						sx={{ fontWeight: 800, fontSize: '0.65rem' }}
					/>
				</Stack>
			</Stack>

			<Typography variant="subtitle1" fontWeight={800} noWrap>{instance.employee_name}</Typography>
			<Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', mb: 2 }}>
				{instance.template_name}
			</Typography>

			<Divider sx={{ mb: 1.5, borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)' }} />

			<Stack direction="row" alignItems="center" justifyContent="space-between">
				<Stack direction="row" alignItems="center" spacing={1}>
					<CircularProgress
						variant="determinate"
						value={progress}
						size={28}
						thickness={5}
						sx={{ color: instance.status === 'completed' ? 'success.main' : accent }}
					/>
					<Typography variant="body2" fontWeight={700}>{progress}%</Typography>
				</Stack>
				<Typography variant="caption" color="text.secondary" fontWeight={600}>
					{completedCount}/{totalCount} tasks
				</Typography>
			</Stack>
		</Box>
	);
};

export default TrackerCard;
