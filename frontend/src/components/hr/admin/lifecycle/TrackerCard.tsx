import React, { useMemo } from 'react';
import { Box, Chip, LinearProgress, Stack, Typography, alpha, useTheme } from '@mui/material';
import {
	WarningAmberRounded as OverdueIcon,
	DeleteOutline as DeleteIcon,
	PersonAddAlt1Outlined as OnboardingIcon,
	LogoutOutlined as OffboardingIcon,
} from '@mui/icons-material';
import ContextMenu from '../../../common/action-menu/ContextMenu';
import type { HRChecklistInstance } from '../../../../models/hr';

interface TrackerCardProps {
	instance: HRChecklistInstance;
	canManage: boolean;
	onClick: () => void;
	onDelete: () => void;
}

const TrackerCard: React.FC<TrackerCardProps> = ({ instance, canManage, onClick, onDelete }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const isOnboarding = instance.checklist_type === 'onboarding';
	const isCompleted = instance.status === 'completed';

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
	const barColor = isCompleted ? theme.palette.success.main : accent;

	return (
		<Box
			onClick={onClick}
			sx={{
				p: 2.5,
				borderRadius: '20px',
				height: '100%',
				position: 'relative',
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
			{canManage && (
				<Box
					onClick={(e) => e.stopPropagation()}
					sx={{ position: 'absolute', top: 14, right: 14, zIndex: 1 }}
				>
					<ContextMenu
						size="small"
						triggerTooltip="Tracker Actions"
						actions={[
							{
								label: 'Delete Tracker',
								icon: <DeleteIcon fontSize="small" />,
								color: theme.palette.error.main,
								onClick: onDelete,
								tooltip: 'For trackers launched by mistake',
							},
						]}
					/>
				</Box>
			)}

			<Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ mb: 2, pr: canManage ? 4 : 0 }}>
				<Box
					sx={{
						width: 42,
						height: 42,
						borderRadius: '14px',
						flexShrink: 0,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						bgcolor: alpha(accent, 0.12),
						color: accent,
					}}
				>
					{isOnboarding ? <OnboardingIcon sx={{ fontSize: '1.3rem' }} /> : <OffboardingIcon sx={{ fontSize: '1.3rem' }} />}
				</Box>
				<Box sx={{ minWidth: 0, flex: 1 }}>
					<Typography variant="subtitle1" fontWeight={800} noWrap>{instance.employee_name}</Typography>
					<Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
						{instance.template_name}
					</Typography>
				</Box>
			</Stack>

			<Stack direction="row" spacing={0.75} sx={{ mb: 2 }}>
				<Chip
					label={isOnboarding ? 'Onboarding' : 'Offboarding'}
					size="small"
					sx={{
						fontWeight: 800, textTransform: 'uppercase', fontSize: '0.62rem', letterSpacing: '0.4px',
						bgcolor: alpha(accent, 0.12), color: accent,
					}}
				/>
				<Chip
					label={isCompleted ? 'Completed' : 'Pending'}
					size="small"
					color={isCompleted ? 'success' : 'warning'}
					sx={{ fontWeight: 800, fontSize: '0.62rem' }}
				/>
				{overdueCount > 0 && !isCompleted && (
					<Chip
						icon={<OverdueIcon sx={{ fontSize: '0.85rem !important' }} />}
						label={`${overdueCount} overdue`}
						size="small"
						color="error"
						variant="outlined"
						sx={{ fontWeight: 700, fontSize: '0.62rem' }}
					/>
				)}
			</Stack>

			<Stack direction="row" justifyContent="space-between" sx={{ mb: 0.75 }}>
				<Typography variant="caption" color="text.secondary" fontWeight={600}>
					{completedCount} of {totalCount} tasks
				</Typography>
				<Typography variant="caption" fontWeight={800} color={barColor}>{progress}%</Typography>
			</Stack>
			<LinearProgress
				variant="determinate"
				value={progress}
				sx={{
					height: 7, borderRadius: 4,
					bgcolor: alpha(barColor, 0.12),
					'& .MuiLinearProgress-bar': { borderRadius: 4, bgcolor: barColor },
				}}
			/>
		</Box>
	);
};

export default TrackerCard;
