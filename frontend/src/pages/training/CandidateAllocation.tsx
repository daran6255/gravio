import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
	updateAllocationStatus,
	markAsDropout,
	fetchAllocations
} from '../../store/slices/trainingSlice';
import AllocateCandidateDialog from '../../components/training/form/AllocateCandidateDialog';
import MoveCandidateDialog from '../../components/training/form/MoveCandidateDialog';
import CandidateAllocationTable from '../../components/training/allocation/CandidateAllocationTable';
import useToast from '../../hooks/useToast';
import TrainingModuleLayout from '../../components/training/layout/TrainingModuleLayout';
import type { TrainingBatch, CandidateAllocation as CandidateAllocationModel } from '../../models/training';

interface AllocationManagerProps {
	selectedBatch: TrainingBatch;
	allocations: CandidateAllocationModel[];
}

const AllocationManager: React.FC<AllocationManagerProps> = ({ selectedBatch, allocations }) => {
	const dispatch = useAppDispatch();
	const toast = useToast();
	const { loading } = useAppSelector((state) => state.training);

	const [dialogOpen, setDialogOpen] = useState(false);
	const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState('');
	const [filterDropout, setFilterDropout] = useState<boolean | 'all'>('all');

	// Move Candidate Dialog State
	const [moveDialogOpen, setMoveDialogOpen] = useState(false);
	const [selectedAllocation, setSelectedAllocation] = useState<CandidateAllocationModel | null>(null);

	// Synchronize search/filter with layout fetch
	useEffect(() => {
		if (selectedBatch) {
			const params: any = {};
			if (searchQuery) params.search = searchQuery;
			if (filterDropout !== 'all') params.is_dropout = filterDropout;
			dispatch(fetchAllocations({ batchPublicId: selectedBatch.public_id, params }));
		}
	}, [searchQuery, filterDropout, selectedBatch, dispatch]);

	const handleStatusChange = async (publicId: string, newStatus: string, reason?: string) => {
		setUpdatingStatus(publicId);
		try {
			if (newStatus === 'dropped_out' && reason) {
				await dispatch(markAsDropout({ publicId, remark: reason })).unwrap();
			} else {
				await dispatch(updateAllocationStatus({ publicId, status: newStatus })).unwrap();
			}
			toast.success('Status updated successfully');
		} catch (error: any) {
			toast.error(error || 'Failed to update status');
		} finally {
			setUpdatingStatus(null);
		}
	};

	const handleMoveClick = (allocation: CandidateAllocationModel) => {
		setSelectedAllocation(allocation);
		setMoveDialogOpen(true);
	};

	return (
		<>
			<CandidateAllocationTable
				allocations={allocations}
				loading={loading}
				searchQuery={searchQuery}
				onSearchChange={setSearchQuery}
				filterDropout={filterDropout}
				onFilterChange={setFilterDropout}
				updatingStatusId={updatingStatus}
				onStatusChange={handleStatusChange}
				onMove={handleMoveClick}
				onAddClick={() => setDialogOpen(true)}
			/>

			{/* Dialogs */}
			<AllocateCandidateDialog
				open={dialogOpen}
				onClose={() => setDialogOpen(false)}
				batchId={selectedBatch.id}
				batchPublicId={selectedBatch.public_id}
				batchName={selectedBatch.batch_name}
			/>

			<MoveCandidateDialog
				open={moveDialogOpen}
				onClose={() => {
					setMoveDialogOpen(false);
					setSelectedAllocation(null);
				}}
				allocation={selectedAllocation}
			/>
		</>
	);
};

const CandidateAllocation: React.FC = () => {
	return (
		<TrainingModuleLayout
			title="Candidate Allocation"
			subtitle="Manage and monitor candidate enrollments and lifecycle with enterprise-grade precision."
		>
			{({ selectedBatch, allocations }) => (
				<AllocationManager selectedBatch={selectedBatch} allocations={allocations} />
			)}
		</TrainingModuleLayout>
	);
};

export default CandidateAllocation;
