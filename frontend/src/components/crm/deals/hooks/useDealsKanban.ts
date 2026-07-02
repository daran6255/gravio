import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { fetchPipelines, fetchDeals, updateDeal, deleteDeal, searchCompanyOptions, searchContactOptions, fetchOwners } from '../../../../store/slices/crmSlice';
import useToast from '../../../../hooks/useToast';
import type { Deal } from '../../../../models/crm/deal';
import type { PipelineStage } from '../../../../models/crm/pipeline';

export const useDealsKanban = () => {
	const dispatch = useAppDispatch();
	const toast = useToast();
	const { pipelines, pipelinesLoading, deals, dealsLoading } = useAppSelector((state) => state.crm);
	const { user } = useAppSelector((state) => state.auth);

	const [activePipelineId, setActivePipelineId] = useState<number | null>(null);
	const [refreshKey, setRefreshKey] = useState(0);

	const [searchTerm, setSearchTerm] = useState('');
	const [ownerFilter, setOwnerFilter] = useState<number | ''>('');

	const [formOpen, setFormOpen] = useState(false);
	const [editingDeal, setEditingDeal] = useState<Deal | null>(null);

	const [detailOpen, setDetailOpen] = useState(false);
	const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);

	const [stageDialogOpen, setStageDialogOpen] = useState(false);

	const [pendingMove, setPendingMove] = useState<{ deal: Deal; targetStage: PipelineStage } | null>(null);

	const [deleteTarget, setDeleteTarget] = useState<Deal | null>(null);
	const [deleteLoading, setDeleteLoading] = useState(false);

	const canManagePipeline = user?.role === 'admin' || user?.role === 'manager';

	useEffect(() => {
		dispatch(fetchPipelines());
		dispatch(searchCompanyOptions(undefined));
		dispatch(searchContactOptions(undefined));
		dispatch(fetchOwners());
	}, [dispatch, refreshKey]);

	useEffect(() => {
		if (!pipelines.length || activePipelineId !== null) return;
		const defaultPipeline = pipelines.find((p) => p.is_default) || pipelines[0];
		if (defaultPipeline) setActivePipelineId(defaultPipeline.id);
	}, [pipelines, activePipelineId]);

	useEffect(() => {
		if (activePipelineId !== null) {
			dispatch(fetchDeals({
				pipelineId: activePipelineId,
				search: searchTerm || undefined,
				ownerId: ownerFilter || undefined,
			}));
		}
	}, [dispatch, activePipelineId, searchTerm, ownerFilter, refreshKey]);

	const activePipeline = useMemo(
		() => pipelines.find((p) => p.id === activePipelineId),
		[pipelines, activePipelineId]
	);

	const refreshData = useCallback(() => setRefreshKey((k) => k + 1), []);

	const refreshDeals = useCallback(() => {
		if (activePipelineId === null) return;
		dispatch(fetchDeals({
			pipelineId: activePipelineId,
			search: searchTerm || undefined,
			ownerId: ownerFilter || undefined,
		}));
	}, [dispatch, activePipelineId, searchTerm, ownerFilter]);

	const handleCreateClick = () => {
		setEditingDeal(null);
		setFormOpen(true);
	};

	const handleViewDeal = (deal: Deal) => {
		setSelectedDeal(deal);
		setDetailOpen(true);
	};

	const handleEditDeal = (deal: Deal) => {
		setEditingDeal(deal);
		setFormOpen(true);
	};

	const handleDeleteRequest = (deal: Deal) => setDeleteTarget(deal);

	const handleConfirmDelete = async () => {
		if (!deleteTarget) return;
		setDeleteLoading(true);
		try {
			await dispatch(deleteDeal(deleteTarget.public_id)).unwrap();
			toast.success('Deal deleted');
			if (selectedDeal?.public_id === deleteTarget.public_id) setDetailOpen(false);
			setDeleteTarget(null);
		} catch (err: any) {
			toast.error(err || 'Failed to delete deal');
		} finally {
			setDeleteLoading(false);
		}
	};

	const handleMoveDeal = async (deal: Deal, targetStage: PipelineStage) => {
		if (targetStage.is_lost_stage) {
			setPendingMove({ deal, targetStage });
			return;
		}
		try {
			await dispatch(updateDeal({ publicId: deal.public_id, payload: { stage_id: targetStage.id } })).unwrap();
			toast.success(targetStage.is_won_stage ? 'Deal marked as Won 🎉' : `Moved to ${targetStage.name}`);
		} catch (err: any) {
			toast.error(err || 'Failed to move deal');
		}
	};

	const handleFormSuccess = () => {
		refreshData();
	};

	return {
		pipelines,
		pipelinesLoading,
		activePipelineId,
		setActivePipelineId,
		activePipeline,
		deals,
		dealsLoading,
		canManagePipeline,
		refreshData,
		refreshDeals,

		searchTerm,
		setSearchTerm,
		ownerFilter,
		setOwnerFilter,

		formOpen,
		setFormOpen,
		editingDeal,
		handleCreateClick,

		detailOpen,
		setDetailOpen,
		selectedDeal,

		stageDialogOpen,
		setStageDialogOpen,

		pendingMove,
		setPendingMove,

		deleteTarget,
		setDeleteTarget,
		deleteLoading,

		handleViewDeal,
		handleEditDeal,
		handleDeleteRequest,
		handleConfirmDelete,
		handleMoveDeal,
		handleFormSuccess,
	};
};

export default useDealsKanban;
