import React from 'react';
import { Box, Typography, Stack } from '@mui/material';
import { KanbanCard } from '../../../common/kanban';
import { DataTableActions, type TableMenuAction } from '../../../common/table';
import { Visibility, Edit, DeleteOutline } from '@mui/icons-material';
import type { Deal } from '../../../../models/crm/deal';

interface DealCardProps {
	deal: Deal;
	companyName?: string;
	onView: (deal: Deal) => void;
	onEdit: (deal: Deal) => void;
	onDelete: (deal: Deal) => void;
}

const getCurrencySymbol = (currency?: string): string => {
	const map: Record<string, string> = {
		USD: '$',
		EUR: '€',
		INR: '₹',
		GBP: '£',
		JPY: '¥',
		AUD: 'A$',
		CAD: 'C$',
		CNY: '¥',
		SGD: 'S$',
	};
	return currency ? (map[currency.toUpperCase()] || '') : '';
};

const formatValue = (value?: number, currency?: string) => {
	if (value == null) return null;
	const symbol = getCurrencySymbol(currency);
	return `${symbol} ${value.toLocaleString()} ${currency || ''}`.trim();
};

export const DealCard: React.FC<DealCardProps> = ({ deal, companyName, onView, onEdit, onDelete }) => {
	const actions: TableMenuAction<Deal>[] = [
		{ label: 'View Details', icon: <Visibility fontSize="small" />, onClick: () => onView(deal) },
		{ label: 'Edit', icon: <Edit fontSize="small" />, onClick: () => onEdit(deal) },
		{ label: 'Delete', icon: <DeleteOutline fontSize="small" />, onClick: () => onDelete(deal), color: 'error.main', divider: true },
	];

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

			<Stack direction="row" justifyContent="space-between" alignItems="center">
				{formatValue(deal.value, deal.currency) && (
					<Typography variant="caption" sx={{ fontWeight: 700, color: 'success.main' }}>
						{formatValue(deal.value, deal.currency)}
					</Typography>
				)}
				<Typography variant="caption" color="text.disabled">{deal.probability}%</Typography>
			</Stack>
		</KanbanCard>
	);
};

export default DealCard;
