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
import { NumericFormat } from 'react-number-format';
import BaseDialog from '../../../common/dialogbox/BaseDialog';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { createLead, updateLead, searchCompanyOptions, searchContactOptions } from '../../../../store/slices/crmSlice';
import type { Lead, LeadSource, LeadPriority } from '../../../../models/crm/lead';
import type { Company } from '../../../../models/crm/company';
import type { Contact } from '../../../../models/crm/contact';
import useToast from '../../../../hooks/useToast';
import { getWorldCurrencies, getCurrencySymbol } from '../../../../utils/currency';
import RichTextEditor from '../../../common/form/RichTextEditor';
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
				company_id: company?.id,
				contact_id: contact?.id,
			};

			const result = isEdit
				? await dispatch(updateLead({ publicId: lead!.public_id, payload })).unwrap()
				: await dispatch(createLead(payload)).unwrap();

			toast.success(isEdit ? 'Lead updated' : 'Lead created');
			onSuccess(result);
			onClose();
		} catch (err: any) {
			setError(err || 'Failed to save lead');
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<BaseDialog
			open={open}
			onClose={onClose}
			title={isEdit ? 'Edit Lead' : 'New Lead'}
			subtitle={isEdit ? lead?.title : 'Capture a new sales opportunity'}
			maxWidth="sm"
			loading={submitting}
			actions={
				<>
					<Button onClick={onClose} disabled={submitting} sx={{ textTransform: 'none', fontWeight: 600 }}>
						Cancel
					</Button>
					<Button
						variant="contained"
						onClick={handleSave}
						disabled={submitting || !isValid}
						sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '10px', px: 3 }}
					>
						{submitting ? <CircularProgress size={20} color="inherit" /> : isEdit ? 'Save Changes' : 'Create Lead'}
					</Button>
				</>
			}
		>
			<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
				{error && <Alert severity="error">{error}</Alert>}

				<TextField
					label="Title"
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
							label="Company"
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
							label="Contact"
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
						label="Source"
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
						label="Priority"
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
						label="Estimated Value"
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
								label="Currency"
								size="small"
								error={!!touched.currency && !!fieldErrors.currency}
								helperText={touched.currency && fieldErrors.currency}
							/>
						)}
					/>
				</Stack>

				<RichTextEditor
					label="Description"
					value={description}
					onChange={setDescription}
					placeholder="Add notes about this opportunity..."
				/>
			</Box>
		</BaseDialog>
	);
};

export default LeadFormDialog;
