import React from 'react';
import { Box, Typography, Stack, Tooltip, useTheme } from '@mui/material';
import { KanbanCard } from '../../../common/kanban';
import { DataTableActions, type TableMenuAction } from '../../../common/table';
import { Visibility, Edit, DeleteOutline } from '@mui/icons-material';
import type { Deal } from '../../../../models/crm/deal';
import { formatMoney } from '../../../../utils/currency';
import useDateTime from '../../../../hooks/useDateTime';

interface DealCardProps {
	deal: Deal;
	companyName?: string;
	onView: (deal: Deal) => void;
	onEdit: (deal: Deal) => void;
	onDelete: (deal: Deal) => void;
}

const formatValue = (value?: number, currency?: string) => {
	if (value == null) return null;
	return formatMoney(value, currency);
};

export const DealCard: React.FC<DealCardProps> = ({ deal, companyName, onView, onEdit, onDelete }) => {
	const theme = useTheme();
	const { formatDate } = useDateTime();
	const actions: TableMenuAction<Deal>[] = [
		{ label: 'View Details', icon: <Visibility fontSize="small" />, onClick: () => onView(deal) },
		{ label: 'Edit', icon: <Edit fontSize="small" />, onClick: () => onEdit(deal) },
		{ label: 'Delete', icon: <DeleteOutline fontSize="small" />, onClick: () => onDelete(deal), color: 'error.main', divider: true },
	];

	const totalTasks = deal.task_count || 0;
	const completedTasks = deal.completed_task_count || 0;
	const inProgressTasks = deal.in_progress_task_count || 0;
	const pendingTasks = Math.max(totalTasks - completedTasks - inProgressTasks, 0);

	return (
		<KanbanCard id={deal.public_id} data={{ item: deal }} onClick={() => onView(deal)}>
			<Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 0.5 }}>
				<Typography variant="body2" sx={{ fontWeight: 700, pr: 1 }}>{deal.title}</Typography>
				<Box onClick={(e) => e.stopPropagation()}>
					<DataTableActions item={deal} actions={actions} tooltipTitle="Deal Actions" />
				</Box>
			</Stack>

			{companyName && (
				<Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
					{companyName}
				</Typography>
			)}

			{totalTasks > 0 && (
				<Box sx={{ mb: 0.75 }}>
					<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.4 }}>
						<Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.68rem' }}>
							Tasks
						</Typography>
						<Typography
							variant="caption"
							sx={{ fontSize: '0.68rem', fontWeight: 700, color: completedTasks === totalTasks ? 'success.main' : 'text.secondary' }}
						>
							{completedTasks}/{totalTasks}
						</Typography>
					</Stack>
					<Tooltip
						title={`${completedTasks} completed · ${inProgressTasks} in progress · ${pendingTasks} yet to start`}
						arrow
					>
						<Box
							sx={{
								display: 'flex',
								width: '100%',
								height: 6,
								borderRadius: 3,
								overflow: 'hidden',
								bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
							}}
						>
							{completedTasks > 0 && (
								<Box sx={{ flexBasis: `${(completedTasks / totalTasks) * 100}%`, bgcolor: 'success.main' }} />
							)}
							{inProgressTasks > 0 && (
								<Box sx={{ flexBasis: `${(inProgressTasks / totalTasks) * 100}%`, bgcolor: '#FF9800' }} />
							)}
							{pendingTasks > 0 && (
								<Box sx={{ flexBasis: `${(pendingTasks / totalTasks) * 100}%`, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.2)' }} />
							)}
						</Box>
					</Tooltip>
				</Box>
			)}

			<Stack direction="row" justifyContent="space-between" alignItems="center">
				<Box sx={{ minWidth: 0 }}>
					{formatValue(deal.value, deal.currency) && (
						<Typography variant="caption" sx={{ fontWeight: 700, color: 'success.main', display: 'block' }}>
							{formatValue(deal.value, deal.currency)}
						</Typography>
					)}
					{deal.display_value != null && deal.display_currency && (
						<Tooltip title={`Today's converted value, as of ${formatDate(new Date())}`} arrow>
							<Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', display: 'block' }}>
								≈ {formatMoney(deal.display_value, deal.display_currency)}
							</Typography>
						</Tooltip>
					)}
				</Box>
				<Typography variant="caption" color="text.disabled">{deal.probability}%</Typography>
			</Stack>
		</KanbanCard>
	);
};

export default DealCard;
