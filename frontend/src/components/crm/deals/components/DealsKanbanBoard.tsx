import React from 'react';
import { Box, Typography } from '@mui/material';
import { KanbanBoard, type KanbanColumnDef } from '../../../common/kanban';
import DealCard from './DealCard';
import type { Deal } from '../../../../models/crm/deal';
import type { Pipeline, PipelineStage } from '../../../../models/crm/pipeline';
import type { Company } from '../../../../models/crm/company';
import { useAppSelector } from '../../../../store/hooks';
import { formatMoney } from '../../../../utils/currency';

interface DealsKanbanBoardProps {
	pipeline: Pipeline | undefined;
	deals: Deal[];
	companyOptions: Company[];
	loading: boolean;
	onMoveDeal: (deal: Deal, targetStage: PipelineStage) => void;
	onViewDeal: (deal: Deal) => void;
	onEditDeal: (deal: Deal) => void;
	onDeleteDeal: (deal: Deal) => void;
}

export const DealsKanbanBoard: React.FC<DealsKanbanBoardProps> = ({
	pipeline,
	deals,
	companyOptions,
	loading,
	onMoveDeal,
	onViewDeal,
	onEditDeal,
	onDeleteDeal,
}) => {
	const displayCurrency = useAppSelector((state) => state.auth.user?.currency) || 'USD';

	if (!pipeline) {
		return loading ? null : (
			<Box sx={{ textAlign: 'center', py: 8 }}>
				<Typography color="text.secondary">No pipeline found for your organization.</Typography>
			</Box>
		);
	}

	const columns: KanbanColumnDef[] = pipeline.stages.map((stage) => ({
		id: stage.id,
		label: stage.name,
		color: stage.color,
	}));

	return (
		<KanbanBoard<Deal>
			columns={columns}
			items={deals}
			loading={loading}
			getItemId={(deal) => deal.public_id}
			getItemColumnId={(deal) => deal.stage_id}
			renderCard={(deal) => (
				<DealCard
					deal={deal}
					companyName={companyOptions.find((c) => c.id === deal.company_id)?.name}
					onView={onViewDeal}
					onEdit={onEditDeal}
					onDelete={onDeleteDeal}
				/>
			)}
			renderColumnFooter={(columnDeals) => {
				const total = columnDeals.reduce((sum, d) => sum + (d.display_value ?? d.value ?? 0), 0);
				return (
					<Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
						{formatMoney(total, displayCurrency)} total
					</Typography>
				);
			}}
			onMoveItem={(deal, column) => {
				const targetStage = pipeline.stages.find((s) => s.id === column.id);
				if (targetStage) onMoveDeal(deal, targetStage);
			}}
		/>
	);
};

export default DealsKanbanBoard;
