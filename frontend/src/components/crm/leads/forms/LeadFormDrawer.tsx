import React, { useEffect, useState } from 'react';
import {
	Box,
	TextField,
	MenuItem,
	Button,
	Stack,
	Autocomplete,
	CircularProgress,
	Alert,
} from '@mui/material';
import DetailDrawer from '../../../common/drawer/DetailDrawer';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { createLead, updateLead, searchCompanyOptions, searchContactOptions } from '../../../../store/slices/crmSlice';
import type { Lead, LeadSource, LeadPriority } from '../../../../models/lead';
import type { Company } from '../../../../models/company';
import type { Contact } from '../../../../models/contact';
import useToast from '../../../../hooks/useToast';

const LEAD_SOURCES: LeadSource[] = ['website', 'referral', 'cold_call', 'linkedin', 'ad', 'event', 'other'];
const LEAD_PRIORITIES: LeadPriority[] = ['low', 'medium', 'high', 'urgent'];

interface LeadFormDrawerProps {
	open: boolean;
	onClose: () => void;
	lead?: Lead | null;
	onSuccess: (lead: Lead) => void;
}

export const LeadFormDrawer: React.FC<LeadFormDrawerProps> = ({ open, onClose, lead, onSuccess }) => {
	const dispatch = useAppDispatch();
	const toast = useToast();
	const isEdit = !!lead;

	const { companyOptions, companyOptionsLoading, contactOptions, contactOptionsLoading } = useAppSelector((state) => state.crm);

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
		dispatch(searchCompanyOptions(undefined));
		dispatch(searchContactOptions(undefined));
	}, [open, lead, dispatch]);

	const handleSave = async () => {
		if (!title.trim()) {
			setError('Title is required');
			return;
		}
		setSubmitting(true);
		setError(null);
		try {
			const payload = {
				title: title.trim(),
				source: source || undefined,
				priority,
				estimated_value: estimatedValue ? Number(estimatedValue) : undefined,
				currency,
				description: description || undefined,
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
		<DetailDrawer
			open={open}
			onClose={onClose}
			title={isEdit ? 'Edit Lead' : 'New Lead'}
			subtitle={isEdit ? lead?.title : 'Capture a new sales opportunity'}
		>
			<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, overflowY: 'auto', flex: 1 }}>
				{error && <Alert severity="error">{error}</Alert>}

				<TextField
					label="Title"
					value={title}
					onChange={(e) => setTitle(e.target.value)}
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
					<TextField
						label="Estimated Value"
						type="number"
						value={estimatedValue}
						onChange={(e) => setEstimatedValue(e.target.value)}
						fullWidth
						size="small"
					/>
					<TextField
						label="Currency"
						value={currency}
						onChange={(e) => setCurrency(e.target.value.toUpperCase())}
						fullWidth
						size="small"
						inputProps={{ maxLength: 10 }}
					/>
				</Stack>

				<TextField
					label="Description"
					value={description}
					onChange={(e) => setDescription(e.target.value)}
					fullWidth
					multiline
					minRows={3}
					size="small"
				/>

				<Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ mt: 2 }}>
					<Button onClick={onClose} disabled={submitting} sx={{ textTransform: 'none', fontWeight: 600 }}>
						Cancel
					</Button>
					<Button
						variant="contained"
						onClick={handleSave}
						disabled={submitting}
						sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '10px', px: 3 }}
					>
						{submitting ? <CircularProgress size={20} color="inherit" /> : isEdit ? 'Save Changes' : 'Create Lead'}
					</Button>
				</Stack>
			</Box>
		</DetailDrawer>
	);
};

export default LeadFormDrawer;
