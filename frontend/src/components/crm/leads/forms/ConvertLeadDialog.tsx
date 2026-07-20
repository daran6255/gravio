import React, { useEffect, useMemo, useState } from 'react';
import { Box, TextField, MenuItem, Stack, CircularProgress, Alert, Typography } from '@mui/material';
import BaseDialog from '../../../common/dialogbox/BaseDialog';
import { CancelButton, SubmitButton } from '../../../common/button';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { fetchPipelines, convertLead } from '../../../../store/slices/crmSlice';
import type { Lead } from '../../../../models/crm/lead';
import type { Deal } from '../../../../models/crm/deal';
import useToast from '../../../../hooks/useToast';

interface ConvertLeadDialogProps {
	open: boolean;
	onClose: () => void;
	lead: Lead | null;
	onConverted: (deal: Deal) => void;
}

export const ConvertLeadDialog: React.FC<ConvertLeadDialogProps> = ({ open, onClose, lead, onConverted }) => {
	const dispatch = useAppDispatch();
	const toast = useToast();
	const { pipelines, pipelinesLoading, convertLoading, convertError } = useAppSelector((state) => state.crm);

	const [pipelineId, setPipelineId] = useState<number | ''>('');
	const [stageId, setStageId] = useState<number | ''>('');
	const [dealTitle, setDealTitle] = useState('');
	const [value, setValue] = useState('');

	useEffect(() => {
		if (!open || !lead) return;
		dispatch(fetchPipelines());
		setDealTitle(`Deal: ${lead.title}`);
		setValue(lead.estimated_value != null ? String(lead.estimated_value) : '');
		setPipelineId('');
		setStageId('');
	}, [open, lead, dispatch]);

	// Auto-select the org's default pipeline (and its first stage) once pipelines load.
	useEffect(() => {
		if (!pipelines.length || pipelineId !== '') return;
		const defaultPipeline = pipelines.find((p) => p.is_default) || pipelines[0];
		if (defaultPipeline) {
			setPipelineId(defaultPipeline.id);
			if (defaultPipeline.stages.length) setStageId(defaultPipeline.stages[0].id);
		}
	}, [pipelines, pipelineId]);

	const selectedPipeline = useMemo(() => pipelines.find((p) => p.id === pipelineId), [pipelines, pipelineId]);

	const handleConvert = async () => {
		if (!lead || pipelineId === '' || stageId === '') return;
		try {
			const result = await dispatch(convertLead({
				publicId: lead.public_id,
				payload: {
					pipeline_id: pipelineId,
					stage_id: stageId,
					deal_title: dealTitle || undefined,
					value: value ? Number(value) : undefined,
				},
			})).unwrap();
			toast.success('Lead converted to deal');
			onConverted(result.deal);
			onClose();
		} catch {
			// convertError is surfaced via the dialog's Alert below
		}
	};

	return (
		<BaseDialog
			open={open}
			onClose={onClose}
			title="Convert to Deal"
			subtitle={lead ? `Move "${lead.title}" into your sales pipeline` : undefined}
			maxWidth="sm"
			loading={convertLoading}
			actions={
				<>
					<CancelButton onClick={onClose} disabled={convertLoading} sx={{ fontWeight: 600 }} />
					<SubmitButton
						onClick={handleConvert}
						loading={convertLoading}
						disabled={pipelineId === '' || stageId === ''}
						sx={{ borderRadius: '10px', px: 3 }}
					>
						Convert
					</SubmitButton>
				</>
			}
		>
			{pipelinesLoading ? (
				<Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
					<CircularProgress size={28} />
				</Box>
			) : pipelines.length === 0 ? (
				<Typography variant="body2" color="text.secondary">No pipelines found for your organization.</Typography>
			) : (
				<Stack spacing={2.5}>
					{convertError && <Alert severity="error">{convertError}</Alert>}

					<TextField
						label="Deal Title"
						value={dealTitle}
						onChange={(e) => setDealTitle(e.target.value)}
						fullWidth
						size="small"
					/>

					<Stack direction="row" spacing={2}>
						<TextField
							select
							label="Pipeline"
							value={pipelineId}
							onChange={(e) => { setPipelineId(Number(e.target.value)); setStageId(''); }}
							fullWidth
							size="small"
						>
							{pipelines.map((p) => (
								<MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
							))}
						</TextField>

						<TextField
							select
							label="Stage"
							value={stageId}
							onChange={(e) => setStageId(Number(e.target.value))}
							fullWidth
							size="small"
							disabled={!selectedPipeline}
						>
							{selectedPipeline?.stages.map((s) => (
								<MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
							))}
						</TextField>
					</Stack>

					<TextField
						label="Deal Value"
						type="number"
						value={value}
						onChange={(e) => setValue(e.target.value)}
						fullWidth
						size="small"
					/>
				</Stack>
			)}
		</BaseDialog>
	);
};

export default ConvertLeadDialog;
