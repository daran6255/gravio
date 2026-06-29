import React from 'react';
import { Stack, TextField, MenuItem } from '@mui/material';
import { DatePicker } from '../../../../common/form';
import type { DealStatus } from '../../../../../models/crm/deal';
import type { Pipeline, PipelineStage } from '../../../../../models/crm/pipeline';

interface DealDetailsStepProps {
	title: string;
	setTitle: (val: string) => void;
	pipelineId: number | '';
	setPipelineId: (val: number) => void;
	pipelines: Pipeline[];
	stageId: number | '';
	setStageId: (val: number | '') => void;
	selectedPipeline?: Pipeline;
	ownerId: number | '';
	setOwnerId: (val: number | '') => void;
	owners: any[];
	closeDate: string;
	setCloseDate: (val: string) => void;
	status: DealStatus;
	setStatus: (val: DealStatus) => void;
	lostReason: string;
	setLostReason: (val: string) => void;
	touched: { title?: boolean; pipelineId?: boolean; stageId?: boolean };
	fieldErrors: { title: string; pipelineId: string; stageId: string };
	DEAL_STATUSES: { value: DealStatus; label: string }[];
}

export const DealDetailsStep: React.FC<DealDetailsStepProps> = ({
	title,
	setTitle,
	pipelineId,
	setPipelineId,
	pipelines,
	stageId,
	setStageId,
	selectedPipeline,
	ownerId,
	setOwnerId,
	owners,
	closeDate,
	setCloseDate,
	status,
	setStatus,
	lostReason,
	setLostReason,
	touched,
	fieldErrors,
	DEAL_STATUSES,
}) => {
	return (
		<Stack spacing={2.5} sx={{ mt: 1 }}>
			<TextField
				label="Deal Title"
				required
				fullWidth
				value={title}
				onChange={(e) => setTitle(e.target.value)}
				error={touched.title && !!fieldErrors.title}
				helperText={touched.title && fieldErrors.title}
				slotProps={{ htmlInput: { maxLength: 255 } }}
			/>

			<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
				<TextField
					select
					label="Pipeline"
					required
					fullWidth
					value={pipelineId}
					onChange={(e) => setPipelineId(Number(e.target.value))}
					error={touched.pipelineId && !!fieldErrors.pipelineId}
					helperText={touched.pipelineId && fieldErrors.pipelineId}
				>
					{pipelines.map((p) => (
						<MenuItem key={p.id} value={p.id}>
							{p.name}
						</MenuItem>
					))}
				</TextField>

				<TextField
					select
					label="Stage"
					required
					fullWidth
					value={stageId}
					onChange={(e) => setStageId(Number(e.target.value))}
					error={touched.stageId && !!fieldErrors.stageId}
					helperText={touched.stageId && fieldErrors.stageId}
					disabled={!pipelineId}
				>
					{selectedPipeline?.stages?.map((s: PipelineStage) => (
						<MenuItem key={s.id} value={s.id}>
							{s.name} ({s.probability}%)
						</MenuItem>
					))}
				</TextField>
			</Stack>

			<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
				<TextField
					select
					label="Owner"
					fullWidth
					value={ownerId}
					onChange={(e) => setOwnerId(e.target.value ? Number(e.target.value) : '')}
				>
					<MenuItem value="">Unassigned</MenuItem>
					{owners.map((o) => (
						<MenuItem key={o.id} value={o.id}>
							{o.full_name || o.email}
						</MenuItem>
					))}
				</TextField>

				<DatePicker
					label="Expected Close Date"
					value={closeDate}
					onChange={setCloseDate}
				/>
			</Stack>

			<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
				<TextField
					select
					label="Status"
					fullWidth
					value={status}
					onChange={(e) => setStatus(e.target.value as DealStatus)}
				>
					{DEAL_STATUSES.map((s) => (
						<MenuItem key={s.value} value={s.value}>
							{s.label}
						</MenuItem>
					))}
				</TextField>

				{status === 'lost' && (
					<TextField
						label="Lost Reason"
						fullWidth
						required
						value={lostReason}
						onChange={(e) => setLostReason(e.target.value)}
						slotProps={{ htmlInput: { maxLength: 500 } }}
					/>
				)}
			</Stack>
		</Stack>
	);
};

export default DealDetailsStep;
