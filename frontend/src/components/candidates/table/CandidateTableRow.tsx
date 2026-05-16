import React from 'react';
import {
	TableRow,
	TableCell,
	Box,
	Typography,
	Tooltip,
	Chip
} from '@mui/material';
import { Accessible } from '@mui/icons-material';
import { format, isToday, parseISO } from 'date-fns';
import type { CandidateListItem } from '../../../models/candidate';
import CandidateTableActions from './CandidateTableActions';
import { Checkbox } from '@mui/material';

interface CandidateTableRowProps {
	candidate: CandidateListItem;
	userRole: string | null;
	onView: (id: string) => void;
	onDelete: (candidate: CandidateListItem) => void;
	selected: boolean;
	onSelect: (id: string) => void;
}

const CandidateTableRow: React.FC<CandidateTableRowProps> = ({
	candidate,
	userRole,
	onView,
	onDelete,
	selected,
	onSelect
}) => {
	const formatDate = (dateString: string) => {
		try {
			return format(new Date(dateString), 'd MMM yyyy');
		} catch {
			return '-';
		}
	};

	const toTitleCase = (str: string) => {
		if (!str) return '';
		return str.replace(
			/\w\S*/g,
			(txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
		);
	};

	return (
		<TableRow
			key={candidate.public_id}
			onClick={() => onView(candidate.public_id)}
			selected={selected}
			sx={{
				height: '60px',
				cursor: 'pointer',
				'&.Mui-selected': {
					bgcolor: 'rgba(25, 118, 210, 0.04)',
					'&:hover': {
						bgcolor: 'rgba(25, 118, 210, 0.08)',
					}
				},
				'&:hover': {
					bgcolor: '#f5f8fa',
				},
				'&:last-child td': {
					borderBottom: 0
				}
			}}
		>
			<TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
				<Checkbox
					checked={selected}
					onChange={() => onSelect(candidate.public_id)}
					size="small"
				/>
			</TableCell>
			<TableCell>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
					<Typography variant="body2" sx={{ fontWeight: 500 }}>
						{toTitleCase(candidate.name)}
					</Typography>
					{(candidate.is_disabled || candidate.disability_type) && (
						<Tooltip title={candidate.disability_type || "Person with Disability"}>
							<Accessible color="primary" fontSize="small" />
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
								bgcolor: '#e3f2fd',
								color: '#1976d2'
							}}
						/>
					)}
				</Box>
			</TableCell>
			<TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
				<Typography variant="body2" color="text.secondary">
					{candidate.email}
				</Typography>
			</TableCell>
			<TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
				<Typography variant="body2" color="text.secondary">
					{candidate.phone}
				</Typography>
			</TableCell>
			<TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
				<Typography variant="body2" color="text.secondary">
					{candidate.city}, {candidate.state}
				</Typography>
			</TableCell>
			<TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
				<Typography variant="body2" color="primary.main" sx={{ fontWeight: 500 }}>
					{candidate.assigned_to_name || '-'}
				</Typography>
			</TableCell>
			<TableCell>
				<Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: '120px' }}>
					{candidate.is_disabled || candidate.disability_type
						? (candidate.disability_type || 'Unspecified')
						: 'Non-PwD'
					}
				</Typography>
			</TableCell>
			<TableCell>
				<Typography variant="body2" color="text.secondary">
					{candidate.registration_type || '-'}
				</Typography>
			</TableCell>
			<TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
				<Typography variant="body2" color="text.secondary">
					{formatDate(candidate.created_at)}
				</Typography>
			</TableCell>
			<TableCell align="right" onClick={(e) => e.stopPropagation()}>
				<CandidateTableActions
					candidate={candidate}
					userRole={userRole}
					onDelete={onDelete}
				/>
			</TableCell>
		</TableRow>
	);
};

export default CandidateTableRow;
