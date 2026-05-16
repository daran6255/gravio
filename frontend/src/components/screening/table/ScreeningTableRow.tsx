import React, { memo } from 'react';
import {
	TableRow,
	TableCell,
	Typography,
	Box,
	Tooltip,
	Chip,
	Button
} from '@mui/material';
import { Edit, Accessible, VerifiedUser, CheckCircle, Cancel, WatchLater, HelpOutline } from '@mui/icons-material';
import { isToday, parseISO } from 'date-fns';
import { useDateTime } from '../../../hooks/useDateTime';
import type { CandidateListItem } from '../../../models/candidate';

interface ScreeningTableRowProps {
	candidate: CandidateListItem;
	type: 'unscreened' | 'screened';
	onAction: (action: 'edit' | 'screen', candidate: CandidateListItem) => void;
}

const ScreeningTableRow: React.FC<ScreeningTableRowProps> = memo(({
	candidate,
	type,
	onAction
}) => {
	const { formatDate } = useDateTime();

	return (
		<TableRow
			sx={{
				'&:hover': {
					bgcolor: 'action.hover',
				},
				'&:last-child td': {
					borderBottom: 0
				}
			}}
		>
			<TableCell>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
					<Typography variant="body2" sx={{ fontWeight: 500 }}>
						{candidate.name}
					</Typography>
					{candidate.is_disabled && (
						<Tooltip title="Person with Disability">
							<Accessible color="primary" fontSize="small" />
						</Tooltip>
					)}
					{type === 'screened' && (
						<Tooltip title="Verified Screening">
							<VerifiedUser sx={{ color: 'success.main', fontSize: 20 }} />
						</Tooltip>
					)}
					{isToday(parseISO(candidate.created_at)) && (
						<Chip
							label="New"
							size="small"
							color="primary"
							sx={{
								height: 20,
								fontSize: '0.65rem',
								fontWeight: 'bold',
								bgcolor: 'rgba(0, 77, 230, 0.08)',
								color: 'primary.main'
							}}
						/>
					)}
				</Box>
			</TableCell>
			<TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
				<Typography variant="body2" color="text.secondary">
					{candidate.phone}
				</Typography>
			</TableCell>
			<TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
				<Typography variant="body2" color="text.secondary">
					{candidate.disability_type || 'Non-PwD'}
				</Typography>
			</TableCell>
			<TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
				<Typography variant="body2" color="text.secondary">
					{candidate.education_level || '-'}
				</Typography>
			</TableCell>
			<TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
				<Typography variant="body2" color="text.secondary">
					{candidate.city}, {candidate.state}
				</Typography>
			</TableCell>

			<TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
				<Typography variant="body2" color="text.secondary">
					{formatDate(type === 'screened' && candidate.screening_updated_at ? candidate.screening_updated_at : candidate.created_at)}
				</Typography>
			</TableCell>
			{type !== 'unscreened' && (
				<TableCell>
					<Chip
						label={candidate.screening_status}
						size="small"
						icon={
							candidate.screening_status === 'Completed' ? <CheckCircle /> :
								candidate.screening_status === 'Rejected' || candidate.screening_status === 'Not Connected' || candidate.screening_status === 'Not Answered' ? <Cancel /> :
									candidate.screening_status === 'In Progress' ? <WatchLater /> :
										candidate.screening_status === 'Follow-up Required' ? <WatchLater /> :
											<HelpOutline />
						}
						sx={{
							height: 24,
							fontSize: '0.75rem',
							fontWeight: 700,
							borderRadius: 1,
							bgcolor:
								candidate.screening_status === 'Completed' ? 'rgba(16, 185, 129, 0.08)' :
									candidate.screening_status === 'Rejected' || candidate.screening_status === 'Not Connected' || candidate.screening_status === 'Not Answered' ? 'rgba(239, 68, 68, 0.08)' :
										candidate.screening_status === 'In Progress' ? 'rgba(0, 77, 230, 0.08)' :
											'action.hover',
							color:
								candidate.screening_status === 'Completed' ? 'success.main' :
									candidate.screening_status === 'Rejected' || candidate.screening_status === 'Not Connected' || candidate.screening_status === 'Not Answered' ? 'error.main' :
										candidate.screening_status === 'In Progress' ? 'primary.main' :
											'text.secondary',
							'& .MuiChip-icon': {
								color: 'inherit',
								fontSize: 16
							}
						}}
					/>
				</TableCell>
			)}
			<TableCell align="right">
				{type === 'unscreened' ? (
					<Button
						variant="contained"
						size="small"
						onClick={() => onAction('screen', candidate)}
						sx={{
							textTransform: 'none',
							bgcolor: 'primary.main',
							'&:hover': { bgcolor: 'primary.dark' }
						}}
					>
						Screen
					</Button>
				) : (
					<Button
						variant="outlined"
						size="small"
						startIcon={<Edit fontSize="small" />}
						onClick={() => onAction('edit', candidate)}
						sx={{ textTransform: 'none' }}
					>
						Edit Screening
					</Button>
				)}
			</TableCell>
		</TableRow>
	);
});

ScreeningTableRow.displayName = 'ScreeningTableRow';

export default ScreeningTableRow;
