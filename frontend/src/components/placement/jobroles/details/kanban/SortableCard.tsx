import React from 'react';
import {
	Box,
	Typography,
	Stack,
	Paper,
	Avatar,
	Chip,
	IconButton,
	Tooltip,
	Divider,
	useTheme
} from '@mui/material';
import {
	MoreVert as MoreIcon,
	History as HistoryIcon,
	TrendingUp as TrendingUpIcon,
	Schedule as ScheduleIcon
} from '@mui/icons-material';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { type CandidateMatchResult } from '../../../../../store/slices/placementMappingSlice';

const getScoreColor = (score: number) => {
	if (score >= 80) return '#1d8102';
	if (score >= 40) return '#ff9900';
	return '#d13212';
};

interface SortableCardProps {
	candidate: CandidateMatchResult;
	onViewHistory: (mappingId: number, name: string, candidatePublicId: string) => void;
}

const SortableCard: React.FC<SortableCardProps> = ({ candidate, onViewHistory }) => {
	const theme = useTheme();
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging
	} = useSortable({
		id: candidate.candidate_id.toString(),
		data: {
			type: 'Candidate',
			candidate
		}
	});

	const style = {
		transform: CSS.Translate.toString(transform),
		transition,
		opacity: isDragging ? 0.3 : 1,
		zIndex: isDragging ? 1000 : 1,
	};

	return (
		<Paper
			ref={setNodeRef}
			style={style}
			{...attributes}
			{...listeners}
			elevation={isDragging ? 8 : 0}
			sx={{
				p: 2,
				mb: 1.5,
				borderRadius: theme.shape.borderRadius,
				border: `1px solid ${theme.palette.divider}`,
				bgcolor: theme.palette.background.paper,
				position: 'relative',
				touchAction: 'none',
				cursor: isDragging ? 'grabbing' : 'grab',
				'&:hover': {
					borderColor: theme.palette.accent.main,
					boxShadow: theme.shadows[2]
				}
			}}
		>
			<Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ mb: 1.5 }}>
				<Avatar
					sx={{
						width: 32,
						height: 32,
						fontSize: '0.875rem',
						fontWeight: 700,
						bgcolor: getScoreColor(candidate.match_score)
					}}
				>
					{candidate.name[0]}
				</Avatar>
				<Box sx={{ flexGrow: 1 }}>
					<Typography variant="body2" sx={{ fontWeight: 700, color: theme.palette.text.primary, lineHeight: 1.2 }}>
						{candidate.name}
					</Typography>
					<Typography variant="caption" color="textSecondary">
						Score: {candidate.match_score}%
					</Typography>
				</Box>
				<IconButton size="small" sx={{ mt: -0.5, mr: -0.5 }}>
					<MoreIcon fontSize="small" />
				</IconButton>
			</Stack>

			<Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
				{candidate.skills.slice(0, 2).map((skill: string, i: number) => (
					<Chip
						key={i}
						label={skill}
						size="small"
						sx={{ height: 18, fontSize: '0.65rem', bgcolor: '#f3f3f3' }}
					/>
				))}
			</Stack>

			<Divider sx={{ my: 1.5 }} />

			<Stack direction="row" justifyContent="space-between" alignItems="center">
				<Stack direction="row" spacing={1}>
					<Tooltip title="View History/Lifecycle">
						<IconButton
							size="small"
							sx={{ color: theme.palette.primary.main }}
							onClick={(e) => {
								e.stopPropagation();
								candidate.mapping_id && onViewHistory(candidate.mapping_id, candidate.name, candidate.public_id);
							}}
						>
							<HistoryIcon sx={{ fontSize: 16 }} />
						</IconButton>
					</Tooltip>
					<Tooltip title="Task/Schedule">
						<IconButton size="small" onClick={(e) => e.stopPropagation()}>
							<ScheduleIcon sx={{ fontSize: 16 }} />
						</IconButton>
					</Tooltip>
				</Stack>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
					<TrendingUpIcon sx={{ fontSize: 14, color: getScoreColor(candidate.match_score) }} />
					<Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.65rem' }}>
						{candidate.match_score > 70 ? 'High Potential' : 'Moderate'}
					</Typography>
				</Box>
			</Stack>
		</Paper>
	);
};

export default SortableCard;
