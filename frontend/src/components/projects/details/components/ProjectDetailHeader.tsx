import React from 'react';
import { Box, Typography, Stack, IconButton, Avatar, LinearProgress, Chip, useTheme, alpha } from '@mui/material';
import {
	ArrowBackOutlined,
	PersonOutline,
	BusinessOutlined,
	AccountBalanceWalletOutlined,
	CalendarMonthOutlined,
	TaskAltOutlined,
	TransformOutlined,
	EditOutlined,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import StatusBadge from '../../../common/badge/StatusBadge';
import type { Project, ProjectStatus } from '../../../../models/projects/project';

interface ProjectDetailHeaderProps {
	project: Project;
	onBack: () => void;
	onEdit: () => void;
}

const CLOSED_STATUSES: ProjectStatus[] = ['completed', 'approved', 'invoiced', 'canceled'];

type Tone = 'success' | 'error' | 'default';

const getTrackInfo = (project: Project): { label: string; tone: Tone } => {
	if (project.status === 'canceled') return { label: 'Canceled', tone: 'default' };
	if (CLOSED_STATUSES.includes(project.status)) return { label: 'Completed', tone: 'success' };
	if (project.status === 'delayed') return { label: 'Delayed', tone: 'error' };
	if (project.end_date && dayjs(project.end_date).isBefore(dayjs(), 'day')) {
		return { label: 'Delayed', tone: 'error' };
	}
	return { label: 'On Track', tone: 'success' };
};

const formatBudget = (project: Project): string => {
	if (project.budget == null) return '—';
	return new Intl.NumberFormat(undefined, {
		style: 'currency',
		currency: project.currency,
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(project.budget);
};

const formatDate = (dateStr?: string): string => (dateStr ? dayjs(dateStr).format('MMM DD, YYYY') : '—');

/** A small metadata tile used in the header's detail strip. */
const DetailTile: React.FC<{ icon: React.ReactNode; label: string; value: React.ReactNode; color: string }> = ({
	icon,
	label,
	value,
	color,
}) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';

	return (
		<Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
			<Box
				sx={{
					width: 32,
					height: 32,
					borderRadius: '8px',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					flexShrink: 0,
					background: isDark
						? `linear-gradient(135deg, ${alpha(color, 0.2)} 0%, ${alpha(color, 0.05)} 100%)`
						: `linear-gradient(135deg, ${alpha(color, 0.12)} 0%, ${alpha(color, 0.03)} 100%)`,
					color,
				}}
			>
				{icon}
			</Box>
			<Box sx={{ minWidth: 0 }}>
				<Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '0.65rem', display: 'block' }}>
					{label}
				</Typography>
				<Box sx={{ fontWeight: 700, fontSize: '0.825rem', color: 'text.primary', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
					{value}
				</Box>
			</Box>
		</Stack>
	);
};

export const ProjectDetailHeader: React.FC<ProjectDetailHeaderProps> = ({ project, onBack, onEdit }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const track = getTrackInfo(project);

	const taskCount = project.task_count ?? 0;
	const completedCount = project.completed_task_count ?? 0;
	const taskPct = taskCount > 0 ? Math.round((completedCount / taskCount) * 100) : 0;

	const daysRemaining = project.end_date ? dayjs(project.end_date).diff(dayjs(), 'day') : null;
	const timelineValue = project.start_date || project.end_date
		? `${formatDate(project.start_date)} → ${formatDate(project.end_date)}`
		: '—';

	return (
		<Box
			sx={{
				position: 'relative',
				overflow: 'hidden',
				borderRadius: '16px',
				border: '1px solid',
				borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
				background: isDark
					? 'linear-gradient(135deg, rgba(139,124,246,0.12) 0%, rgba(20,24,34,0.6) 55%)'
					: 'linear-gradient(135deg, rgba(139,124,246,0.08) 0%, #ffffff 55%)',
				boxShadow: isDark
					? '0 12px 32px -12px rgba(0,0,0,0.4)'
					: '0 12px 32px -16px rgba(24,28,48,0.08)',
				p: { xs: 1.5, sm: 2 },
				mb: 1.5,
			}}
		>
			{/* Decorative glow */}
			<Box
				sx={{
					position: 'absolute',
					top: -60,
					right: -60,
					width: 220,
					height: 220,
					borderRadius: '50%',
					background: 'radial-gradient(circle, rgba(139,124,246,0.25) 0%, rgba(255,255,255,0) 70%)',
					pointerEvents: 'none',
				}}
			/>

			<Stack direction="row" alignItems="flex-start" spacing={1.5} sx={{ position: 'relative', mb: 1.5 }}>
				<IconButton
					onClick={onBack}
					size="small"
					sx={{
						mt: 0.25,
						bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
						'&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)' },
					}}
				>
					<ArrowBackOutlined fontSize="small" />
				</IconButton>

				<Box sx={{ minWidth: 0, flex: 1 }}>
					<Stack direction="row" spacing={1.25} alignItems="center" flexWrap="wrap" sx={{ mb: 0.75, rowGap: 1 }}>
						<Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }} noWrap>
							{project.name}
						</Typography>
						<StatusBadge label={project.status.replace('_', ' ')} status={project.status} type="project" />
						<Chip
							size="small"
							label={track.label}
							color={track.tone === 'default' ? undefined : track.tone}
							variant="outlined"
							sx={{ fontWeight: 700, fontSize: '0.7rem' }}
						/>
						{project.deal_title && (
							<Chip
								size="small"
								icon={<TransformOutlined sx={{ fontSize: '14px !important' }} />}
								label={`Converted from "${project.deal_title}"`}
								variant="outlined"
								sx={{ fontWeight: 600, fontSize: '0.7rem' }}
							/>
						)}
					</Stack>

					{project.description && (
						<Typography
							variant="body2"
							color="text.secondary"
							sx={{
								display: '-webkit-box',
								WebkitLineClamp: 2,
								WebkitBoxOrient: 'vertical',
								overflow: 'hidden',
								maxWidth: 720,
							}}
						>
							{project.description.replace(/<[^>]*>/g, '')}
						</Typography>
					)}
				</Box>

				<IconButton
					onClick={onEdit}
					size="small"
					sx={{
						mt: 0.25,
						bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
						'&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)' },
					}}
				>
					<EditOutlined fontSize="small" />
				</IconButton>
			</Stack>

			<Box
				sx={{
					display: 'grid',
					gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)', md: 'repeat(5, 1fr)' },
					gap: { xs: 1.5, sm: 2 },
					position: 'relative',
					pt: 1.5,
					borderTop: '1px solid',
					borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
				}}
			>
				<DetailTile
					icon={<PersonOutline fontSize="small" />}
					label="Owner"
					color="#8B7CF6"
					value={
						project.owner_name ? (
							<Stack direction="row" spacing={0.75} alignItems="center">
								<Avatar sx={{ width: 18, height: 18, fontSize: '0.6rem', fontWeight: 700 }}>
									{project.owner_name[0]?.toUpperCase()}
								</Avatar>
								<Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{project.owner_name}</Box>
							</Stack>
						) : 'Unassigned'
					}
				/>

				<DetailTile
					icon={<BusinessOutlined fontSize="small" />}
					label="Client"
					color="#4EA8FF"
					value={project.company_name || '—'}
				/>

				<DetailTile
					icon={<AccountBalanceWalletOutlined fontSize="small" />}
					label="Budget"
					color="#10B981"
					value={formatBudget(project)}
				/>

				<DetailTile
					icon={<CalendarMonthOutlined fontSize="small" />}
					label="Timeline"
					color="#F59E0B"
					value={
						<Stack spacing={0}>
							<Box component="span">{timelineValue}</Box>
							{daysRemaining !== null && (
								<Typography component="span" variant="caption" sx={{ color: daysRemaining < 0 ? 'error.main' : 'text.secondary', fontWeight: 700 }}>
									{daysRemaining < 0 ? `${Math.abs(daysRemaining)}d overdue` : `${daysRemaining}d left`}
								</Typography>
							)}
						</Stack>
					}
				/>

				<Box sx={{ gridColumn: { xs: '1 / -1', sm: 'auto' } }}>
					<Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
						<Box
							sx={{
								width: 32,
								height: 32,
								borderRadius: '8px',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								flexShrink: 0,
								background: isDark
									? 'linear-gradient(135deg, rgba(236,72,153,0.2) 0%, rgba(236,72,153,0.05) 100%)'
									: 'linear-gradient(135deg, rgba(236,72,153,0.12) 0%, rgba(236,72,153,0.03) 100%)',
								color: '#EC4899',
							}}
						>
							<TaskAltOutlined fontSize="small" />
						</Box>
						<Box sx={{ minWidth: 0, flex: 1 }}>
							<Stack direction="row" justifyContent="space-between" alignItems="baseline">
								<Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '0.68rem' }}>
									Tasks
								</Typography>
								<Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary' }}>
									{completedCount}/{taskCount}
								</Typography>
							</Stack>
							<LinearProgress
								variant="determinate"
								value={taskPct}
								sx={{
									height: 6,
									borderRadius: 3,
									mt: 0.5,
									bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
									'& .MuiLinearProgress-bar': {
										borderRadius: 3,
										background: 'linear-gradient(90deg, #8B7CF6 0%, #4EA8FF 100%)',
									},
								}}
							/>
						</Box>
					</Stack>
				</Box>
			</Box>
		</Box>
	);
};

export default ProjectDetailHeader;
