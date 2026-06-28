import React from 'react';
import { Box, Container, Button, MenuItem, TextField, Stack } from '@mui/material';
import { Settings, Add } from '@mui/icons-material';
import PageHeader from '../../components/common/page-header';
import {
	DealsKanbanBoard,
	DealDetailDrawer,
	DealsModals,
	DealsStatsPanel,
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
		searchTerm,
		setSearchTerm,
		ownerFilter,
		setOwnerFilter,
		formOpen,
		setFormOpen,
		editingDeal,
		handleCreateClick,
		handleFormSuccess,
	} = useDealsKanban();

	const { companyOptions, owners } = useAppSelector((state) => state.crm);

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
					sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '10px', height: 40 }}
				>
					Manage Stages
				</Button>
			)}
			<Button
				variant="contained"
				startIcon={<Add />}
				onClick={handleCreateClick}
				sx={{
					color: 'white',
					textTransform: 'none',
					fontWeight: 700,
					borderRadius: '10px',
					height: 40,
					boxShadow: 'none',
					background: 'linear-gradient(90deg, #8B7CF6 0%, #4EA8FF 100%)',
					'&:hover': {
						boxShadow: '0 4px 12px rgba(139,124,246,0.3)',
					}
				}}
			>
				New Deal
			</Button>
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

				<DealsStatsPanel deals={deals} />

				<Stack
					direction={{ xs: 'column', sm: 'row' }}
					spacing={2}
					alignItems="center"
					justifyContent="space-between"
					sx={{ mb: 3 }}
				>
					<Stack direction="row" spacing={2} sx={{ width: { xs: '100%', sm: 'auto' } }}>
						<TextField
							size="small"
							placeholder="Search deals..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							sx={{ minWidth: 240 }}
						/>
						<TextField
							select
							size="small"
							label="Owner"
							value={ownerFilter}
							onChange={(e) => setOwnerFilter(e.target.value ? Number(e.target.value) : '')}
							sx={{ minWidth: 160 }}
						>
							<MenuItem value="">All Owners</MenuItem>
							{owners.map((o) => (
								<MenuItem key={o.id} value={o.id}>
									{o.full_name || o.email}
								</MenuItem>
							))}
						</TextField>
					</Stack>
				</Stack>

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
					formOpen={formOpen}
					onCloseForm={() => setFormOpen(false)}
					editingDeal={editingDeal}
					activePipelineId={activePipelineId}
					onFormSuccess={handleFormSuccess}
				/>
			</Container>
		</Box>
	);
};

export default DealsPage;
