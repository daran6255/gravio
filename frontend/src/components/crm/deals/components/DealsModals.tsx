import React from 'react';
import { WonLostDialog, StageManagementDialog, DealFormDialog } from '../forms';
import { ConfirmationDialog } from '../../../common/dialogbox';
import type { Deal } from '../../../../models/crm/deal';
import type { Pipeline, PipelineStage } from '../../../../models/crm/pipeline';

interface DealsModalsProps {
	pendingMove: { deal: Deal; targetStage: PipelineStage } | null;
	onClosePendingMove: () => void;

	stageDialogOpen: boolean;
	onCloseStageDialog: () => void;
	activePipeline: Pipeline | undefined;

	deleteTarget: Deal | null;
	onCloseDelete: () => void;
	onConfirmDelete: () => void;
	deleteLoading: boolean;

	formOpen: boolean;
	onCloseForm: () => void;
	editingDeal: Deal | null;
	activePipelineId: number | null;
	onFormSuccess: (deal: Deal) => void;
}

export const DealsModals: React.FC<DealsModalsProps> = ({
	pendingMove,
	onClosePendingMove,
	stageDialogOpen,
	onCloseStageDialog,
	activePipeline,
	deleteTarget,
	onCloseDelete,
	onConfirmDelete,
	deleteLoading,
	formOpen,
	onCloseForm,
	editingDeal,
	activePipelineId,
	onFormSuccess,
}) => {
	return (
		<>
			<DealFormDialog
				open={formOpen}
				onClose={onCloseForm}
				deal={editingDeal}
				activePipelineId={activePipelineId}
				onSuccess={onFormSuccess}
			/>

			<WonLostDialog
				open={!!pendingMove}
				onClose={onClosePendingMove}
				deal={pendingMove?.deal ?? null}
				targetStage={pendingMove?.targetStage ?? null}
			/>

			<StageManagementDialog
				open={stageDialogOpen}
				onClose={onCloseStageDialog}
				pipeline={activePipeline}
			/>

			<ConfirmationDialog
				open={!!deleteTarget}
				onClose={onCloseDelete}
				onConfirm={onConfirmDelete}
				title="Delete Deal"
				subtitle="Permanently delete this deal"
				message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
				confirmLabel="Delete"
				severity="error"
				loading={deleteLoading}
			/>
		</>
	);
};

export default DealsModals;
