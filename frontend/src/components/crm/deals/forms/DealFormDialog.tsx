import React, { useEffect, useMemo, useState } from 'react';
import {
	Box,
	TextField,
	MenuItem,
	Button,
	Stack,
	Autocomplete,
	InputAdornment,
	CircularProgress,
	Alert,
} from '@mui/material';
import { HelpOutline } from '@mui/icons-material';
import { NumericFormat } from 'react-number-format';
import BaseDialog from '../../../common/dialogbox/BaseDialog';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { createDeal, updateDeal, searchCompanyOptions, searchContactOptions, fetchOwners } from '../../../../store/slices/crmSlice';
import type { Deal, DealStatus } from '../../../../models/crm/deal';
import type { Company } from '../../../../models/crm/company';
import type { Contact } from '../../../../models/crm/contact';
import useToast from '../../../../hooks/useToast';
import { getWorldCurrencies, getCurrencySymbol } from '../../../../utils/currency';
import RichTextEditor from '../../../common/form/RichTextEditor';
import PremiumTooltip from '../../../common/PremiumTooltip';
import TagInput from '../../shared/TagInput';

interface DealFormDialogProps {
	open: boolean;
	onClose: () => void;
	deal?: Deal | null;
	activePipelineId: number | null;
	onSuccess: (deal: Deal) => void;
}

const DEAL_STATUSES: { value: DealStatus; label: string }[] = [
	{ value: 'open', label: 'Open' },
	{ value: 'won', label: 'Won' },
	{ value: 'lost', label: 'Lost' },
	{ value: 'on_hold', label: 'On Hold' },
];

export const DealFormDialog: React.FC<DealFormDialogProps> = ({ open, onClose, deal, activePipelineId, onSuccess }) => {
	const dispatch = useAppDispatch();
	const toast = useToast();
	const isEdit = !!deal;

	const { companyOptions, contactOptions, owners, pipelines } = useAppSelector((state) => state.crm);
	const currencies = useMemo(() => getWorldCurrencies(), []);

	const [title, setTitle] = useState('');
	const [value, setValue] = useState<string>('');
	const [currency, setCurrency] = useState('USD');
	const [closeDate, setCloseDate] = useState<string>('');
	const [ownerId, setOwnerId] = useState<number | ''>('');
	const [pipelineId, setPipelineId] = useState<number | ''>('');
	const [stageId, setStageId] = useState<number | ''>('');
	const [status, setStatus] = useState<DealStatus>('open');
	const [lostReason, setLostReason] = useState('');
	const [description, setDescription] = useState('');
	const [tags, setTags] = useState<string[]>([]);
	const [company, setCompany] = useState<Company | null>(null);
	const [contact, setContact] = useState<Contact | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [touched, setTouched] = useState<{ title?: boolean; pipelineId?: boolean; stageId?: boolean }>({});

	const selectedPipeline = useMemo(() => {
		return pipelines.find((p) => p.id === pipelineId);
	}, [pipelines, pipelineId]);

	const fieldErrors = {
		title: title.trim() ? '' : 'Title is required',
		pipelineId: pipelineId ? '' : 'Pipeline is required',
		stageId: stageId ? '' : 'Stage is required',
	};

	const isValid = !fieldErrors.title && !fieldErrors.pipelineId && !fieldErrors.stageId;

	useEffect(() => {
		if (!open) return;
		dispatch(searchCompanyOptions(undefined));
		dispatch(searchContactOptions(undefined));
		dispatch(fetchOwners());

		if (deal) {
			setTitle(deal.title);
			setValue(deal.value != null ? String(deal.value) : '');
			setCurrency(deal.currency || 'USD');
			setCloseDate(deal.close_date ? deal.close_date.split('T')[0] : '');
			setOwnerId(deal.owner_id || '');
			setPipelineId(deal.pipeline_id || '');
			setStageId(deal.stage_id || '');
			setStatus(deal.status || 'open');
			setLostReason(deal.lost_reason || '');
			setDescription(deal.custom_fields?.description || '');
			setTags(deal.tags || []);
			// Resolve company/contact options if loaded
			const comp = companyOptions.find((c) => c.id === deal.company_id);
			if (comp) setCompany(comp);
			else setCompany(null);

			const cont = contactOptions.find((c) => c.id === deal.contact_id);
			if (cont) setContact(cont);
			else setContact(null);
		} else {
			setTitle('');
			setValue('');
			setCurrency('USD');
			setCloseDate('');
			setOwnerId('');
			setPipelineId(activePipelineId || '');
			setStatus('open');
			setLostReason('');
			setDescription('');
			setTags([]);
			setCompany(null);
			setContact(null);

			const activePipe = pipelines.find((p) => p.id === activePipelineId) || pipelines[0];
			if (activePipe) {
				setPipelineId(activePipe.id);
				if (activePipe.stages?.length) setStageId(activePipe.stages[0].id);
			} else {
				setStageId('');
			}
		}
		setError(null);
		setTouched({});
	}, [open, deal, activePipelineId, pipelines, dispatch]);

	// Auto select first stage of a newly selected pipeline
	useEffect(() => {
		if (!open || isEdit) return;
		if (selectedPipeline && selectedPipeline.stages?.length) {
			setStageId(selectedPipeline.stages[0].id);
		} else {
			setStageId('');
		}
	}, [selectedPipeline, open, isEdit]);

	const handleSave = async () => {
		setTouched({ title: true, pipelineId: true, stageId: true });
		if (!isValid) return;

		setSubmitting(true);
		setError(null);
		try {
			const hasDescription = description.replace(/<[^>]*>/g, '').trim().length > 0;
			const payload = {
				title: title.trim(),
				value: value ? Number(value) : undefined,
				currency,
				close_date: closeDate || undefined,
				owner_id: ownerId || undefined,
				pipeline_id: Number(pipelineId),
				stage_id: Number(stageId),
				status,
				lost_reason: status === 'lost' ? lostReason.trim() : undefined,
				tags: tags.length ? tags : undefined,
				company_id: company?.id || undefined,
				contact_id: contact?.id || undefined,
				custom_fields: hasDescription ? { description } : undefined,
			};

			let result: Deal;
			if (isEdit && deal) {
				result = await dispatch(updateDeal({ publicId: deal.public_id, payload })).unwrap();
				toast.success('Deal updated successfully');
			} else {
				result = await dispatch(createDeal(payload)).unwrap();
				toast.success('Deal created successfully');
			}

			onSuccess(result);
			onClose();
		} catch (err: any) {
			setError(err || 'Failed to save deal');
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<BaseDialog
			open={open}
			onClose={onClose}
			title={isEdit ? 'Edit Deal' : 'New Deal'}
			subtitle={isEdit ? 'Modify deal information' : 'Create a new sales opportunity'}
			maxWidth="md"
			actions={
				<Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ width: '100%' }}>
					<Button onClick={onClose} disabled={submitting} sx={{ textTransform: 'none', fontWeight: 600 }}>
						Cancel
					</Button>
					<Button
						onClick={handleSave}
						variant="contained"
						disabled={submitting}
						sx={{
							textTransform: 'none',
							fontWeight: 600,
							borderRadius: '8px',
							minWidth: 100,
						}}
					>
						{submitting ? <CircularProgress size={20} color="inherit" /> : 'Save'}
					</Button>
				</Stack>
			}
		>
			<Stack spacing={2.5} sx={{ mt: 1 }}>
				{error && <Alert severity="error">{error}</Alert>}

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
					<NumericFormat
						customInput={TextField}
						label="Deal Value"
						fullWidth
						value={value}
						onValueChange={(values) => setValue(values.value)}
						thousandSeparator
						decimalScale={2}
						allowNegative={false}
						slotProps={{
							input: {
								startAdornment: (
									<InputAdornment position="start">
										{getCurrencySymbol(currency)}
									</InputAdornment>
								),
							},
						}}
					/>

					<TextField
						select
						label="Currency"
						value={currency}
						onChange={(e) => setCurrency(e.target.value)}
						sx={{ minWidth: 120 }}
					>
						{currencies.map((c) => (
							<MenuItem key={c.code} value={c.code}>
								{c.code} ({c.symbol})
							</MenuItem>
						))}
					</TextField>
				</Stack>

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
						{selectedPipeline?.stages?.map((s) => (
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

					<TextField
						type="date"
						label="Expected Close Date"
						fullWidth
						value={closeDate}
						onChange={(e) => setCloseDate(e.target.value)}
						slotProps={{ inputLabel: { shrink: true } }}
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

				<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
					<Autocomplete
						options={companyOptions}
						getOptionLabel={(option) => option.name}
						value={company}
						onChange={(_e, val) => setCompany(val)}
						loading={companyOptions.length === 0}
						onInputChange={(_e, val) => dispatch(searchCompanyOptions(val || undefined))}
						fullWidth
						renderInput={(params) => (
							<TextField {...params} label="Linked Company" placeholder="Type to search companies..." />
						)}
					/>

					<Autocomplete
						options={contactOptions}
						getOptionLabel={(option) => `${option.first_name} ${option.last_name || ''}`}
						value={contact}
						onChange={(_e, val) => setContact(val)}
						loading={contactOptions.length === 0}
						onInputChange={(_e, val) => dispatch(searchContactOptions(val ? { search: val } : undefined))}
						fullWidth
						renderInput={(params) => (
							<TextField {...params} label="Linked Contact" placeholder="Type to search contacts..." />
						)}
					/>
				</Stack>

				<Box>
					<Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 1 }}>
						<Box component="span" sx={{ fontSize: '0.85rem', fontWeight: 600, color: 'text.secondary' }}>
							Description
						</Box>
						<PremiumTooltip title="Detailed details regarding deal qualifications, custom requirements, or sales logs." arrow placement="right">
							<HelpOutline sx={{ fontSize: 14, color: 'text.secondary', opacity: 0.7, cursor: 'pointer' }} />
						</PremiumTooltip>
					</Stack>
					<RichTextEditor value={description} onChange={setDescription} minHeight={140} />
				</Box>

				<Box>
					<Box sx={{ mb: 1, fontSize: '0.85rem', fontWeight: 600, color: 'text.secondary' }}>Tags</Box>
					<TagInput value={tags} onChange={setTags} placeholder="Add tag and press Enter..." />
				</Box>
			</Stack>
		</BaseDialog>
	);
};

export default DealFormDialog;
