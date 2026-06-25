import React, { useState } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { DndContext, DragOverlay, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core';
import KanbanColumn from './KanbanColumn';
import DealCard from './DealCard';
import type { Deal } from '../../../../models/crm/deal';
import type { Pipeline, PipelineStage } from '../../../../models/crm/pipeline';
import type { Company } from '../../../../models/crm/company';

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
	const [activeDeal, setActiveDeal] = useState<Deal | null>(null);

	const handleDragStart = (event: DragStartEvent) => {
		setActiveDeal((event.active.data.current?.deal as Deal) ?? null);
	};

	const handleDragEnd = (event: DragEndEvent) => {
		setActiveDeal(null);
		const { active, over } = event;
		if (!over || !pipeline) return;

		const deal = active.data.current?.deal as Deal | undefined;
		const targetStage = pipeline.stages.find((s) => s.id === over.id);
		if (!deal || !targetStage || deal.stage_id === targetStage.id) return;

		onMoveDeal(deal, targetStage);
	};

	if (loading) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
				<CircularProgress />
			</Box>
		);
	}

	if (!pipeline) {
		return (
			<Box sx={{ textAlign: 'center', py: 8 }}>
				<Typography color="text.secondary">No pipeline found for your organization.</Typography>
			</Box>
		);
	}

	const dealsByStage = (stageId: number) => deals.filter((d) => d.stage_id === stageId);

	return (
		<DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
			<Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 2 }}>
				{pipeline.stages.map((stage) => (
					<KanbanColumn
						key={stage.id}
						stage={stage}
						deals={dealsByStage(stage.id)}
						companyOptions={companyOptions}
						onViewDeal={onViewDeal}
						onEditDeal={onEditDeal}
						onDeleteDeal={onDeleteDeal}
					/>
				))}
			</Box>

			<DragOverlay>
				{activeDeal && (
					<DealCard
						deal={activeDeal}
						companyName={companyOptions.find((c) => c.id === activeDeal.company_id)?.name}
						onView={() => {}}
						onEdit={() => {}}
						onDelete={() => {}}
					/>
				)}
			</DragOverlay>
		</DndContext>
	);
};

export default DealsKanbanBoard;
