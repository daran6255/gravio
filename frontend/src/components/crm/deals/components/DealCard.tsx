import React from 'react';
import { Box, Typography, Stack, useTheme, alpha } from '@mui/material';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
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

const formatValue = (value?: number, currency?: string) => {
	if (value == null) return null;
	return `${value.toLocaleString()} ${currency || ''}`.trim();
};

export const DealCard: React.FC<DealCardProps> = ({ deal, companyName, onView, onEdit, onDelete }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
		id: deal.public_id,
		data: { deal },
	});

	const actions: TableMenuAction<Deal>[] = [
		{ label: 'View Details', icon: <Visibility fontSize="small" />, onClick: () => onView(deal) },
		{ label: 'Edit', icon: <Edit fontSize="small" />, onClick: () => onEdit(deal) },
		{ label: 'Delete', icon: <DeleteOutline fontSize="small" />, onClick: () => onDelete(deal), color: 'error.main', divider: true },
	];

	return (
		<Box
			ref={setNodeRef}
			{...listeners}
			{...attributes}
			onClick={() => onView(deal)}
			sx={{
				p: 1.5,
				mb: 1.25,
				borderRadius: '12px',
				border: '1px solid',
				borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
				bgcolor: theme.palette.background.paper,
				cursor: 'grab',
				touchAction: 'none',
				opacity: isDragging ? 0.4 : 1,
				transform: transform ? CSS.Translate.toString(transform) : undefined,
				transition: 'box-shadow 0.15s ease, border-color 0.15s ease',
				'&:hover': {
					borderColor: alpha(theme.palette.primary.main, 0.3),
					boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.1)}`,
				},
			}}
		>
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
		</Box>
	);
};

export default DealCard;
