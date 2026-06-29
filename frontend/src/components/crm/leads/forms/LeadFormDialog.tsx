import React, { useEffect, useMemo, useState } from 'react';
import {
	Box,
	TextField,
	MenuItem,
	Stack,
	Autocomplete,
	InputAdornment,
	CircularProgress,
	Dialog,
} from '@mui/material';
import { HelpOutline } from '@mui/icons-material';
import { NumericFormat } from 'react-number-format';
import { EnterpriseForm, type FormStep } from '../../../common/form';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { createLead, updateLead, searchCompanyOptions, searchContactOptions } from '../../../../store/slices/crmSlice';
import type { Lead, LeadSource, LeadPriority } from '../../../../models/crm/lead';
import type { Company } from '../../../../models/crm/company';
import type { Contact } from '../../../../models/crm/contact';
import useToast from '../../../../hooks/useToast';
import { getWorldCurrencies, getCurrencySymbol } from '../../../../utils/currency';
import RichTextEditor from '../../../common/form/RichTextEditor';
import PremiumTooltip from '../../../common/PremiumTooltip';
import TagInput from '../../shared/TagInput';
import { LEAD_SOURCES, LEAD_PRIORITIES } from '../constants';

interface LeadFormDialogProps {
	open: boolean;
	onClose: () => void;
	lead?: Lead | null;
	onSuccess: (lead: Lead) => void;
}

export const LeadFormDialog: React.FC<LeadFormDialogProps> = ({ open, onClose, lead, onSuccess }) => {
	const dispatch = useAppDispatch();
	const toast = useToast();
	const isEdit = !!lead;

	const { companyOptions, companyOptionsLoading, contactOptions, contactOptionsLoading } = useAppSelector((state) => state.crm);
	const currencies = useMemo(() => getWorldCurrencies(), []);

	const [title, setTitle] = useState('');
	const [source, setSource] = useState<LeadSource | ''>('');
	const [priority, setPriority] = useState<LeadPriority>('medium');
	const [estimatedValue, setEstimatedValue] = useState<string>('');
	const [currency, setCurrency] = useState('USD');
	const [description, setDescription] = useState('');
	const [tags, setTags] = useState<string[]>([]);
	const [company, setCompany] = useState<Company | null>(null);
	const [contact, setContact] = useState<Contact | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [touched, setTouched] = useState<{ title?: boolean; currency?: boolean }>({});

	const fieldErrors = {
		title: title.trim() ? '' : 'Title is required',
		currency: estimatedValue && !currency ? 'Select a currency for the estimated value' : '',
	};
	const isValid = !fieldErrors.title && !fieldErrors.currency;

	useEffect(() => {
		if (!open) return;
		setTitle(lead?.title || '');
		setSource(lead?.source || '');
		setPriority(lead?.priority || 'medium');
		setEstimatedValue(lead?.estimated_value != null ? String(lead.estimated_value) : '');
		setCurrency(lead?.currency || 'USD');
		setDescription(lead?.description || '');
		setTags(lead?.tags || []);
		setCompany(null);
		setContact(null);
		setError(null);
		setTouched({});
		dispatch(searchCompanyOptions(undefined));
		dispatch(searchContactOptions(undefined));
	}, [open, lead, dispatch]);

	const handleSave = async () => {
		setTouched({ title: true, currency: true });
		if (!isValid) return;

		setSubmitting(true);
		setError(null);
		try {
			const hasDescription = description.replace(/<[^>]*>/g, '').trim().length > 0;
			const payload = {
				title: title.trim(),
				source: source || undefined,
				priority,
				estimated_value: estimatedValue ? Number(estimatedValue) : undefined,
				currency,
				description: hasDescription ? description : undefined,
				tags: tags.length ? tags : undefined,
				company_id: company?.id,
				contact_id: contact?.id,
			};

			if (isEdit) {
				const result = await dispatch(
					updateLead({ publicId: lead!.public_id, payload: { ...payload, version: lead!.version } })
				).unwrap();
				toast.success('Lead updated');
				onSuccess(result);
				onClose();
			} else {
				const result = await dispatch(createLead(payload)).unwrap();
				toast.success('Lead created');
				if (result.duplicate_warning) {
					toast.warning(result.duplicate_warning);
				}
				onSuccess(result);
				onClose();
			}
		} catch (err: any) {
			if (err && typeof err === 'object' && err.status === 409) {
				toast.error('This lead was changed by someone else. Refresh to see the latest version.');
				setError(err.message);
			} else {
				setError((err && typeof err === 'object' ? err.message : err) || 'Failed to save lead');
			}
		} finally {
			setSubmitting(false);
		}
	};

	const steps: FormStep[] = [
		{
			label: 'Lead Information',
			content: (
				<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
					<TextField
						label={
							<Stack direction="row" alignItems="center" spacing={0.5}>
								<span>Title</span>
								<PremiumTooltip title="A descriptive name for this opportunity (e.g., website redesign or recruitment placement)." arrow placement="top">
									<HelpOutline sx={{ fontSize: 13, opacity: 0.6 }} />
								</PremiumTooltip>
							</Stack>
						}
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						onBlur={() => setTouched((t) => ({ ...t, title: true }))}
						error={!!touched.title && !!fieldErrors.title}
						helperText={touched.title && fieldErrors.title}
						required
						fullWidth
						size="small"
						placeholder="e.g. Website redesign for Acme"
					/>

					<Autocomplete
						options={companyOptions}
						getOptionLabel={(o) => o.name}
						loading={companyOptionsLoading}
						value={company}
						onChange={(_e, value) => setCompany(value)}
						onInputChange={(_e, value) => dispatch(searchCompanyOptions(value || undefined))}
						isOptionEqualToValue={(o, v) => o.id === v.id}
						renderInput={(params) => (
							<TextField
								{...params}
								label={
									<Stack direction="row" alignItems="center" spacing={0.5}>
										<span>Company</span>
										<PremiumTooltip title="The organization linked to this opportunity." arrow placement="top">
											<HelpOutline sx={{ fontSize: 13, opacity: 0.6 }} />
										</PremiumTooltip>
									</Stack>
								}
								size="small"
								InputProps={{
									...params.InputProps,
									endAdornment: (
										<>
											{companyOptionsLoading && <CircularProgress color="inherit" size={16} />}
											{params.InputProps.endAdornment}
										</>
									),
								}}
							/>
						)}
					/>

					<Autocomplete
						options={contactOptions}
						getOptionLabel={(o) => `${o.first_name} ${o.last_name || ''}`.trim()}
						loading={contactOptionsLoading}
						value={contact}
						onChange={(_e, value) => setContact(value)}
						onInputChange={(_e, value) => dispatch(searchContactOptions({ search: value || undefined, companyId: company?.id }))}
						isOptionEqualToValue={(o, v) => o.id === v.id}
						renderInput={(params) => (
							<TextField
								{...params}
								label={
									<Stack direction="row" alignItems="center" spacing={0.5}>
										<span>Contact Person</span>
										<PremiumTooltip title="The primary person/candidate linked to this lead." arrow placement="top">
											<HelpOutline sx={{ fontSize: 13, opacity: 0.6 }} />
										</PremiumTooltip>
									</Stack>
								}
								size="small"
								InputProps={{
									...params.InputProps,
									endAdornment: (
										<>
											{contactOptionsLoading && <CircularProgress color="inherit" size={16} />}
											{params.InputProps.endAdornment}
										</>
									),
								}}
							/>
						)}
					/>

					<Stack direction="row" spacing={2}>
						<TextField
							select
							label={
								<Stack direction="row" alignItems="center" spacing={0.5}>
									<span>Source</span>
									<PremiumTooltip title="Where this lead originated from (e.g., website, campaign, partner referral)." arrow placement="top">
										<HelpOutline sx={{ fontSize: 13, opacity: 0.6 }} />
									</PremiumTooltip>
								</Stack>
							}
							value={source}
							onChange={(e) => setSource(e.target.value as LeadSource)}
							fullWidth
							size="small"
						>
							<MenuItem value="">—</MenuItem>
							{LEAD_SOURCES.map((s) => (
								<MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>{s.replace('_', ' ')}</MenuItem>
							))}
						</TextField>

						<TextField
							select
							label={
								<Stack direction="row" alignItems="center" spacing={0.5}>
									<span>Priority</span>
									<PremiumTooltip title="The urgency or interest tier for lead outbound follow-up (high, medium, low)." arrow placement="top">
										<HelpOutline sx={{ fontSize: 13, opacity: 0.6 }} />
									</PremiumTooltip>
								</Stack>
							}
							value={priority}
							onChange={(e) => setPriority(e.target.value as LeadPriority)}
							fullWidth
							size="small"
						>
							{LEAD_PRIORITIES.map((p) => (
								<MenuItem key={p} value={p} sx={{ textTransform: 'capitalize' }}>{p}</MenuItem>
							))}
						</TextField>
					</Stack>

					<Stack direction="row" spacing={2}>
						<NumericFormat
							customInput={TextField}
							label={
								<Stack direction="row" alignItems="center" spacing={0.5}>
									<span>Estimated Value</span>
									<PremiumTooltip title="The expected budget size or deal value associated with this candidate." arrow placement="top">
										<HelpOutline sx={{ fontSize: 13, opacity: 0.6 }} />
									</PremiumTooltip>
								</Stack>
							}
							value={estimatedValue}
							onValueChange={(values) => setEstimatedValue(values.value)}
							thousandSeparator
							decimalScale={2}
							allowNegative={false}
							fullWidth
							size="small"
							InputProps={{
								startAdornment: <InputAdornment position="start">{getCurrencySymbol(currency)}</InputAdornment>,
							}}
						/>
						<Autocomplete
							options={currencies}
							getOptionLabel={(o) => `${o.code} — ${o.name}`}
							value={currencies.find((c) => c.code === currency) || null}
							onChange={(_e, value) => setCurrency(value?.code || '')}
							onBlur={() => setTouched((t) => ({ ...t, currency: true }))}
							isOptionEqualToValue={(o, v) => o.code === v.code}
							fullWidth
							renderOption={(props, option) => (
								<Box component="li" {...props} key={option.code}>
									{option.symbol} {option.code} — {option.name}
								</Box>
							)}
							renderInput={(params) => (
								<TextField
									{...params}
									label={
										<Stack direction="row" alignItems="center" spacing={0.5}>
											<span>Currency</span>
											<PremiumTooltip title="The monetary currency unit for value calculations." arrow placement="top">
												<HelpOutline sx={{ fontSize: 13, opacity: 0.6 }} />
											</PremiumTooltip>
										</Stack>
									}
									size="small"
									error={!!touched.currency && !!fieldErrors.currency}
									helperText={touched.currency && fieldErrors.currency}
								/>
							)}
						/>
					</Stack>

					<RichTextEditor
						label={
							<Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 0.75 }}>
								<span>Description</span>
								<PremiumTooltip title="Optional summary details and notes about this candidate." arrow placement="top">
									<HelpOutline sx={{ fontSize: 13, opacity: 0.6 }} />
								</PremiumTooltip>
							</Stack>
						}
						value={description}
						onChange={setDescription}
						placeholder="Add notes about this opportunity..."
					/>

					<TagInput
						value={tags}
						onChange={setTags}
						label="Tags"
						placeholder="e.g. q3-campaign, hot-lead — press Enter to add"
					/>
				</Box>
			)
		}
	];

	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth="sm"
			fullWidth
			PaperProps={{ sx: { borderRadius: 0, boxShadow: 'none', bgcolor: 'transparent' } }}
		>
			<EnterpriseForm
				title={isEdit ? 'Edit Lead' : 'New Lead'}
				subtitle={isEdit ? lead?.title : 'Capture a new sales opportunity'}
				mode={isEdit ? 'edit' : 'create'}
				steps={steps}
				onSave={handleSave}
				onCancel={onClose}
				isSubmitting={submitting}
				saveButtonText={isEdit ? 'Save Changes' : 'Create Lead'}
				error={error}
			/>
		</Dialog>
	);
};

export default LeadFormDialog;
