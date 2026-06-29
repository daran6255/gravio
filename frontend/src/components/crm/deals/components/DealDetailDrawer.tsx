import React, { useEffect, useState } from 'react';
import { Box, Typography, Stack, IconButton, Tooltip, useTheme, alpha, Tabs, Tab } from '@mui/material';
import { Edit, DeleteOutline } from '@mui/icons-material';
import DetailDrawer from '../../../common/drawer/DetailDrawer';
import StatusBadge from '../../../common/badge/StatusBadge';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { updateDeal, searchCompanyOptions, searchContactOptions } from '../../../../store/slices/crmSlice';
import useToast from '../../../../hooks/useToast';
import type { Deal } from '../../../../models/crm/deal';
import type { CRMOwnerOption } from '../../../../models/crm/owner';

// Import refactored tab components
import { DealDetailsTab } from './tabs/DealDetailsTab';
import { DealTasksTab } from './tabs/DealTasksTab';
import { DealAttachmentsTab } from './tabs/DealAttachmentsTab';
import { DealNotesTab } from './tabs/DealNotesTab';

interface DealDetailDrawerProps {
	open: boolean;
	onClose: () => void;
	deal: Deal | null;
	owners: CRMOwnerOption[];
	onEdit?: (deal: Deal) => void;
	onDelete?: (deal: Deal) => void;
}

export const DealDetailDrawer: React.FC<DealDetailDrawerProps> = ({
	open, onClose, deal, owners, onEdit, onDelete
}) => {
	const dispatch = useAppDispatch();
	const theme = useTheme();
	const isDark = theme.palette.mode === 'dark';
	const toast = useToast();

	const [tab, setTab] = useState(0);
	const [prevDealId, setPrevDealId] = useState<number | undefined>(deal?.id);

	if (deal?.id !== prevDealId) {
		setPrevDealId(deal?.id);
		setTab(0);
	}

	useEffect(() => {
		if (open) {
			dispatch(searchCompanyOptions(undefined));
			dispatch(searchContactOptions(undefined));
		}
	}, [open, dispatch]);

	if (!deal) return null;

	const { pipelines } = useAppSelector((state) => state.crm);
	const pipeline = pipelines.find((p) => p.id === deal.pipeline_id);
	const stage = pipeline?.stages.find((s) => s.id === deal.stage_id);
	const displayId = `DL-${String(deal.id).padStart(5, '0')}`;

	const handleStageChange = async (targetStageId: number) => {
		try {
			await dispatch(updateDeal({ publicId: deal.public_id, payload: { stage_id: targetStageId } })).unwrap();
			const targetStage = pipeline?.stages.find((s) => s.id === targetStageId);
			toast.success(targetStage?.is_won_stage ? 'Deal marked as Won 🎉' : `Moved to ${targetStage?.name}`);
		} catch (err: any) {
			toast.error(err || 'Failed to update stage');
		}
	};

	return (
		<DetailDrawer
			open={open}
			onClose={onClose}
			title={deal.title}
			width={600}
			disablePadding={true}
			headerExtra={<StatusBadge label={deal.status} status={deal.status} type="deal" />}
			headerActions={
				<Stack direction="row" spacing={1} sx={{ mr: 1 }}>
					{onEdit && (
						<Tooltip title="Edit Deal">
							<IconButton
								size="small"
								onClick={() => {
									onClose();
									onEdit(deal);
								}}
								sx={{ border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
							>
								<Edit fontSize="small" />
							</IconButton>
						</Tooltip>
					)}
					{onDelete && (
						<Tooltip title="Delete Deal">
							<IconButton
								size="small"
								onClick={() => {
									onClose();
									onDelete(deal);
								}}
								sx={{
									border: '1px solid',
									borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
									color: 'error.main',
									'&:hover': { bgcolor: alpha(theme.palette.error.main, 0.08) }
								}}
							>
								<DeleteOutline fontSize="small" />
							</IconButton>
						</Tooltip>
					)}
				</Stack>
			}
		>
			{/* Visual Stage Progress Stepper Bar */}
			{pipeline && (
				<Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', bgcolor: isDark ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)' }}>
					<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.25 }}>
						<Stack direction="row" alignItems="center" spacing={1}>
							<Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', px: 1, py: 0.3, borderRadius: '4px' }}>
								{displayId}
							</Typography>
							<Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
								Pipeline: <strong style={{ color: theme.palette.text.primary }}>{pipeline.name}</strong>
							</Typography>
						</Stack>
						{stage && (
							<Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
								Stage: <strong style={{ color: theme.palette.primary.main }}>{stage.name} ({deal.probability}%)</strong>
							</Typography>
						)}
					</Stack>
					<Stack direction="row" spacing={0.5} sx={{ width: '100%' }}>
						{pipeline.stages.map((s) => {
							const isCurrent = s.id === deal.stage_id;
							const isCompleted = stage ? s.order < stage.order : false;
							const isWon = s.is_won_stage;
							const isLost = s.is_lost_stage;

							let bg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
							let hoverBg = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)';
							
							if (isCurrent) {
								bg = isLost ? theme.palette.error.main : (isWon ? theme.palette.success.main : theme.palette.primary.main);
								hoverBg = bg;
							} else if (isCompleted) {
								bg = alpha(theme.palette.primary.main, 0.4);
								hoverBg = alpha(theme.palette.primary.main, 0.6);
							}

							return (
								<Tooltip key={s.id} title={`${s.name} (${s.probability}%)`}>
									<Box
										onClick={() => handleStageChange(s.id)}
										sx={{
											flex: 1,
											height: 8,
											borderRadius: '4px',
											bgcolor: bg,
											cursor: 'pointer',
											transition: 'all 0.2s',
											transform: isCurrent ? 'scaleY(1.2)' : 'none',
											'&:hover': {
												bgcolor: hoverBg,
												transform: 'scaleY(1.4)'
											}
										}}
									/>
								</Tooltip>
							);
						})}
					</Stack>
				</Box>
			)}

			{/* Tabs Navigation */}
			<Tabs
				value={tab}
				onChange={(_, newValue) => setTab(newValue)}
				variant="fullWidth"
				sx={{
					borderBottom: '1px solid',
					borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
					'& .MuiTab-root': {
						textTransform: 'none',
						fontWeight: 700,
						fontSize: '0.8rem',
						minHeight: 44,
					}
				}}
			>
				<Tab label="Details" />
				<Tab label="Tasks" />
				<Tab label="Attachments" />
				<Tab label="Notes" />
			</Tabs>

			{/* Scrollable drawer body */}
			<Box sx={{ flex: 1, overflowY: 'auto', p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
				{tab === 0 && <DealDetailsTab deal={deal} owners={owners} />}
				{tab === 1 && <DealTasksTab deal={deal} />}
				{tab === 2 && <DealAttachmentsTab deal={deal} />}
				{tab === 3 && <DealNotesTab deal={deal} />}
			</Box>
		</DetailDrawer>
	);
};

export default DealDetailDrawer;
