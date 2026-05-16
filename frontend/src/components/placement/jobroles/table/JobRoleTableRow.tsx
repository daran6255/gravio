import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TableRow, TableCell, Stack, Typography, Box, Tooltip, Chip, useTheme } from '@mui/material';
import { Group as GroupIcon } from '@mui/icons-material';
import { format } from 'date-fns';
import type { JobRole } from '../../../../models/jobRole';

// Local Components
import PlacementStatusBadge from '../common/PlacementStatusBadge';
import PlacementRowActions from '../common/PlacementRowActions';
import PlacementAvatar from '../common/PlacementAvatar';

interface JobRoleTableRowProps {
	jobRole: JobRole;
	onEdit: (jobRole: JobRole) => void;
	onClose: (jobRole: JobRole) => void;
	onReopen: (jobRole: JobRole) => void;
	onDelete: (jobRole: JobRole) => void;
	isAdmin: boolean;
}

const JobRoleTableRow: React.FC<JobRoleTableRowProps> = ({ jobRole, onEdit, onClose, onReopen, onDelete, isAdmin }) => {
	const theme = useTheme();
	const navigate = useNavigate();

	const handleRowClick = () => {
		navigate(`/placement/job-roles/${jobRole.public_id}`);
	};

	const formatDate = (dateString: string | undefined) => {
		if (!dateString) return '-';
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
			hover
			onClick={handleRowClick}
			sx={{
				height: '60px',
				'&:last-child td, &:last-child th': { border: 0 },
				'&:hover': { 
					bgcolor: 'rgba(236, 114, 17, 0.04)',
					cursor: 'pointer'
				},
				transition: 'background-color 0.2s',
			}}
		>
			<TableCell>
				<Box>
					<Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
						{toTitleCase(jobRole.title)}
					</Typography>
					<Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
						{jobRole.job_details?.designation || 'No Designation'}
					</Typography>
				</Box>
			</TableCell>

			<TableCell>
				<Stack direction="row" spacing={1.5} alignItems="center">
					<PlacementAvatar name={jobRole.company?.name || 'C'} size={32} />
					<Box>
						<Typography variant="body2" sx={{ fontWeight: 500, color: theme.palette.primary.main }}>
							{jobRole.company?.name || '-'}
						</Typography>
						<Typography variant="caption" sx={{ color: 'text.secondary' }}>
							{jobRole.contact ? `${jobRole.contact.first_name} ${jobRole.contact.last_name}` : '-'}
						</Typography>
					</Box>
				</Stack>
			</TableCell>

			<TableCell>
				{(() => {
					const isExpired = jobRole.close_date && new Date(jobRole.close_date) < new Date(new Date().setHours(0, 0, 0, 0));
					const displayStatus = isExpired && jobRole.status === 'active' ? 'closed' : jobRole.status;
					const displayLabel = isExpired && jobRole.status === 'active' ? 'Expired' : jobRole.status;
					return <PlacementStatusBadge label={displayLabel} status={displayStatus} />;
				})()}
			</TableCell>

			<TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
				<Typography variant="body2" sx={{ color: 'text.secondary' }}>
					{jobRole.location?.cities?.join(', ') || jobRole.location?.states?.join(', ') || '-'}
				</Typography>
			</TableCell>

			<TableCell align="center" sx={{ fontWeight: 500, color: 'text.secondary', display: { xs: 'none', md: 'table-cell' } }}>
				{jobRole.no_of_vacancies || 0}
			</TableCell>

			<TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
				<Typography variant="body2" sx={{ color: 'text.secondary' }}>
					{formatDate(jobRole.close_date)}
				</Typography>
			</TableCell>

			<TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
				<Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
					{jobRole.creator?.full_name || jobRole.creator?.username || '-'}
				</Typography>
			</TableCell>

			<TableCell align="center" sx={{ display: { xs: 'none', md: 'table-cell' } }}>
				<Tooltip title={
					jobRole.mappings_count && jobRole.mappings_count > 0 
						? `${jobRole.mappings_count} candidates mapped. Deletion restricted.` 
						: 'No candidates mapped'
				}>
					<Chip 
						icon={<GroupIcon sx={{ fontSize: '1rem !important' }} />}
						label={jobRole.mappings_count || 0}
						size="small"
						variant="outlined"
						sx={{ 
							fontWeight: 600, 
							borderRadius: '4px',
							color: jobRole.mappings_count && jobRole.mappings_count > 0 ? 'primary.main' : 'text.disabled',
							borderColor: jobRole.mappings_count && jobRole.mappings_count > 0 ? 'primary.main' : 'divider'
						}}
					/>
				</Tooltip>
			</TableCell>

			<TableCell align="right">
				<PlacementRowActions
					onEdit={() => onEdit(jobRole)}
					onClose={() => onClose(jobRole)}
					onReopen={() => onReopen(jobRole)}
					onDelete={isAdmin && (jobRole.mappings_count || 0) === 0 ? () => onDelete(jobRole) : undefined}
					isClosed={jobRole.status === 'closed'}
				/>
			</TableCell>
		</TableRow>
	);
};

export default JobRoleTableRow;
