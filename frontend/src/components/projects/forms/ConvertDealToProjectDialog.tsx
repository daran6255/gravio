import React, { useState, useEffect } from 'react';
import { TextField, Button, Stack, CircularProgress, Alert, InputAdornment, Typography } from '@mui/material';
import { BaseDialog } from '../../common/dialogbox';
import { DatePicker } from '../../common/form';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { convertDealToProject } from '../../../store/slices/projectsSlice';
import type { Deal } from '../../../models/crm/deal';
import type { Project, DealProjectConversionPreview } from '../../../models/projects/project';
import useToast from '../../../hooks/useToast';
import crmService from '../../../services/crmService';
import { getCurrencySymbol, formatMoney } from '../../../utils/currency';
import dayjs from 'dayjs';

interface ConvertDealToProjectDialogProps {
	open: boolean;
	onClose: () => void;
	deal: Deal | null;
	onConverted: (project: Project) => void;
}

export const ConvertDealToProjectDialog: React.FC<ConvertDealToProjectDialogProps> = ({ open, onClose, deal, onConverted }) => {
	const dispatch = useAppDispatch();
	const toast = useToast();
	const { convertLoading, convertError } = useAppSelector((state) => state.projects);

	const [name, setName] = useState('');
	const [budget, setBudget] = useState('');
	const [startDate, setStartDate] = useState<string | null>(null);
	const [endDate, setEndDate] = useState<string | null>(null);

	const [preview, setPreview] = useState<DealProjectConversionPreview | null>(null);
	const [loadingPreview, setLoadingPreview] = useState(false);

	useEffect(() => {
		if (open && deal) {
			setName(deal.title);
			setStartDate(null);
			setEndDate(null);
			setPreview(null);
			setLoadingPreview(true);

			crmService.getDealProjectConversionPreview(deal.public_id)
				.then((p) => {
					setPreview(p);
					if (p.converted && p.converted_value != null) {
						setBudget(String(p.converted_value));
					} else {
						setBudget(deal.value != null ? String(deal.value) : '');
					}
				})
				.catch((err) => {
					console.error('Failed to load project conversion preview', err);
					setBudget(deal.value != null ? String(deal.value) : '');
				})
				.finally(() => {
					setLoadingPreview(false);
				});
		} else {
			setPreview(null);
			setBudget('');
		}
	}, [open, deal]);

	const handleConvert = async () => {
		if (!deal) return;
		try {
			const project = await dispatch(convertDealToProject({
				dealPublicId: deal.public_id,
				payload: {
					name: name.trim() || undefined,
					budget: budget ? Number(budget) : undefined,
					start_date: startDate || undefined,
					end_date: endDate || undefined,
				},
			})).unwrap();
			toast.success('Deal converted to a project 🎉');
			onConverted(project);
			onClose();
		} catch {
			// convertError is surfaced via the dialog's Alert below
		}
	};

	return (
		<BaseDialog
			open={open}
			onClose={onClose}
			title="Convert to Project"
			subtitle={deal ? `Start tracking delivery work for "${deal.title}"` : undefined}
			maxWidth="sm"
			loading={convertLoading}
			actions={
				<>
					<Button onClick={onClose} disabled={convertLoading} sx={{ textTransform: 'none', fontWeight: 600 }}>
						Cancel
					</Button>
					<Button
						variant="contained"
						onClick={handleConvert}
						disabled={convertLoading || loadingPreview || !name.trim()}
						sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '10px', px: 3 }}
					>
						{convertLoading ? <CircularProgress size={20} color="inherit" /> : 'Convert'}
					</Button>
				</>
			}
		>
			<Stack spacing={2.5}>
				{convertError && <Alert severity="error">{convertError}</Alert>}

				<TextField
					label="Project Name"
					value={name}
					onChange={(e) => setName(e.target.value)}
					fullWidth
					size="small"
					required
				/>

				<Stack direction="row" spacing={2}>
					<DatePicker label="Start Date" value={startDate} onChange={(v) => setStartDate(v || null)} format="DD-MMM-YYYY" size="small" />
					<DatePicker label="End Date" value={endDate} onChange={(v) => setEndDate(v || null)} format="DD-MMM-YYYY" size="small" minDate={startDate || undefined} />
				</Stack>

				<TextField
					label="Budget"
					type="number"
					value={budget}
					onChange={(e) => setBudget(e.target.value)}
					fullWidth
					size="small"
					disabled={loadingPreview}
					InputProps={{
						startAdornment: (
							<InputAdornment position="start">
								{loadingPreview ? (
									<CircularProgress size={16} />
								) : (
									getCurrencySymbol(preview?.target_currency || deal?.currency)
								)}
							</InputAdornment>
						),
						endAdornment: preview?.target_currency ? (
							<InputAdornment position="end" sx={{ fontWeight: 'bold', fontSize: '0.85rem' }}>
								{preview.target_currency}
							</InputAdornment>
						) : undefined,
					}}
					helperText={
						preview?.converted && preview.original_value != null && preview.rate && preview.rate_date ? (
							<Typography variant="caption" color="text.secondary" component="span" display="block" sx={{ mt: 0.5 }}>
								Converted from{' '}
								<strong>
									{formatMoney(preview.original_value, preview.original_currency)}
								</strong>{' '}
								at the rate of 1 {preview.original_currency} = {preview.rate.toFixed(4)}{' '}
								{preview.target_currency} (rate as of{' '}
								{dayjs(preview.rate_date).format('DD-MMM-YYYY')})
							</Typography>
						) : undefined
					}
				/>
			</Stack>
		</BaseDialog>
	);
};

export default ConvertDealToProjectDialog;
