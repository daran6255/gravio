import React, { memo } from 'react';
import {
	TableRow,
	TableCell,
	Typography,
	Chip,
	Stack,
	IconButton,
	Box,
	LinearProgress,
	Tooltip,
	useTheme,
	alpha
} from '@mui/material';
import {
	Visibility as ViewIcon,
	Edit as EditIcon,
	Delete as DeleteIcon,
	MoreVert as MoreIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import type { MockInterview } from '../../../../models/MockInterview';
import type { CandidateAllocation } from '../../../../models/training';
import ActionMenu, { type ActionMenuItem } from '../../../common/action-menu/ActionMenu';

interface MockInterviewTableRowProps {
	interview: MockInterview;
	allocations: CandidateAllocation[];
	onView: (interview: MockInterview) => void;
	onEdit: (interview: MockInterview) => void;
	onDelete: (id: number) => void;
	onFilterCandidate: (id: number) => void;
}

const getStatusStyles = (status: string) => {
	switch (status.toLowerCase()) {
		case 'cleared':
			return { color: 'success', label: 'Cleared', variant: 'filled' };
		case 'rejected':
			return { color: 'error', label: 'Rejected', variant: 'filled' };
		case 're-test':
			return { color: 'warning', label: 'Re-test', variant: 'outlined' };
		case 'pending':
			return { color: 'info', label: 'Pending', variant: 'outlined' };
		case 'absent':
			return { color: 'default', label: 'Absent', variant: 'filled' };
		default:
			return { color: 'default', label: status.toUpperCase(), variant: 'outlined' };
	}
};

const MockInterviewTableRow: React.FC<MockInterviewTableRowProps> = memo(({
	interview,
	allocations,
	onView,
	onEdit,
	onDelete,
	onFilterCandidate
}) => {
	const theme = useTheme();
	const status = getStatusStyles(interview.status);
	const candidate = allocations.find(a => a.candidate_id === interview.candidate_id)?.candidate;

	const isAbsent = interview.status === 'absent';

	const renderRating = (rating: number | undefined) => {
		if (rating === undefined || rating === null) return <Typography variant="body2" color="text.secondary">N/A</Typography>;

		const color = rating >= 8 ? theme.palette.success.main : rating >= 5 ? theme.palette.warning.main : theme.palette.error.main;

		return (
			<Box sx={{ minWidth: 100 }}>
				<Stack direction="row" alignItems="center" spacing={1}>
					<Box sx={{ width: '100%', mr: 1 }}>
						<LinearProgress
							variant="determinate"
							value={rating * 10}
							sx={{
								height: 6,
								borderRadius: 3,
								backgroundColor: alpha(theme.palette.text.primary, 0.05),
								'& .MuiLinearProgress-bar': {
									backgroundColor: color
								}
							}}
						/>
					</Box>
					<Typography variant="caption" fontWeight={600} color="text.secondary">
						{rating}/10
					</Typography>
				</Stack>
			</Box>
		);
	};

	const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
	const open = Boolean(anchorEl);

	const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
		setAnchorEl(event.currentTarget);
	};

	const handleCloseMenu = () => {
		setAnchorEl(null);
	};

	const actions: ActionMenuItem[] = [
		{
			label: 'View Details',
			icon: <ViewIcon fontSize="small" />,
			onClick: () => onView(interview)
		},
		{
			label: 'Edit Session',
			icon: <EditIcon fontSize="small" />,
			onClick: () => onEdit(interview),
			color: 'info.main'
		},
		{
			label: 'Delete',
			icon: <DeleteIcon fontSize="small" />,
			onClick: () => onDelete(interview.id),
			color: 'error.main',
			divider: true
		}
	];

	return (
		<TableRow hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
			<TableCell>
				<Typography variant="body2" fontWeight={600}>
					{format(new Date(interview.interview_date), 'MMM dd, yyyy')}
				</Typography>
				<Typography variant="caption" color="text.secondary">
					{format(new Date(interview.interview_date), 'hh:mm a')}
				</Typography>
			</TableCell>
			<TableCell>
				<Tooltip title="Click to view all sessions for this candidate">
					<Typography
						variant="body2"
						onClick={() => onFilterCandidate(interview.candidate_id)}
						sx={{
							fontWeight: 800,
							color: 'primary.main',
							cursor: 'pointer',
							'&:hover': { textDecoration: 'underline', color: 'primary.dark' }
						}}
					>
						{candidate?.name || 'Unknown Candidate'}
					</Typography>
				</Tooltip>
				<Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
					{candidate?.email || 'N/A'}
				</Typography>
			</TableCell>
			<TableCell>
				<Typography variant="body2" fontWeight={500}>
					{interview.interviewer_name || 'Unassigned'}
				</Typography>
			</TableCell>
			<TableCell>
				<Chip
					label={interview.interview_type || 'internal'}
					size="small"
					variant="outlined"
					sx={{
						fontWeight: 600,
						fontSize: '0.65rem',
						textTransform: 'uppercase',
						borderRadius: '4px',
						height: '20px',
						bgcolor: interview.interview_type === 'external' ? alpha(theme.palette.secondary.main, 0.05) : alpha(theme.palette.primary.main, 0.05),
						borderColor: interview.interview_type === 'external' ? alpha(theme.palette.secondary.main, 0.2) : alpha(theme.palette.primary.main, 0.2),
						color: interview.interview_type === 'external' ? 'secondary.main' : 'primary.main',
					}}
				/>
			</TableCell>
			<TableCell>
				<Chip
					label={interview.interview_category || 'domain'}
					size="small"
					variant="outlined"
					sx={{
						fontWeight: 600,
						fontSize: '0.65rem',
						textTransform: 'uppercase',
						borderRadius: '4px',
						height: '20px',
						bgcolor: interview.interview_category === 'hr' ? alpha(theme.palette.warning.main, 0.05) : alpha(theme.palette.info.main, 0.05),
						borderColor: interview.interview_category === 'hr' ? alpha(theme.palette.warning.main, 0.2) : alpha(theme.palette.info.main, 0.2),
						color: interview.interview_category === 'hr' ? 'warning.main' : 'info.main',
					}}
				/>
			</TableCell>
			<TableCell>
				<Chip
					label={status.label}
					size="small"
					color={status.color as any}
					variant={status.variant as any}
					sx={{
						fontWeight: 600,
						fontSize: '0.7rem',
						borderRadius: '4px',
						height: '24px'
					}}
				/>
			</TableCell>
			<TableCell>
				<Stack direction="row" spacing={0.5} alignItems="center">
					<Typography variant="body2" fontWeight={700}>
						{interview.duration_minutes || 0}
					</Typography>
					<Typography variant="caption" color="text.secondary">
						min
					</Typography>
				</Stack>
			</TableCell>
			<TableCell>
				{isAbsent ? (
					<Typography variant="caption" sx={{ fontStyle: 'italic', color: 'text.disabled', fontWeight: 500 }}>
						Score not available (Absent)
					</Typography>
				) : (
					renderRating(interview.overall_rating || 0)
				)}
			</TableCell>
			<TableCell align="right">
				<IconButton size="small" onClick={handleOpenMenu}>
					<MoreIcon fontSize="small" />
				</IconButton>
				<ActionMenu
					anchorEl={anchorEl}
					open={open}
					onClose={handleCloseMenu}
					actions={actions}
				/>
			</TableCell>
		</TableRow>
	);
});

MockInterviewTableRow.displayName = 'MockInterviewTableRow';

export default MockInterviewTableRow;

