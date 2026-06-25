import React, { useEffect, useState } from 'react';
import {
	Box,
	TextField,
	Button,
	IconButton,
	Stack,
	Checkbox,
	FormControlLabel,
	Typography,
	CircularProgress,
	Alert,
	Tooltip,
} from '@mui/material';
import { Add, DeleteOutline, ArrowUpward, ArrowDownward } from '@mui/icons-material';
import BaseDialog from '../../../common/dialogbox/BaseDialog';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { updatePipelineStages } from '../../../../store/slices/crmSlice';
import useToast from '../../../../hooks/useToast';
import type { Pipeline, PipelineStageUpsert } from '../../../../models/crm/pipeline';

interface StageManagementDialogProps {
	open: boolean;
	onClose: () => void;
	pipeline: Pipeline | undefined;
}

const blankStage = (order: number): PipelineStageUpsert => ({
	name: '',
	order,
	probability: 10,
	color: '#808080',
	is_won_stage: false,
	is_lost_stage: false,
});

export const StageManagementDialog: React.FC<StageManagementDialogProps> = ({ open, onClose, pipeline }) => {
	const dispatch = useAppDispatch();
	const toast = useToast();
	const { pipelineMutationLoading } = useAppSelector((state) => state.crm);

	const [stages, setStages] = useState<PipelineStageUpsert[]>([]);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (open && pipeline) {
			setStages(pipeline.stages.map((s) => ({ ...s })));
			setError(null);
		}
	}, [open, pipeline]);

	const updateStage = (index: number, patch: Partial<PipelineStageUpsert>) => {
		setStages((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
	};

	const removeStage = (index: number) => {
		setStages((prev) => prev.filter((_, i) => i !== index));
	};

	const addStage = () => {
		setStages((prev) => [...prev, blankStage(prev.length)]);
	};

	const moveStage = (index: number, direction: -1 | 1) => {
		setStages((prev) => {
			const next = [...prev];
			const target = index + direction;
			if (target < 0 || target >= next.length) return prev;
			[next[index], next[target]] = [next[target], next[index]];
			return next;
		});
	};

	const handleSave = async () => {
		if (!pipeline) return;
		if (stages.some((s) => !s.name.trim())) {
			setError('Every stage needs a name');
			return;
		}
		setError(null);
		try {
			await dispatch(updatePipelineStages({
				pipelineId: pipeline.id,
				stages: stages.map((s, i) => ({ ...s, order: i })),
			})).unwrap();
			toast.success('Pipeline stages updated');
			onClose();
		} catch (err: any) {
			setError(err || 'Failed to update stages');
		}
	};

	return (
		<BaseDialog
			open={open}
			onClose={onClose}
			title="Manage Pipeline Stages"
			subtitle={pipeline?.name}
			maxWidth="md"
			loading={pipelineMutationLoading}
			actions={
				<>
					<Button onClick={onClose} disabled={pipelineMutationLoading} sx={{ textTransform: 'none', fontWeight: 600 }}>
						Cancel
					</Button>
					<Button
						variant="contained"
						onClick={handleSave}
						disabled={pipelineMutationLoading}
						sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '10px', px: 3 }}
					>
						{pipelineMutationLoading ? <CircularProgress size={20} color="inherit" /> : 'Save Changes'}
					</Button>
				</>
			}
		>
			<Stack spacing={2}>
				{error && <Alert severity="error">{error}</Alert>}

				{stages.map((stage, index) => (
					<Stack key={index} direction="row" spacing={1.5} alignItems="center">
						<Stack direction="column" spacing={0}>
							<IconButton size="small" disabled={index === 0} onClick={() => moveStage(index, -1)}>
								<ArrowUpward fontSize="inherit" />
							</IconButton>
							<IconButton size="small" disabled={index === stages.length - 1} onClick={() => moveStage(index, 1)}>
								<ArrowDownward fontSize="inherit" />
							</IconButton>
						</Stack>

						<TextField
							value={stage.color}
							onChange={(e) => updateStage(index, { color: e.target.value })}
							type="color"
							size="small"
							sx={{ width: 56 }}
						/>

						<TextField
							value={stage.name}
							onChange={(e) => updateStage(index, { name: e.target.value })}
							placeholder="Stage name"
							size="small"
							sx={{ flex: 1 }}
						/>

						<TextField
							value={stage.probability}
							onChange={(e) => updateStage(index, { probability: Number(e.target.value) })}
							type="number"
							label="Win %"
							size="small"
							sx={{ width: 90 }}
							inputProps={{ min: 0, max: 100 }}
						/>

						<Tooltip title="Deals reaching this stage count as Won">
							<FormControlLabel
								control={
									<Checkbox
										size="small"
										checked={stage.is_won_stage}
										onChange={(e) => updateStage(index, { is_won_stage: e.target.checked, is_lost_stage: e.target.checked ? false : stage.is_lost_stage })}
									/>
								}
								label="Won"
								sx={{ mr: 0 }}
							/>
						</Tooltip>

						<Tooltip title="Deals reaching this stage count as Lost">
							<FormControlLabel
								control={
									<Checkbox
										size="small"
										checked={stage.is_lost_stage}
										onChange={(e) => updateStage(index, { is_lost_stage: e.target.checked, is_won_stage: e.target.checked ? false : stage.is_won_stage })}
									/>
								}
								label="Lost"
								sx={{ mr: 0 }}
							/>
						</Tooltip>

						<IconButton size="small" onClick={() => removeStage(index)} color="error">
							<DeleteOutline fontSize="small" />
						</IconButton>
					</Stack>
				))}

				<Box>
					<Button startIcon={<Add />} onClick={addStage} sx={{ textTransform: 'none', fontWeight: 600 }}>
						Add Stage
					</Button>
				</Box>

				{stages.length === 0 && (
					<Typography variant="body2" color="text.secondary">
						This pipeline has no stages. Add at least one to use it.
					</Typography>
				)}
			</Stack>
		</BaseDialog>
	);
};

export default StageManagementDialog;
