import React, { memo } from 'react';
import { TableRow, TableCell, Typography, Box } from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import StatusBadge from '../../../common/badge/StatusBadge';
import DataTableActions, { type TableMenuAction } from '../../../common/table/DataTableActions';
import { useDateTime } from '../../../../hooks/useDateTime';
import type { Lead } from '../../../../models/lead';

interface LeadTableRowProps {
	lead: Lead;
	isAdmin: boolean;
	onEdit: (lead: Lead) => void;
	onDelete?: (lead: Lead) => void;
	onClick: (lead: Lead) => void;
}

const LeadTableRow: React.FC<LeadTableRowProps> = memo(({
	lead,
	isAdmin,
	onEdit,
	onDelete,
	onClick,
}) => {
	const { formatDate } = useDateTime();

	const actions: TableMenuAction<Lead>[] = [
		{
			label: 'Edit',
			icon: <EditIcon fontSize="small" />,
			onClick: (item) => onEdit(item)
		},
		{
			label: 'Delete',
			icon: <DeleteIcon fontSize="small" />,
			onClick: (item) => onDelete?.(item),
			color: 'error.main',
			hidden: !isAdmin || !onDelete
		}
	];

	return (
		<TableRow
			hover
			tabIndex={-1}
			onClick={() => onClick(lead)}
			sx={{
				cursor: 'pointer',
				'&:hover': { bgcolor: 'action.hover' },
				'&:last-child td': { borderBottom: 0 },
			}}
		>
			{/* Title & Description */}
			<TableCell>
				<Box>
					<Typography
						variant="body2"
						sx={{ fontWeight: 700, color: 'primary.main' }}
					>
						{lead.title}
					</Typography>
					{lead.description && (
						<Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 200, display: 'block' }}>
							{lead.description}
						</Typography>
					)}
				</Box>
			</TableCell>

			{/* Status */}
			<TableCell>
				<StatusBadge
					label={lead.lead_status.replace(/_/g, ' ')}
					status={lead.lead_status}
					type="lead"
				/>
			</TableCell>

			{/* Company & Contact */}
			<TableCell>
				<Box>
					<Typography variant="body2" color="text.primary">
						{lead.company?.name || '—'}
					</Typography>
					{lead.contact && (
						<Typography variant="caption" color="text.secondary">
							{lead.contact.first_name} {lead.contact.last_name}
						</Typography>
					)}
				</Box>
			</TableCell>

			{/* Estimated Value */}
			<TableCell>
				<Typography variant="body2" sx={{ fontWeight: 600 }}>
					{lead.estimated_value ? `${lead.currency} ${lead.estimated_value.toLocaleString()}` : '—'}
				</Typography>
			</TableCell>

			{/* Source */}
			<TableCell>
				<Typography variant="caption" sx={{ textTransform: 'capitalize', color: 'text.secondary' }}>
					{lead.lead_source.replace(/_/g, ' ')}
				</Typography>
			</TableCell>

			{/* Date Added */}
			<TableCell>
				<Typography variant="body2" color="text.secondary">
					{formatDate(lead.created_at)}
				</Typography>
			</TableCell>

			{/* Actions */}
			<TableCell align="right" onClick={(e) => e.stopPropagation()}>
				<DataTableActions
					item={lead}
					actions={actions}
				/>
			</TableCell>
		</TableRow>
	);
});

LeadTableRow.displayName = 'LeadTableRow';

export default LeadTableRow;
