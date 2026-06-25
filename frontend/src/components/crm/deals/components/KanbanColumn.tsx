import React from 'react';
import { Box, Typography, Stack, useTheme, alpha } from '@mui/material';
import { useDroppable } from '@dnd-kit/core';
import DealCard from './DealCard';
import type { Deal } from '../../../../models/crm/deal';
import type { PipelineStage } from '../../../../models/crm/pipeline';
import type { Company } from '../../../../models/crm/company';

interface KanbanColumnProps {
	stage: PipelineStage;
	deals: Deal[];
	companyOptions: Company[];
	onViewDeal: (deal: Deal) => void;
	onEditDeal: (deal: Deal) => void;
	onDeleteDeal: (deal: Deal) => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({ stage, deals, companyOptions, onViewDeal, onEditDeal, onDeleteDeal }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const { setNodeRef, isOver } = useDroppable({ id: stage.id });

	const totalValue = deals.reduce((sum, d) => sum + (d.value || 0), 0);

	return (
		<Box
			sx={{
				display: 'flex',
				flexDirection: 'column',
				width: 280,
				flexShrink: 0,
				borderRadius: '16px',
				border: '1px solid',
				borderColor: isOver ? alpha(theme.palette.primary.main, 0.5) : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'),
				bgcolor: isOver ? alpha(theme.palette.primary.main, 0.04) : (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)'),
				transition: 'background-color 0.15s ease, border-color 0.15s ease',
			}}
		>
			<Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }}>
				<Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
					<Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: stage.color }} />
					<Typography variant="body2" sx={{ fontWeight: 700, flex: 1 }}>{stage.name}</Typography>
					<Typography variant="caption" color="text.secondary">{deals.length}</Typography>
				</Stack>
				<Typography variant="caption" color="text.secondary">
					{totalValue.toLocaleString()} total
				</Typography>
			</Box>

			<Box ref={setNodeRef} sx={{ flex: 1, p: 1.25, minHeight: 120, overflowY: 'auto' }}>
				{deals.map((deal) => (
					<DealCard
						key={deal.public_id}
						deal={deal}
						companyName={companyOptions.find((c) => c.id === deal.company_id)?.name}
						onView={onViewDeal}
						onEdit={onEditDeal}
						onDelete={onDeleteDeal}
					/>
				))}
			</Box>
		</Box>
	);
};

export default KanbanColumn;
