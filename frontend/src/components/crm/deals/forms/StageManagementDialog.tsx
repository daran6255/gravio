import React from 'react';
import CommonStageManagementDialog from '../../../common/kanban/StageManagementDialog';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { updatePipelineStages } from '../../../../store/slices/crmSlice';
import useToast from '../../../../hooks/useToast';
import type { Pipeline } from '../../../../models/crm/pipeline';

interface StageManagementDialogProps {
	open: boolean;
	onClose: () => void;
	pipeline: Pipeline | undefined;
}

export const StageManagementDialog: React.FC<StageManagementDialogProps> = ({ open, onClose, pipeline }) => {
	const dispatch = useAppDispatch();
	const toast = useToast();
	const { pipelineMutationLoading } = useAppSelector((state) => state.crm);

	const handleSave = async (updatedStages: any[]) => {
		if (!pipeline) return;
		try {
			await dispatch(updatePipelineStages({
				pipelineId: pipeline.id,
				stages: updatedStages,
			})).unwrap();
			toast.success('Pipeline stages updated');
		} catch (err: any) {
			throw err || 'Failed to update stages';
		}
	};

	return (
		<CommonStageManagementDialog
			open={open}
			onClose={onClose}
			title="Manage Pipeline Stages"
			subtitle={pipeline?.name}
			loading={pipelineMutationLoading}
			initialItems={pipeline?.stages ?? []}
			type="deals"
			onSave={handleSave}
		/>
	);
};

export default StageManagementDialog;
