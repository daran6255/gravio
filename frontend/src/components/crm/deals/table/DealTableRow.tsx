import React, { memo } from 'react';
import { TableRow, TableCell, Stack, Typography, Box, LinearProgress } from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import StatusBadge from '../../../common/badge/StatusBadge';
import DataTableActions, { type TableMenuAction } from '../../../common/table/DataTableActions';
import { useDateTime } from '../../../../hooks/useDateTime';
import type { Deal } from '../../../../models/deal';

interface DealTableRowProps {
	deal: Deal;
	isAdmin: boolean;
	onEdit: (deal: Deal) => void;
	onDelete?: (deal: Deal) => void;
	onClick: (deal: Deal) => void;
}

const DealTableRow: React.FC<DealTableRowProps> = memo(({
	deal,
	isAdmin,
	onEdit,
	onDelete,
	onClick,
}) => {
	const { formatDate } = useDateTime();

	const actions: TableMenuAction<Deal>[] = [
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
			onClick={() => onClick(deal)}
			sx={{
				cursor: 'pointer',
				'&:hover': { bgcolor: 'action.hover' },
				'&:last-child td': { borderBottom: 0 },
			}}
		>
			{/* Deal Title */}
			<TableCell>
				<Box>
					<Typography
						variant="body2"
						sx={{ fontWeight: 700, color: 'primary.main' }}
					>
						{deal.title}
					</Typography>
					<Typography variant="caption" color="text.secondary">
						{deal.deal_type.replace(/_/g, ' ')}
					</Typography>
				</Box>
			</TableCell>

			{/* Stage */}
			<TableCell>
				<StatusBadge
					label={deal.deal_stage.replace(/_/g, ' ')}
					status={deal.deal_stage}
					type="deal"
				/>
			</TableCell>

			{/* Entity */}
			<TableCell>
				<Box>
					<Typography variant="body2" color="text.primary">
						{deal.company?.name || '—'}
					</Typography>
					{deal.contact && (
						<Typography variant="caption" color="text.secondary">
							{deal.contact.first_name} {deal.contact.last_name}
						</Typography>
					)}
				</Box>
			</TableCell>

			{/* Deal Value */}
			<TableCell>
				<Typography variant="body2" sx={{ fontWeight: 600 }}>
					{deal.currency} {deal.deal_value.toLocaleString()}
				</Typography>
			</TableCell>

			{/* Probability */}
			<TableCell>
				<Box sx={{ width: 100 }}>
					<Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
						<Typography variant="caption" color="text.secondary">Probability</Typography>
						<Typography variant="caption" sx={{ fontWeight: 700 }}>{deal.win_probability}%</Typography>
					</Stack>
					<LinearProgress 
						variant="determinate" 
						value={deal.win_probability} 
						sx={{ 
							height: 4, 
							borderRadius: 2,
							bgcolor: 'action.disabledBackground',
							'& .MuiLinearProgress-bar': {
								bgcolor: deal.win_probability > 70 ? 'success.main' : deal.win_probability > 30 ? 'warning.main' : 'error.main'
							}
						}}
					/>
				</Box>
			</TableCell>

			{/* Expected Close */}
			<TableCell>
				<Typography variant="body2" color="text.secondary">
					{deal.expected_close_date ? formatDate(deal.expected_close_date) : '—'}
				</Typography>
			</TableCell>

			{/* Actions */}
			<TableCell align="right" onClick={(e) => e.stopPropagation()}>
				<DataTableActions
					item={deal}
					actions={actions}
				/>
			</TableCell>
		</TableRow>
	);
});

DealTableRow.displayName = 'DealTableRow';

export default DealTableRow;
