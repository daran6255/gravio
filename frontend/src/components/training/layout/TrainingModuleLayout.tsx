import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
	fetchTrainingBatches,
	fetchAllocations,
} from '../../../store/slices/trainingSlice';
import type { TrainingBatch } from '../../../models/training';
import BatchSelectionHeader from '../common/BatchSelectionHeader';
import BatchInfoBar from '../common/BatchInfoBar';
import ModuleLayout from '../../common/layout/ModuleLayout';

interface TrainingModuleLayoutProps {
	title: string;
	subtitle: string;
	children: (props: { selectedBatch: TrainingBatch; allocations: any[]; loading: boolean }) => React.ReactNode;
}

/**
 * Common Training Module Layout
 * Provides consistent batch selection and context across all training sub-modules.
 */
const TrainingModuleLayout: React.FC<TrainingModuleLayoutProps> = ({
	title,
	subtitle,
	children
}) => {
	const dispatch = useAppDispatch();
	const [searchParams, setSearchParams] = useSearchParams();

	const { batches, allocations, loading } = useAppSelector((state) => state.training);
	const [selectedBatch, setSelectedBatch] = useState<TrainingBatch | null>(null);

	const batchPublicId = searchParams.get('batchId');

	// Initial fetch of all training batches
	useEffect(() => {
		dispatch(fetchTrainingBatches({ limit: 1000 }));
	}, [dispatch]);

	// Sync selected batch with URL params
	useEffect(() => {
		if (batches.length > 0) {
			if (batchPublicId) {
				const batch = batches.find(b => b.public_id === batchPublicId);
				if (batch) {
					setSelectedBatch(batch);
				} else {
					setSearchParams({});
				}
			}
		}
	}, [batches, batchPublicId, setSearchParams]);

	// Fetch specific batch context (allocations/stats)
	useEffect(() => {
		if (selectedBatch) {
			dispatch(fetchAllocations({ batchPublicId: selectedBatch.public_id }));
		}
	}, [selectedBatch, dispatch]);

	const handleBatchChange = (newValue: TrainingBatch | null) => {
		setSelectedBatch(newValue);
		if (newValue) {
			setSearchParams({ batchId: newValue.public_id });
		} else {
			setSearchParams({});
		}
	};

	return (
		<ModuleLayout
			title={title}
			subtitle={subtitle}
			headerExtra={
				<BatchSelectionHeader
					batches={batches}
					selectedBatch={selectedBatch}
					onBatchChange={handleBatchChange}
				/>
			}
			headerChildren={
				selectedBatch && (
					<BatchInfoBar 
						batch={selectedBatch} 
						enrollmentCount={allocations.length} 
					/>
				)
			}
			isEmpty={!selectedBatch}
			emptyTitle="No Training Batch Selected"
			emptyMessage="Please select an active training batch from the header console to begin managing the training lifecycle."
			loading={loading}
		>
			{selectedBatch && children({ selectedBatch, allocations, loading })}
		</ModuleLayout>
	);
};

export default TrainingModuleLayout;
