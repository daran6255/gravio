import React, { useEffect, useState } from 'react';
import { TextField, Stack } from '@mui/material';
import BaseDialog from '../../../common/dialogbox/BaseDialog';
import { CancelButton, SubmitButton } from '../../../common/button';
import { useAppDispatch } from '../../../../store/hooks';
import { updateDeal } from '../../../../store/slices/crmSlice';
import useToast from '../../../../hooks/useToast';
import type { Deal } from '../../../../models/crm/deal';
import type { PipelineStage } from '../../../../models/crm/pipeline';

interface WonLostDialogProps {
	open: boolean;
	onClose: () => void;
	deal: Deal | null;
	targetStage: PipelineStage | null;
}

/** Confirms moving a deal into a "Lost" stage and captures the reason — Won stages move directly without a prompt. */
export const WonLostDialog: React.FC<WonLostDialogProps> = ({ open, onClose, deal, targetStage }) => {
	const dispatch = useAppDispatch();
	const toast = useToast();
	const [reason, setReason] = useState('');
	const [submitting, setSubmitting] = useState(false);

	useEffect(() => {
		if (open) setReason('');
	}, [open]);

	const handleConfirm = async () => {
		if (!deal || !targetStage) return;
		setSubmitting(true);
		try {
			await dispatch(updateDeal({
				publicId: deal.public_id,
				payload: { stage_id: targetStage.id, lost_reason: reason || undefined },
			})).unwrap();
			toast.success('Deal marked as lost');
			onClose();
		} catch (err: any) {
			toast.error(err || 'Failed to update deal');
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<BaseDialog
			open={open}
			onClose={onClose}
			title="Mark Deal as Lost"
			subtitle={deal ? `Moving "${deal.title}" to ${targetStage?.name}` : undefined}
			maxWidth="sm"
			loading={submitting}
			actions={
				<>
					<CancelButton onClick={onClose} disabled={submitting} sx={{ fontWeight: 600 }} />
					<SubmitButton
						color="error"
						onClick={handleConfirm}
						loading={submitting}
						sx={{ borderRadius: '10px', px: 3 }}
					>
						Mark as Lost
					</SubmitButton>
				</>
			}
		>
			<Stack spacing={2}>
				<TextField
					label="Reason (optional)"
					value={reason}
					onChange={(e) => setReason(e.target.value)}
					fullWidth
					multiline
					minRows={3}
					placeholder="e.g. Went with a competitor, budget cut, no response..."
				/>
			</Stack>
		</BaseDialog>
	);
};

export default WonLostDialog;
