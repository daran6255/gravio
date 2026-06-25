import React from 'react';
import { Box, Container, Button, MenuItem, TextField, Stack } from '@mui/material';
import { Settings } from '@mui/icons-material';
import PageHeader from '../../components/common/page-header';
import {
	DealsKanbanBoard,
	DealDetailDrawer,
	DealsModals,
	useDealsKanban,
} from '../../components/crm';
import { useAppSelector } from '../../store/hooks';

/**
 * CRM Deals — visual sales pipeline. Drag cards between stages; dropping into a
 * "Lost" stage prompts for a reason, dropping into "Won" applies immediately.
 */
const DealsPage: React.FC = () => {
	const {
		pipelines,
		activePipelineId,
		setActivePipelineId,
		activePipeline,
		deals,
		dealsLoading,
		canManagePipeline,
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
	} = useDealsKanban();

	const { companyOptions } = useAppSelector((state) => state.crm);

	const headerAction = (
		<Stack direction="row" spacing={1.5} alignItems="center">
			{pipelines.length > 1 && (
				<TextField
					select
					size="small"
					value={activePipelineId ?? ''}
					onChange={(e) => setActivePipelineId(Number(e.target.value))}
					sx={{ minWidth: 180 }}
				>
					{pipelines.map((p) => (
						<MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
					))}
				</TextField>
			)}
			{canManagePipeline && (
				<Button
					variant="outlined"
					startIcon={<Settings fontSize="small" />}
					onClick={() => setStageDialogOpen(true)}
					sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '10px' }}
				>
					Manage Stages
				</Button>
			)}
		</Stack>
	);

	return (
		<Box component="main" sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
			<Container maxWidth="xl" sx={{ py: { xs: 2, sm: 4 } }}>
				<PageHeader
					title="Deals"
					subtitle="Drag a card to move it through your pipeline"
					action={headerAction}
				/>

				<DealsKanbanBoard
					pipeline={activePipeline}
					deals={deals}
					companyOptions={companyOptions}
					loading={dealsLoading}
					onMoveDeal={handleMoveDeal}
					onViewDeal={handleViewDeal}
					onEditDeal={handleEditDeal}
					onDeleteDeal={handleDeleteRequest}
				/>

				<DealDetailDrawer
					open={detailOpen}
					onClose={() => setDetailOpen(false)}
					deal={selectedDeal}
				/>

				<DealsModals
					pendingMove={pendingMove}
					onClosePendingMove={() => setPendingMove(null)}
					stageDialogOpen={stageDialogOpen}
					onCloseStageDialog={() => setStageDialogOpen(false)}
					activePipeline={activePipeline}
					deleteTarget={deleteTarget}
					onCloseDelete={() => setDeleteTarget(null)}
					onConfirmDelete={handleConfirmDelete}
					deleteLoading={deleteLoading}
				/>
			</Container>
		</Box>
	);
};

export default DealsPage;
