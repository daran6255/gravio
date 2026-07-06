import React from 'react';
import { Box, Container, Button, MenuItem, TextField, InputAdornment } from '@mui/material';
import { Settings, Add, Search as SearchIcon } from '@mui/icons-material';
import { responsiveStyles, fieldWidth } from '../../theme';
import PageHeader from '../../components/common/page-header';
import {
	DealsKanbanBoard,
	DealDetailDrawer,
	DealsModals,
	useDealsKanban,
} from '../../components/crm';
import { ConvertDealToProjectDialog } from '../../components/projects';
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
		refreshDeals,
		convertOpen,
		setConvertOpen,
		convertingDeal,
		handleConvertToProject,
		handleConverted,
	} = useDealsKanban();

	const { companyOptions, owners } = useAppSelector((state) => state.crm);

	const headerAction = (
		<Box sx={responsiveStyles.headerActionRow}>
			{pipelines.length > 1 && (
				<TextField
					select
					size="small"
					value={activePipelineId ?? ''}
					onChange={(e) => setActivePipelineId(Number(e.target.value))}
					sx={fieldWidth(180)}
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
				sx={(theme) => ({
					color: 'white',
					textTransform: 'none',
					fontWeight: 700,
					borderRadius: '10px',
					height: 40,
					boxShadow: 'none',
					background: theme.gradients.brand,
					'&:hover': {
						boxShadow: '0 4px 12px rgba(139,124,246,0.3)',
					}
				})}
			>
				New Deal
			</Button>
		</Box>
	);

	return (
		<Box component="main" sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
			<Container maxWidth={false} sx={responsiveStyles.pageContainer}>
				<PageHeader
					title="Deals"
					subtitle="Drag a card to move it through your pipeline"
					action={headerAction}
				/>

				<Box
					sx={{
						mb: 3.5,
						display: 'flex',
						flexDirection: { xs: 'column', sm: 'row' },
						alignItems: { xs: 'stretch', sm: 'center' },
						gap: 2
					}}
				>
					<TextField
						size="small"
						label="Search"
						placeholder="Search deals..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									<SearchIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
								</InputAdornment>
							)
						}}
						sx={{
							width: { xs: '100%', sm: 260 },
							'& .MuiOutlinedInput-root': {
								borderRadius: '8px',
								bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
							}
						}}
					/>
					<TextField
						select
						size="small"
						label="Owner"
						value={ownerFilter}
						onChange={(e) => setOwnerFilter(e.target.value ? Number(e.target.value) : '')}
						sx={{
							width: { xs: '100%', sm: 180 },
							'& .MuiOutlinedInput-root': {
								borderRadius: '8px',
								bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
							}
						}}
					>
						<MenuItem value="">All Owners</MenuItem>
						{owners.map((o) => (
							<MenuItem key={o.id} value={o.id}>
								{o.full_name || o.email}
							</MenuItem>
						))}
					</TextField>
				</Box>

				<DealsKanbanBoard
					pipeline={activePipeline}
					deals={deals}
					companyOptions={companyOptions}
					loading={dealsLoading}
					onMoveDeal={handleMoveDeal}
					onViewDeal={handleViewDeal}
					onEditDeal={handleEditDeal}
					onDeleteDeal={handleDeleteRequest}
					owners={owners}
				/>

				<DealDetailDrawer
					open={detailOpen}
					onClose={() => { setDetailOpen(false); refreshDeals(); }}
					deal={selectedDeal}
					owners={owners}
					onEdit={handleEditDeal}
					onDelete={handleDeleteRequest}
					onConvertToProject={handleConvertToProject}
				/>

				<ConvertDealToProjectDialog
					open={convertOpen}
					onClose={() => setConvertOpen(false)}
					deal={convertingDeal}
					onConverted={handleConverted}
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
