import React, { useState, useCallback } from 'react';
import {
	Box,
	Container,
	Button
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useAppSelector } from '../../store/hooks';
import type { TrainingBatch } from '../../models/training';

// Common Components
import PageHeader from '../../components/common/page-header';

// Batch Components
import TrainingStats from '../../components/training/batch/stats/TrainingStats';
import TrainingTable from '../../components/training/batch/table/TrainingTable';
import TrainingBatchFormDialog from '../../components/training/batch/form/TrainingBatchFormDialog';
import ExtendBatchDialog from '../../components/training/batch/dialogs/ExtendBatchDialog';

// Hooks
import { useTrainingActions } from '../../components/training/batch/hooks/useTrainingActions';

/**
 * Training Batch Management Page
 * Standardized dashboard for managing training batches, schedules, and assignments.
 * Aligned with UserManagement architecture.
 */
const TrainingBatchList: React.FC = () => {
	const { user } = useAppSelector((state) => state.auth);
	const isAdmin = user?.role === 'admin' || user?.is_superuser;
	const isManager = user?.role === 'manager';
	const canManage = isAdmin || isManager;

	const { handleFormSubmit, handleExtendConfirm } = useTrainingActions();

	// --- State Management ---
	const [refreshKey, setRefreshKey] = useState(0);
	const [selectedBatch, setSelectedBatch] = useState<TrainingBatch | undefined>(undefined);
	const [formDialogOpen, setFormDialogOpen] = useState(false);
	const [extendDialogOpen, setExtendDialogOpen] = useState(false);

	// --- Handlers ---
	const refreshData = useCallback(() => setRefreshKey(prev => prev + 1), []);

	const handleCreateBatch = () => {
		setSelectedBatch(undefined);
		setFormDialogOpen(true);
	};

	const handleEditBatch = (batch: TrainingBatch) => {
		setSelectedBatch(batch);
		setFormDialogOpen(true);
	};

	const handleExtendBatch = (batch: TrainingBatch) => {
		setSelectedBatch(batch);
		setExtendDialogOpen(true);
	};

	const handleCloseDialogs = () => {
		setFormDialogOpen(false);
		setExtendDialogOpen(false);
		setSelectedBatch(undefined);
	};

	const onFormSubmit = async (data: Partial<TrainingBatch>) => {
		const success = await handleFormSubmit(data, selectedBatch);
		if (success) {
			refreshData();
			handleCloseDialogs();
		}
	};

	const onExtendConfirm = async (newDate: string, reason: string) => {
		if (!selectedBatch) return;
		const success = await handleExtendConfirm(selectedBatch, newDate, reason);
		if (success) {
			refreshData();
			handleCloseDialogs();
		}
	};

	// Header Action
	const headerAction = canManage ? (
		<Button
			variant="contained"
			startIcon={<AddIcon />}
			onClick={handleCreateBatch}
			sx={{
				textTransform: 'none',
				fontWeight: 600,
				px: 3,
				py: 1,
				borderRadius: 3,
				boxShadow: 'none',
				'&:hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }
			}}
		>
			Create Batch
		</Button>
	) : undefined;

	return (
		<Box component="main" sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
			<Container maxWidth="xl" sx={{ py: { xs: 2, sm: 4 } }}>

				<PageHeader
					title="Training Batches"
					subtitle="Manage and monitor all enterprise training batches"
					action={headerAction}
				/>

				<TrainingStats refreshKey={refreshKey} />

				<TrainingTable
					refreshKey={refreshKey}
					onEdit={handleEditBatch}
					onExtend={handleExtendBatch}
					onRefresh={refreshData}
				/>

				{/* Modals Layer */}
				<TrainingBatchFormDialog
					open={formDialogOpen}
					onClose={handleCloseDialogs}
					onSubmit={onFormSubmit}
					initialData={selectedBatch}
				/>

				<ExtendBatchDialog
					open={extendDialogOpen}
					onClose={handleCloseDialogs}
					onConfirm={onExtendConfirm}
					currentCloseDate={selectedBatch?.approx_close_date || selectedBatch?.duration?.end_date || ''}
					batchName={selectedBatch?.batch_name || ''}
				/>
			</Container>
		</Box>
	);
};

export default TrainingBatchList;
